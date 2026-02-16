import Foundation

/// A persistent group of devices that can be activated together
struct SavedGroup: Identifiable, Codable {
    let id: UUID
    var name: String
    var deviceIds: [UUID]
    var masterDeviceId: UUID?
    
    init(id: UUID = UUID(), name: String, deviceIds: [UUID], masterDeviceId: UUID? = nil) {
        self.id = id
        self.name = name
        self.deviceIds = deviceIds
        self.masterDeviceId = masterDeviceId
    }
}
