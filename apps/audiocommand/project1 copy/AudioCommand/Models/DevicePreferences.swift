import Foundation

/// User preferences for a specific device
struct DevicePreferences: Codable, Sendable, Equatable {
    var customName: String?
    var isFavorite: Bool
    var groupSortOrder: Int
    var isHidden: Bool
    
    static let `default` = DevicePreferences(
        customName: nil,
        isFavorite: false,
        groupSortOrder: 0,
        isHidden: false
    )
}
