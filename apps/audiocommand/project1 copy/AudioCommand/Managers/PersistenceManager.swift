import Foundation

/// Actor for thread-safe access to UserDefaults
/// Handles saving and loading of app data
actor PersistenceManager {
    static let shared = PersistenceManager()
    
    private let defaults = UserDefaults.standard
    
    private enum Keys {
        static let devicePreferences = "device_preferences"
    }
    
    private init() {}
    
    // MARK: - Device Preferences
    
    /// Load all device preferences
    /// Returns: [DeviceName: Preferences]
    func loadDevicePreferences() -> [String: DevicePreferences] {
        guard let data = defaults.data(forKey: Keys.devicePreferences) else {
            return [:]
        }
        
        do {
            return try JSONDecoder().decode([String: DevicePreferences].self, from: data)
        } catch {
            print("[Persistence] Error decoding preferences: \(error)")
            return [:]
        }
    }
    
    /// Save preferences for a specific device
    func savePreferences(_ prefs: DevicePreferences, forDeviceName name: String) {
        var current = loadDevicePreferences()
        current[name] = prefs
        
        do {
            let data = try JSONEncoder().encode(current)
            defaults.set(data, forKey: Keys.devicePreferences)
        } catch {
            print("[Persistence] Error saving preferences: \(error)")
        }
    }
    
    /// Update a single preference field modifier
    func updatePreference(forDeviceName name: String, mutation: (inout DevicePreferences) -> Void) {
        var allPrefs = loadDevicePreferences()
        var devicePrefs = allPrefs[name] ?? .default
        
        mutation(&devicePrefs)
        allPrefs[name] = devicePrefs
        
        do {
            let data = try JSONEncoder().encode(allPrefs)
            defaults.set(data, forKey: Keys.devicePreferences)
        } catch {
            print("[Persistence] Error saving updated preferences: \(error)")
        }
    }
}
