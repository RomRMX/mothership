import Foundation
import Network

/// mDNS/Bonjour network discovery for audio streaming devices
actor NetworkDiscovery {
    private var browsers: [NWBrowser] = []
    private var discoveredEndpoints: [NWEndpoint: DeviceType] = [:]
    
    /// Service types to scan for
    private let serviceTypes: [(type: String, deviceType: DeviceType)] = [
        ("_linkplay._tcp", .wiim),
        ("_musc._tcp", .bluesound)
    ]
    
    /// Start discovering devices on the network
    func startDiscovery() -> AsyncStream<DiscoveryEvent> {
        AsyncStream { continuation in
            Task {
                await self.setupBrowsers(continuation: continuation)
            }
        }
    }
    
    /// Stop all discovery
    func stopDiscovery() {
        browsers.forEach { $0.cancel() }
        browsers.removeAll()
        discoveredEndpoints.removeAll()
    }
    
    private func setupBrowsers(continuation: AsyncStream<DiscoveryEvent>.Continuation) {
        // Clear existing browsers
        stopDiscovery()
        
        for (serviceType, deviceType) in serviceTypes {
            let descriptor = NWBrowser.Descriptor.bonjour(type: serviceType, domain: "local.")
            let parameters = NWParameters()
            parameters.includePeerToPeer = true
            
            let browser = NWBrowser(for: descriptor, using: parameters)
            browsers.append(browser)
            
            browser.stateUpdateHandler = { state in
                switch state {
                case .ready:
                    print("[Discovery] Browser ready for \(serviceType)")
                case .failed(let error):
                    print("[Discovery] Browser failed for \(serviceType): \(error)")
                    continuation.yield(.error(error))
                case .cancelled:
                    print("[Discovery] Browser cancelled for \(serviceType)")
                default:
                    break
                }
            }
            
            browser.browseResultsChangedHandler = { results, changes in
                for change in changes {
                    switch change {
                    case .added(let result):
                        Task {
                            await self.handleEndpointAdded(result, deviceType: deviceType, continuation: continuation)
                        }
                    case .removed(let result):
                        Task {
                            await self.handleEndpointRemoved(result, continuation: continuation)
                        }
                    default:
                        break
                    }
                }
            }
            
            browser.start(queue: .global(qos: .userInitiated))
        }
    }
    
    private func handleEndpointAdded(
        _ result: NWBrowser.Result,
        deviceType: DeviceType,
        continuation: AsyncStream<DiscoveryEvent>.Continuation
    ) {
        discoveredEndpoints[result.endpoint] = deviceType
        
        // Resolve the endpoint to get IP address
        // We prefer IPv4 for display clarity.
        // We configure the parameters to prefer .v4
        let parameters = NWParameters.tcp
        if let ipOptions = parameters.defaultProtocolStack.internetProtocol as? NWProtocolIP.Options {
            ipOptions.version = .v4
        }
        
        let connection = NWConnection(to: result.endpoint, using: parameters)
        connection.stateUpdateHandler = { [weak self] state in
            switch state {
            case .ready:
                if let innerEndpoint = connection.currentPath?.remoteEndpoint,
                   case .hostPort(let host, let port) = innerEndpoint {
                    
                    var ipAddress: String = "unknown"
                    
                    switch host {
                    case .ipv4(let addr):
                        ipAddress = "\(addr)"
                    case .ipv6(let addr):
                        ipAddress = "\(addr)"
                    case .name(let name, _):
                        ipAddress = name
                    @unknown default:
                        break
                    }
                    
                    // Universal cleanup: Strip interface identifier (e.g. %en0) if present
                    if let separatorIndex = ipAddress.firstIndex(of: "%") {
                        ipAddress = String(ipAddress[..<separatorIndex])
                    }
                    
                    // Extract name from endpoint metadata
                    var deviceName = "Unknown Device"
                    if case .service(let name, _, _, _) = result.endpoint {
                        deviceName = name
                    }
                    
                    // Debug: Log the resolved IP address
                    print("[Discovery] Resolved \(deviceName) at \(ipAddress):\(port.rawValue)")
                    
                    // Critical: Do not yield if IP is unknown or empty
                    guard !ipAddress.isEmpty, ipAddress != "unknown" else {
                         print("[Discovery] Dropping \(deviceName) due to unresolved IP")
                         return
                    }
                    
                    continuation.yield(.deviceFound(
                        name: deviceName,
                        ipAddress: ipAddress,
                        port: Int(port.rawValue),
                        type: deviceType
                    ))
                }
                connection.cancel()
            case .failed:
                connection.cancel()
            default:
                break
            }
        }
        connection.start(queue: .global(qos: .userInitiated))
    }
    
    private func handleEndpointRemoved(
        _ result: NWBrowser.Result,
        continuation: AsyncStream<DiscoveryEvent>.Continuation
    ) {
        discoveredEndpoints.removeValue(forKey: result.endpoint)
        
        if case .service(let name, _, _, _) = result.endpoint {
            continuation.yield(.deviceLost(name: name))
        }
    }
}

/// Events from network discovery
enum DiscoveryEvent {
    case deviceFound(name: String, ipAddress: String, port: Int, type: DeviceType)
    case deviceLost(name: String)
    case error(Error)
}
