import Foundation

/// API Client for controlling Bluesound (BluOS) devices
/// BluOS uses a simple HTTP API on port 11000 returning XML
actor BluOSAPIClient {
    private let port = 11000
    private let session: URLSession
    
    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 4 // Short timeout for responsiveness
        self.session = URLSession(configuration: config)
    }
    
    // MARK: - Public Methods
    
    /// Get current status (volume, playback state, metadata)
    func getStatus(from device: Device) async throws -> DeviceStatus {
        let url = try makeURL(ip: device.ipAddress, path: "Status")
        
        let (data, _) = try await session.data(from: url)
        
        guard let xmlString = String(data: data, encoding: .utf8) else {
            throw AppError.parsing("Invalid response encoding")
        }
        
        return parseStatusXML(xmlString)
    }
    
    /// Set volume (0-100)
    func setVolume(_ level: Int, on device: Device) async throws {
        try await sendCommand(ip: device.ipAddress, path: "Volume", query: [URLQueryItem(name: "level", value: "\(level)")])
    }
    
    /// Toggle Play/Pause
    func togglePlayPause(on device: Device) async throws {
        if device.status.playbackState == .playing {
             try await sendCommand(ip: device.ipAddress, path: "Pause")
        } else {
             try await sendCommand(ip: device.ipAddress, path: "Play")
        }
    }
    
    func setMute(_ muted: Bool, on device: Device) async throws {
        try await sendCommand(ip: device.ipAddress, path: "Volume", query: [URLQueryItem(name: "mute", value: muted ? "1" : "0")])
    }
    
    /// Trigger a preset on a device
    func triggerPreset(_ preset: Int, on device: Device) async throws {
        print("[BluOS] Triggering preset \(preset) on \(device.name)")
        try await sendCommand(ip: device.ipAddress, path: "Preset", query: [URLQueryItem(name: "id", value: "\(preset)")])
    }
    
    // MARK: - Helper Methods
    
    private func makeURL(ip: String, path: String, query: [URLQueryItem] = []) throws -> URL {
        var components = URLComponents()
        components.scheme = "http"
        components.host = ip
        components.port = port
        components.path = "/\(path)"
        if !query.isEmpty {
            components.queryItems = query
        }
        
        guard let url = components.url else { throw AppError.network("Invalid URL components") }
        return url
    }
    
    private func sendCommand(ip: String, path: String, query: [URLQueryItem] = []) async throws {
        let url = try makeURL(ip: ip, path: path, query: query)
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 2
        let session = URLSession(configuration: config)

        let (_, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
             throw AppError.network("No HTTP Response")
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw AppError.api("Command failed via \(path)", statusCode: httpResponse.statusCode)
        }
    }
    
    private func parseStatusXML(_ xml: String) -> DeviceStatus {
        // XML parsing using manual extraction for performance/simplicity
        
        let volume = Int(extractTag("volume", from: xml) ?? "0") ?? 0
        let stateStr = extractTag("state", from: xml) ?? "idle"
        
        var artist = extractTag("artist", from: xml) ?? extractTag("title2", from: xml)
        var title = extractTag("name", from: xml) ?? extractTag("title1", from: xml)
        
        // Fallbacks for Radio/Stream inputs
        if title == nil || title?.isEmpty == true {
             title = extractTag("line1", from: xml)
        }
        if artist == nil || artist?.isEmpty == true {
             artist = extractTag("line2", from: xml)
        }
        
        let muteStr = extractTag("mute", from: xml) // 1 or 0
        
        // Map PlaybackState
        var playbackState: PlaybackState = .idle
        switch stateStr.lowercased() {
        case "play", "stream": playbackState = .playing
        case "pause": playbackState = .paused
        case "stop": playbackState = .stopped
        case "connecting": playbackState = .idle
        default: playbackState = .idle
        }
        
        // Determine source
        let service = extractTag("service", from: xml) ?? ""
        let inputId = extractTag("inputId", from: xml) ?? ""
        
        var source: DeviceSource = .unknown
        if service.lowercased().contains("spotify") { source = .spotify }
        else if service.lowercased().contains("airplay") { source = .airplay }
        else if inputId.lowercased().contains("spotify") { source = .spotify }
        else if inputId.lowercased().contains("capture") { source = .optical }
        else if !service.isEmpty { source = DeviceSource(name: service.capitalized, iconName: "music.note") }
        else { source = .unknown }

        return DeviceStatus(
            source: source,
            playbackState: playbackState,
            artist: artist,
            title: title,
            volume: volume,
            isMuted: muteStr == "1",
            duration: 0,
            currentTime: 0,
            groupId: nil,
            isMaster: false,
            masterId: nil
        )
    }
    
    /// Extracts content between <tag>...</tag>
    private func extractTag(_ tag: String, from xml: String) -> String? {
        let pattern = "<\(tag)[^>]*>(.*?)</\(tag)>"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.dotMatchesLineSeparators, .caseInsensitive]) else { return nil }
        
        let range = NSRange(location: 0, length: xml.utf16.count)
        if let match = regex.firstMatch(in: xml, options: [], range: range) {
            if let swiftRange = Range(match.range(at: 1), in: xml) {
                var content = String(xml[swiftRange])
                // Decode XML entities
                content = content.replacingOccurrences(of: "&amp;", with: "&")
                content = content.replacingOccurrences(of: "&lt;", with: "<")
                content = content.replacingOccurrences(of: "&gt;", with: ">")
                content = content.replacingOccurrences(of: "&quot;", with: "\"")
                content = content.replacingOccurrences(of: "&apos;", with: "'")
                return content.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }
        return nil
    }
}
