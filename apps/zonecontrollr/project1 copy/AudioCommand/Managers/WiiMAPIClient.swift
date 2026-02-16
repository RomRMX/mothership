import Foundation

/// Linkplay API client for WiiM devices
actor WiiMAPIClient {
    private let session: URLSession
    private let timeout: TimeInterval = 5.0
    
    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 5.0
        config.timeoutIntervalForResource = 10.0
        self.session = URLSession(configuration: config, delegate: InsecureSessionDelegate(), delegateQueue: nil)
    }
    
    /// Fetch current player status from device
    func getStatus(from device: Device) async throws -> DeviceStatus {
        let data: Data
        
        do {
            data = try await fetchStatusData(from: device, useHTTPS: false)
        } catch {
            // Fallback to HTTPS
            print("[WiiM] Status HTTP failed, trying HTTPS: \(error.localizedDescription)")
            data = try await fetchStatusData(from: device, useHTTPS: true)
        }
        
        return try parseStatusResponse(data)
    }
    
    private func fetchStatusData(from device: Device, useHTTPS: Bool) async throws -> Data {
        let scheme = useHTTPS ? "https" : "http"
        let port = useHTTPS ? 443 : 80
        
        let host: String
        if device.ipAddress.contains(":") && !device.ipAddress.hasPrefix("[") {
            host = "[\(device.ipAddress)]"
        } else {
            host = device.ipAddress
        }
        
        var components = URLComponents()
        components.scheme = scheme
        components.host = host
        components.port = port
        components.path = "/httpapi.asp"
        components.queryItems = [URLQueryItem(name: "command", value: "getPlayerStatus")]
        
        guard let requestURL = components.url else {
            throw APIError.invalidURL(url: "URL construction failed")
        }
        
        let data: Data
        let response: URLResponse
        
        do {
            (data, response) = try await session.data(from: requestURL)
        } catch {
            throw APIError.connectionFailed(reason: "Connection failed to \(requestURL.absoluteString): \(error.localizedDescription)")
        }
        
        guard let httpResponse = response as? HTTPURLResponse,
             httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }
        
        return data
    }
    
    /// Set volume level (0-100)
    func setVolume(_ level: Int, on device: Device) async throws {
        let clampedLevel = max(0, min(100, level))
        try await sendCommand("setPlayerCmd:vol:\(clampedLevel)", to: device)
    }
    
    /// Toggle mute state
    func setMute(_ muted: Bool, on device: Device) async throws {
        let muteValue = muted ? 1 : 0
        try await sendCommand("setPlayerCmd:mute:\(muteValue)", to: device)
    }
    
    /// Skip to next track
    func nextTrack(on device: Device) async throws {
        try await sendCommand("setPlayerCmd:next", to: device)
    }
    
    /// Skip to previous track
    func previousTrack(on device: Device) async throws {
        try await sendCommand("setPlayerCmd:prev", to: device)
    }
    
    /// Toggle play/pause
    func togglePlayPause(on device: Device) async throws {
        try await sendCommand("setPlayerCmd:onepause", to: device)
    }
    
    /// Trigger preset (1-based index)
    func triggerPreset(_ preset: Int, on device: Device) async throws {
        try await sendCommand("MCUKeyShortClick:\(preset)", to: device)
    }
    
    // MARK: - Multi-room (Grouping)
    
    /// Join this device to a master device
    func joinGroup(masterIP: String, on device: Device) async throws {
        // Linkplay multi-room join command
        try await sendCommand("multiroom:join:\(masterIP)", to: device)
    }
    
    /// Leave current group
    func leaveGroup(on device: Device) async throws {
        try await sendCommand("multiroom:leave", to: device)
    }
    
    // MARK: - Private Helpers
    
    private func sendCommand(_ command: String, to device: Device) async throws {
        // Try HTTP (Port 80)
        do {
            try await performRequest(command: command, device: device, useHTTPS: false)
        } catch {
            // Fallback to HTTPS (Port 443)
            print("[WiiM] HTTP failed, trying HTTPS: \(error.localizedDescription)")
            try await performRequest(command: command, device: device, useHTTPS: true)
        }
    }
    
    private func performRequest(command: String, device: Device, useHTTPS: Bool) async throws {
        let scheme = useHTTPS ? "https" : "http"
        let port = useHTTPS ? 443 : 80
        
        let host: String
        if device.ipAddress.contains(":") && !device.ipAddress.hasPrefix("[") {
            host = "[\(device.ipAddress)]"
        } else {
            host = device.ipAddress
        }
        
        var components = URLComponents()
        components.scheme = scheme
        components.host = host
        components.port = port
        components.path = "/httpapi.asp"
        components.queryItems = [URLQueryItem(name: "command", value: command)]
        
        guard let requestURL = components.url else {
            throw APIError.invalidURL(url: "URL construction failed for \(command)")
        }
        
        let data: Data
        let response: URLResponse
        
        do {
            (data, response) = try await session.data(from: requestURL)
        } catch {
            throw APIError.connectionFailed(reason: "Connection failed to \(requestURL.absoluteString): \(error.localizedDescription)")
        }
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.commandFailed(reason: "HTTP \( (response as? HTTPURLResponse)?.statusCode ?? 0 )")
        }
    }
    
    private func parseStatusResponse(_ data: Data) throws -> DeviceStatus {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw APIError.parseError
        }
        
        // Parse mode/source
        let mode = json["mode"] as? String ?? ""
        let source = DeviceSource.fromLinkplayMode(mode)
        
        // Parse volume
        let volumeString = json["vol"] as? String ?? "50"
        let volume = Int(volumeString) ?? 50
        
        // Parse mute state
        let muteString = json["mute"] as? String ?? "0"
        let isMuted = muteString == "1"
        
        // Parse playback state
        let statusString = json["status"] as? String ?? "stop"
        let playbackState: PlaybackState
        switch statusString.lowercased() {
        case "play": playbackState = .playing
        case "pause": playbackState = .paused
        case "stop": playbackState = .stopped
        default: playbackState = .idle
        }
        
        // Parse metadata
        var artist: String? = nil
        var title: String? = nil
        
        let artistRaw = (json["Artist"] as? String) ?? (json["artist"] as? String)
        if let raw = artistRaw {
             artist = decodeHexString(raw) ?? raw
        }
        
        let titleRaw = (json["Title"] as? String) ?? (json["title"] as? String) ?? (json["song"] as? String)
        if let raw = titleRaw {
            title = decodeHexString(raw) ?? raw
        }
        
        // Album art/meta might be in other fields too, but focusing on Artist/Title
        if title == nil {
             // Fallback for some radio stations
             title = json["stationName"] as? String
        }
        
        // Parse duration and position
        let totalLenStr = json["totlen"] as? String ?? "0"
        let curPosStr = json["curpos"] as? String ?? "0"
        
        let totalLen = (Double(totalLenStr) ?? 0) / 1000.0
        let curPos = (Double(curPosStr) ?? 0) / 1000.0
        
        return DeviceStatus(
            source: source,
            playbackState: playbackState,
            artist: artist,
            title: title,
            volume: volume,
            isMuted: isMuted,
            duration: totalLen,
            currentTime: curPos
        )
    }
    
    /// Decode hex-encoded string (Linkplay encodes metadata as hex)
    private func decodeHexString(_ hex: String) -> String? {
        guard !hex.isEmpty else { return nil }
        
        // Heuristic: If it contains non-hex digits, it's definitely not hex.
        let isHex = hex.count % 2 == 0 && hex.allSatisfy { $0.isHexDigit }
        
        guard isHex else { return nil }
        
        var bytes = [UInt8]()
        var index = hex.startIndex
        
        while index < hex.endIndex {
            let nextIndex = hex.index(index, offsetBy: 2, limitedBy: hex.endIndex) ?? hex.endIndex
            guard let byte = UInt8(hex[index..<nextIndex], radix: 16) else { return nil }
            bytes.append(byte)
            index = nextIndex
        }
        
        return String(bytes: bytes, encoding: .utf8)
    }
}

enum APIError: Error, LocalizedError {
    case invalidURL(url: String)
    case invalidResponse
    case commandFailed(reason: String)
    case connectionFailed(reason: String)
    case parseError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL(let url): return "Invalid device URL: \(url)"
        case .invalidResponse: return "Invalid response from device"
        case .commandFailed(let reason): return "Command failed: \(reason)"
        case .connectionFailed(let reason): return reason
        case .parseError: return "Failed to parse response"
        }
    }
}

/// URLSessionDelegate to allow self-signed certificates (common for local IoT devices)
final class InsecureSessionDelegate: NSObject, URLSessionDelegate {
    func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        if challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
           let serverTrust = challenge.protectionSpace.serverTrust {
            // Trust the server blindly for local network access
            completionHandler(.useCredential, URLCredential(trust: serverTrust))
        } else {
            completionHandler(.performDefaultHandling, nil)
        }
    }
}
