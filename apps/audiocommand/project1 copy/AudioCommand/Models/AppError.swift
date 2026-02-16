import Foundation

/// Application-wide errors for Audio Command
enum AppError: LocalizedError, Equatable {
    case network(String)
    case discovery(String)
    case parsing(String)
    case api(String, statusCode: Int)
    case timeout
    case unknown(String)
    case generic(String)
    
    var errorDescription: String? {
        switch self {
        case .network(let msg): return "Network Error: \(msg)"
        case .discovery(let msg): return "Discovery Error: \(msg)"
        case .parsing(let msg): return "Data Parsing Error: \(msg)"
        case .api(let msg, let code): return "API Error (\(code)): \(msg)"
        case .timeout: return "Request Timed Out"
        case .unknown(let msg): return "Unknown Error: \(msg)"
        case .generic(let msg): return msg
        }
    }
    
    var title: String {
        switch self {
        case .network: return "Connection Lost"
        case .discovery: return "No Devices Found"
        case .parsing: return "Data Issue"
        case .api: return "Command Failed"
        case .timeout: return "Timeout"
        case .unknown: return "Error"
        case .generic: return "Error"
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .network: return "Check your WiFi connection."
        case .discovery: return "Ensure devices are powered on."
        case .timeout: return "Try again."
        default: return nil
        }
    }
}
