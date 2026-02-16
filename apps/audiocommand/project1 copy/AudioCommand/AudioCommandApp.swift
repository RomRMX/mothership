import SwiftUI

@main
struct AudioCommandApp: App {
    @State private var deviceManager = DeviceManager()
    
    var body: some Scene {
        WindowGroup {
            ZoneWallView()
                .environment(deviceManager)
        }
    }
}
