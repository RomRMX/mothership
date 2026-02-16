import Foundation
import SwiftUI
import Observation

/// Central manager for device discovery, status polling, and commands
@Observable
@MainActor
final class DeviceManager {
    /// All discovered devices keyed by name
    private(set) var devices: [String: Device] = [:]
    
    // MARK: - Configuration Constants
    
    /// Keywords that identify a device as part of the "Planter" group
    private let planterKeywords = ["ASM64", "ASM63", "LSH80", "LSH60", "LSH40", "ALSB106", "ALSB85", "ALSB64"]
    
    /// Sorted and grouped devices for display
    var categorizedGroups: [(title: String, devices: [Device])] {
        let allDevices = devices.values.sorted { $0.name < $1.name }
        var assignedDeviceIds = Set<UUID>()
        
        // Define Categories & Keywords
        // Note: Planter group uses the shared keywords
        let config: [(title: String, keys: [String])] = [
            ("Planter", planterKeywords),
            ("Lobby & Showroom", ["Lobby", "Showroom", "PSUB10x2"]),
            ("Entertainment", ["THTR"]),
            ("Conference", ["803", "602", "802", "MOS"]),
            ("Corkroom", ["Towers", "ASBR6"]),
            ("Other", ["Hallway Planter", "Bollards"])
        ]
        
        return config.compactMap { group in
            // Filter all devices that match any key in this group AND haven't been assigned yet
            let groupDevices = allDevices.filter { device in
                guard !assignedDeviceIds.contains(device.id) else { return false }
                
                // For "Planter" category, ensure it's NOT just sharing the word "Planter" but matches the models
                // Use the group's keys
                return group.keys.contains { key in
                    device.name.localizedCaseInsensitiveContains(key)
                }
            }
            
            // Mark as assigned
            groupDevices.forEach { assignedDeviceIds.insert($0.id) }
            
            return groupDevices.isEmpty ? nil : (title: group.title, devices: groupDevices)
        }
    }
    
    /// Flat array of devices for single-list views (preserving category order)
    var sortedDevices: [Device] {
        categorizedGroups.flatMap { $0.devices }
    }
    
    /// Whether discovery is active
    private(set) var isScanning: Bool = false
    
    /// Last error message
    private(set) var lastError: String?
    
    /// Whether local network permission was denied
    private(set) var isPermissionDenied: Bool = false
    
    private let discovery = NetworkDiscovery()
    private let apiClient = WiiMAPIClient()
    private let bluOSClient = BluOSAPIClient()
    private var discoveryTask: Task<Void, Never>?
    private var pollingTasks: [String: Task<Void, Never>] = [:]
    
    // Performance: Batching updates
    private var pendingDevices: [String: Device] = [:]
    private var batchUpdateTask: Task<Void, Never>?
    
    /// Polling interval in seconds
    private let pollingInterval: TimeInterval = 1.5
    
    /// Enable mock devices for simulator testing
    var useMockDevices: Bool = false
    
    /// Persistent saved groups
    private(set) var savedGroups: [SavedGroup] = []
    
    /// Global master volume (average or base level)
    var masterVolume: Double = 50 {
        didSet {
            // Apply to all online devices if changed manually
            // This is a simplified implementation; UI will trigger specific updates
        }
    }
    
    private let groupsKey = "com.audiocommand.savedGroups"
    
    // Persistence
    private let persistence = PersistenceManager.shared
    private var knownPreferences: [String: DevicePreferences] = [:]
    
    init() {
        loadSavedGroups()
        
        // Load device preferences on init
        Task {
            knownPreferences = await persistence.loadDevicePreferences()
        }
        
        // Start discovery on init
        Task {
            await startDiscovery()
        }
    }
    
    // MARK: - Discovery
    
    /// Start network discovery
    func startDiscovery() async {
        // Cancel existing discovery
        discoveryTask?.cancel()
        batchUpdateTask?.cancel()
        
        isScanning = true
        lastError = nil
        pendingDevices.removeAll()
        
        // Start Batch Flusher
        batchUpdateTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(for: .milliseconds(500)) // 2Hz updates
                await flushPendingDevices()
            }
        }
        
        #if targetEnvironment(simulator)
        // Add mock devices for simulator testing
        if useMockDevices || devices.isEmpty {
            addMockDevices()
            isScanning = false
            return
        }
        #endif
        
        discoveryTask = Task {
            let events = await discovery.startDiscovery()
            
            for await event in events {
                guard !Task.isCancelled else { break }
                
                switch event {
                case .deviceFound(let name, let ipAddress, let port, let type):
                    await handleDeviceFound(name: name, ipAddress: ipAddress, port: port, type: type)
                    
                case .deviceLost(let name):
                    await handleDeviceLost(name: name)
                    
                case .error(let error):
                    // Check if error is permission-related (NoAuth -65555)
                    let errorDescription = String(describing: error)
                    if errorDescription.contains("NoAuth") || errorDescription.contains("-65555") {
                        isPermissionDenied = true
                    }
                    ErrorHandler.shared.handle(error: error)
                }
            }
        }
        
        // Mark scanning complete after a brief period
        Task {
            try? await Task.sleep(for: .seconds(3))
            // Only stop if we are still the original scan task (naive check, but sufficient here)
            if self.isScanning {
                self.isScanning = false
                await self.flushPendingDevices()
                self.batchUpdateTask?.cancel()
            }
        }
    }
    
    /// Stop discovery and all polling
    func stopDiscovery() async {
        discoveryTask?.cancel()
        await discovery.stopDiscovery()
        pollingTasks.values.forEach { $0.cancel() }
        pollingTasks.removeAll()
        isScanning = false
        await flushPendingDevices() // One last flush
        batchUpdateTask?.cancel()
    }
    
    /// Refresh the network (restart discovery)
    func refreshNetwork() async {
        await stopDiscovery()
        devices.removeAll()
        await startDiscovery()
    }
    
    // MARK: - Device Filtering
    // Blacklist: Explicitly hide these devices
    // EMPTY = Allow All Devices (for testing)
    private let blacklistedDeviceNames: Set<String> = []
    
    // Whitelist: explicit allowed device keywords
    // EMPTY = Allow All Devices
    // Uses partial matching (contains) for flexibility
    // Whitelist: explicit allowed device keywords
    // EMPTY = Allow All Devices
    // Uses partial matching (contains) for flexibility
    private let allowedDeviceKeywords: Set<String> = [
        "ASM64", "ASM63",
        "ALSB106",
        "ALSB85",
        "ALSB64",
        "LSH80",
        "LSH60",
        "LSH40"
    ]

    /// Commit pending device updates to the main list
    private func flushPendingDevices() async {
        guard !pendingDevices.isEmpty else { return }
        
        // Atomic update to main list to trigger ONE View update
        for (name, device) in pendingDevices {
            if devices[name] == nil {
                // New device
                 devices[name] = device
                 startPolling(for: device)
            } else {
                // Update
                devices[name] = device
                // Polling likely already running, but ensure it
                startPolling(for: device)
            }
        }
        
        pendingDevices.removeAll()
    }

    private func handleDeviceFound(name: String, ipAddress: String, port: Int, type: DeviceType) async {
        // Platform Correction: Force ALL devices to WiiM as requested
        let correctedType = DeviceType.wiim
        
        // Validation: Ignore generic or empty names
        guard !name.isEmpty, name != "Unknown Device" else { return }
        
        // Strict IP Validation: explicit checks for "unknown"
        guard !ipAddress.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, 
              ipAddress != "unknown",
              ipAddress != "0.0.0.0" else {
            print("[DeviceManager] Ignored \(name) due to unknown/invalid IP: '\(ipAddress)'")
            return
        }
        
        // Name Correction: Ensure "Planter" is attached
        var displayName = name
        // Check if it's one of our known models but missing the prefix
        // Use shared planterKeywords
        if planterKeywords.contains(where: { name.localizedCaseInsensitiveContains($0) }) && 
           !name.localizedCaseInsensitiveContains("Planter") {
            displayName = "Planter " + name
        }
        
        // BLACKLIST CHECK: Robust loose matching
        let normalizedName = displayName.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if blacklistedDeviceNames.contains(displayName) || 
           blacklistedDeviceNames.contains(where: { $0.lowercased() == normalizedName }) {
            return
        }
        
        // WHITELIST CHECK: Partial matching
        if !allowedDeviceKeywords.isEmpty {
            let isAllowed = allowedDeviceKeywords.contains { keyword in
                displayName.localizedCaseInsensitiveContains(keyword)
            }
            
            guard isAllowed else {
                print("[DeviceManager] Rejected \(displayName) - not in whitelist")
                return
            }
        }
        
        // BATCHING: Add to pending instead of immediate update
        // Check if device already exists in main store or pending
        // Use displayName as key to ensure we don't duplicate
        if let existing = devices[displayName] ?? pendingDevices[displayName] {
            // Optimization: If existing has same IP, ignore
            if existing.ipAddress == ipAddress {
                return 
            }
            
            // Prefer IPv4: If existing is IPv4 and new is IPv6 (contains :), ignore
            let isExistingIPv4 = !existing.ipAddress.contains(":")
            let isNewIPv4 = !ipAddress.contains(":")
            
            if isExistingIPv4 && !isNewIPv4 {
                return 
            } 
            
            // If updating, preserve existing status/ID
            let updated = Device(
                id: existing.id,
                name: displayName,
                ipAddress: ipAddress,
                port: port,
                type: correctedType,
                status: existing.status,
                isOnline: true
            )
            pendingDevices[displayName] = updated
            print("[DeviceManager] Queued update for \(displayName) to \(ipAddress)")
        } else {
            // New device
            var devicePrefs = knownPreferences[displayName] ?? .default
            
            let device = Device(
                name: displayName,
                ipAddress: ipAddress,
                port: port,
                type: correctedType,
                preferences: devicePrefs
            )
            pendingDevices[displayName] = device
            print("[DeviceManager] Queued new device \(displayName) at \(ipAddress)")
        }
    }
    
    private func handleDeviceLost(name: String) async {
        if let device = devices[name] {
            device.isOnline = false
            pollingTasks[name]?.cancel()
            pollingTasks.removeValue(forKey: name)
        }
    }
    
    // MARK: - Status Polling
    
    private func startPolling(for device: Device) {
        // Cancel existing polling for this device
        pollingTasks[device.name]?.cancel()
        
        pollingTasks[device.name] = Task {
            while !Task.isCancelled {
                await pollDeviceStatus(device)
                try? await Task.sleep(for: .seconds(pollingInterval))
            }
        }
    }
    
    private func pollDeviceStatus(_ device: Device) async {
        do {
            let status: DeviceStatus
            switch device.type {
            case .bluesound:
                status = try await bluOSClient.getStatus(from: device)
            default:
                 status = try await apiClient.getStatus(from: device)
            }
            
            device.status = status
            device.isOnline = true
            device.lastSeen = Date()
        } catch {
            print("[DeviceManager] Polling failed for \(device.name): \(error.localizedDescription)")
            // Do NOT show user-facing alert for background polling errors
            // just mark as potentially having issues or leave UI as is
            // eventually we could mark as offline if it fails enough times
            // ErrorHandler.shared.handle(error: error) 
        }
    }
    
    // MARK: - Commands
    
    /// Set volume for a device
    func setVolume(_ level: Int, for device: Device) async {
        do {
            if device.type == .bluesound {
                try await bluOSClient.setVolume(level, on: device)
            } else {
                try await apiClient.setVolume(level, on: device)
            }
            device.status.volume = level
            updateMasterVolumeState()
        } catch {
            ErrorHandler.shared.handle(error: error)
        }
    }
    
    /// Set volume for all devices (Master Volume)
    func setGlobalVolume(_ level: Int) async {
        let delta = Double(level) - masterVolume
        masterVolume = Double(level)
        
        for device in devices.values where device.isOnline {
            let newVolume = max(0, min(100, Int(Double(device.status.volume) + delta)))
            await setVolume(newVolume, for: device)
        }
    }
    
    private func updateMasterVolumeState() {
        let onlineDevices = devices.values.filter { $0.isOnline }
        guard !onlineDevices.isEmpty else { return }
        
        let average = onlineDevices.reduce(0) { $0 + $1.status.volume } / onlineDevices.count
        masterVolume = Double(average)
    }
    
    /// Toggle mute for a device
    func toggleMute(for device: Device) async {
        let newMuteState = !device.status.isMuted
        do {
            if device.type == .bluesound {
                try await bluOSClient.setMute(newMuteState, on: device)
            } else {
                try await apiClient.setMute(newMuteState, on: device)
            }
            device.status.isMuted = newMuteState
        } catch {
            ErrorHandler.shared.handle(error: error)
        }
    }
    
    /// Toggle play/pause for a device
    func togglePlayPause(for device: Device) async {
        do {
            if device.type == .bluesound {
                try await bluOSClient.togglePlayPause(on: device)
            } else {
                try await apiClient.togglePlayPause(on: device)
            }
            // Optimistically update state
            switch device.status.playbackState {
            case .playing:
                device.status.playbackState = .paused
            case .paused, .stopped, .idle:
                device.status.playbackState = .playing
            }
        } catch {
            ErrorHandler.shared.handle(error: error)
        }
    }
    
    /// Skip to next track
    func nextTrack(for device: Device) async {
        do {
            if device.type == .bluesound {
                // TODO: Implement BluOS next track
                print("[DeviceManager] Next track not implemented for BluOS")
            } else {
                try await apiClient.nextTrack(on: device)
            }
        } catch {
            ErrorHandler.shared.handle(error: error)
        }
    }
    
    /// Skip to previous track
    func previousTrack(for device: Device) async {
        do {
            if device.type == .bluesound {
                // TODO: Implement BluOS previous track
                print("[DeviceManager] Previous track not implemented for BluOS")
            } else {
                try await apiClient.previousTrack(on: device)
            }
        } catch {
            ErrorHandler.shared.handle(error: error)
        }
    }
    
    /// Trigger a preset on a device
    func triggerPreset(_ preset: Int, for device: Device) async {
        // Linked Preset Logic for PLANTER Group
        // Any device that matches Planter Group Keywords triggers ALL Planter Group devices
        let isPlanterGroupDevice = planterKeywords.contains { keyword in
            device.name.localizedCaseInsensitiveContains(keyword)
        }
        
        if isPlanterGroupDevice {
            await triggerLinkedPlanterPreset(preset)
            return
        }
        
        // Standard single device trigger
        await performTriggerPreset(preset, for: device)
    }
    
    /// Helper to actually send the command to a single device
    private func performTriggerPreset(_ preset: Int, for device: Device) async {
        print("[DeviceManager] triggerPreset(\(preset)) called for device: \(device.name)")
        do {
            if device.type == .bluesound {
                try await bluOSClient.triggerPreset(preset, on: device)
            } else {
                try await apiClient.triggerPreset(preset, on: device)
            }
            print("[DeviceManager] Preset \(preset) sent successfully to \(device.name)")
        } catch {
            print("[DeviceManager] Preset FAILED for \(device.name): \(error.localizedDescription)")
            ErrorHandler.shared.handle(error: error)
        }
    }
    
    /// Helper to trigger preset on ALL Planter devices
    private func triggerLinkedPlanterPreset(_ preset: Int) async {
        print("[DeviceManager] Triggering LINKED Planter Preset \(preset)")
        
        // Find all online Planter devices based on partial match of Planter keys
        let targets = devices.values.filter { device in
            guard device.isOnline else { return false }
            return planterKeywords.contains { keyword in
                device.name.localizedCaseInsensitiveContains(keyword)
            }
        }
        
        print("[DeviceManager] Found \(targets.count) linked Planter targets: \(targets.map(\.name))")
        
        await withTaskGroup(of: Void.self) { group in
            for target in targets {
                group.addTask {
                    await self.performTriggerPreset(preset, for: target)
                }
            }
        }
    }
    
    /// Update IP address manually
    func updateIPAddress(_ ip: String, for device: Device) {
        // Simple validation
        guard !ip.isEmpty else { return }
        device.ipAddress = ip
        print("[DeviceManager] Updated IP for \(device.name) to \(ip)")
    }
    
    // MARK: - Solo Mode Logic (ZoneControllr)
    
    /// Activates "Solo Mode" for a specific device:
    /// 1. Mutes ALL other devices
    /// 2. Unmutes the selected device
    /// 3. Sets selected device to a default "comfortable" volume (e.g., 25%)
    /// 4. Ensures it is playing
    func activateSoloMode(for targetDevice: Device) async {
        print("[DeviceManager] Activating SOLO MODE for: \(targetDevice.name)")
        
        // 1. Mute everyone else
        // optimize: create a task group to do this in parallel
        await withTaskGroup(of: Void.self) { group in
            for device in devices.values where device.id != targetDevice.id {
                group.addTask {
                    if !device.status.isMuted {
                        await self.toggleMute(for: device) // Toggle to mute
                    }
                }
            }
        }
        
        // 2. Unmute target if needed
        if targetDevice.status.isMuted {
            await toggleMute(for: targetDevice)
        }
        
        // 3. Set Volume (nice background level)
        // Only prevent deafening if it's super loud, otherwise leave it or set to preset?
        // Let's set to 25 as a safe default for the demo
        if targetDevice.status.volume < 10 {
            await setVolume(25, for: targetDevice)
        }
        
        // 4. Ensure Playing
        if targetDevice.status.playbackState != .playing {
            await togglePlayPause(for: targetDevice)
        }
    }
    
    // MARK: - Persistent Groups Management
    
    func saveGroup(name: String, deviceIds: [UUID], masterId: UUID?) {
        let newGroup = SavedGroup(name: name, deviceIds: deviceIds, masterDeviceId: masterId)
        savedGroups.append(newGroup)
        persistGroups()
    }
    
    func deleteGroup(at offsets: IndexSet) {
        savedGroups.remove(atOffsets: offsets)
        persistGroups()
    }
    
    func activateGroup(_ group: SavedGroup) async {
        guard let masterId = group.masterDeviceId,
              let master = devices.values.first(where: { $0.id == masterId }),
              master.isOnline else { return }
        
        // Ensure master is master
        master.status.isMaster = true
        master.status.groupId = group.id.uuidString
        
        for id in group.deviceIds where id != masterId {
            if let device = devices.values.first(where: { $0.id == id }), device.isOnline {
                do {
                    try await apiClient.joinGroup(masterIP: master.ipAddress, on: device)
                    device.status.groupId = group.id.uuidString
                    device.status.isMaster = false
                    device.status.masterId = master.id.uuidString
                } catch {
                    print("[Groups] Failed to join group: \(error.localizedDescription)")
                }
            }
        }
    }
    
    private func persistGroups() {
        if let encoded = try? JSONEncoder().encode(savedGroups) {
            UserDefaults.standard.set(encoded, forKey: groupsKey)
        }
    }
    
    private func loadSavedGroups() {
        if let data = UserDefaults.standard.data(forKey: groupsKey),
           let decoded = try? JSONDecoder().decode([SavedGroup].self, from: data) {
            savedGroups = decoded
        }
    }
    
    // MARK: - Device Preferences (Phase 1)
    
    func toggleFavorite(for device: Device) {
        let newFavoriteState = !device.preferences.isFavorite
        device.preferences.isFavorite = newFavoriteState
        
        // Update local cache
        if var prefs = knownPreferences[device.name] {
            prefs.isFavorite = newFavoriteState
            knownPreferences[device.name] = prefs
        } else {
            var prefs = DevicePreferences.default
            prefs.isFavorite = newFavoriteState
            knownPreferences[device.name] = prefs
        }
        
        // Persist
        Task {
             await persistence.updatePreference(forDeviceName: device.name) { prefs in
                 prefs.isFavorite = newFavoriteState
             }
        }
    }
    
    func updateCustomName(_ name: String, for device: Device) {
        let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let finalName = cleanName.isEmpty ? nil : cleanName
        
        device.preferences.customName = finalName
        
        // Update local cache
        if var prefs = knownPreferences[device.name] {
            prefs.customName = finalName
            knownPreferences[device.name] = prefs
        } else {
            var prefs = DevicePreferences.default
            prefs.customName = finalName
            knownPreferences[device.name] = prefs
        }
        
        // Persist
        Task {
            await persistence.updatePreference(forDeviceName: device.name) { prefs in
                prefs.customName = finalName
            }
        }
    }
    
    // MARK: - Mock Devices (for simulator)
    
    private func addMockDevices() {
        let zones: [(name: String, model: String, type: DeviceType)] = [
            // Conference Room
            ("Conference Room: MOS", "WiiM Pro", .wiim),
            ("Conference Room: 602", "WiiM Amp", .wiim),
            ("Conference Room: 802 Sub", "WiiM Pro", .wiim),
            ("Conference Room: 803", "WiiM Amp", .wiim),
            // Lobby
            ("Lobby PP80", "Node 2i", .bluesound),
            ("Lobby: Pendants", "WiiM Amp", .wiim),
            // Showroom
            ("Showroom: Pendants", "WiiM Pro", .wiim),
            ("Showroom: PSUB10 (x2)", "WiiM Amp", .wiim),
            ("Showroom PP80", "Node 2i", .bluesound),
            // Planter Wall
            ("Planter ASM63", "Node 2i", .bluesound),
            ("Planter ALSB106", "Powernode", .bluesound),
            ("Planter ALSB85", "Node 2i", .bluesound),
            ("Planter ALSB64", "Powernode", .bluesound),
            ("Planter LSH80", "Node 2i", .bluesound),
            ("Planter LSH60", "Powernode", .bluesound),
            ("Planter LSH40", "Node 2i", .bluesound),
            // Other
            ("Hallway: Planter", "WiiM Pro", .wiim),
            ("Front Yard: Bollards", "WiiM Amp", .wiim),
            // Extras to test 20-card grid
            ("Patio: Guest", "WiiM Pro", .wiim),
            ("Office: Main", "WiiM Amp", .wiim),
            ("Corkroom Towers", "WiiM Amp", .wiim)
        ]
        
        for (index, zone) in zones.enumerated() {
            // Apply Blacklist
            if blacklistedDeviceNames.contains(zone.name) {
                continue
            }
            
            let status: DeviceStatus
            // detailed mock data
            let artists = ["Pink Floyd", "Daft Punk", "The unknown", "Tame Impala", "Dire Straits", "Queen", "Hans Zimmer", "Eagles"]
            let titles = ["Time", "Get Lucky", "Starboy", "The Less I Know The Better", "Money for Nothing", "Bohemian Rhapsody", "Cornfield Chase", "Hotel California"]
            
            // Give most devices playing status (active)
            // Pattern: 3 Playing, 1 Paused, 1 Idle (repeat)
            if index % 5 < 3 {
                let source: DeviceSource = index % 2 == 0 ? .spotify : .tidal
                status = DeviceStatus(
                    source: source,
                    playbackState: .playing,
                    artist: artists[index % artists.count],
                    title: titles[index % titles.count],
                    volume: 40 + (index * 7 % 40),
                    isMuted: false,
                    duration: 240, // Mock 4 mins
                    currentTime: 120 // Mock 2 mins
                )
            } else if index % 5 == 3 {
                status = DeviceStatus(
                    source: .airplay,
                    playbackState: .paused,
                    artist: artists[(index + 1) % artists.count],
                    title: titles[(index + 1) % titles.count],
                    volume: 30 + (index % 20),
                    isMuted: false
                )
            } else {
                status = .idle
            }
            
            let device = Device(
                name: zone.name,
                model: zone.model,
                ipAddress: "192.168.1.\(100 + index)",
                type: zone.type,
                status: status
            )
            
            devices[zone.name] = device
        }
    }
}
