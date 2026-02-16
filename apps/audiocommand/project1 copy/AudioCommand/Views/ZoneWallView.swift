import SwiftUI

struct SpeakerZone: Identifiable {
    let id = UUID()
    let name: String
    let rect: CGRect // Normalized 0-1 coordinates
    
    // Labels corresponding to the "Red Box" map provided by the user
    // Top Row
    static let asm63_left = SpeakerZone(name: "ASM63", rect: CGRect(x: 0.10, y: 0.05, width: 0.12, height: 0.12))
    static let asm63_center = SpeakerZone(name: "ASM63", rect: CGRect(x: 0.44, y: 0.05, width: 0.12, height: 0.12))
    static let asm63_right = SpeakerZone(name: "ASM63", rect: CGRect(x: 0.78, y: 0.05, width: 0.12, height: 0.12))
    
    // Left Hex
    static let lsh80_hex_left = SpeakerZone(name: "LSH80", rect: CGRect(x: 0.03, y: 0.22, width: 0.09, height: 0.09))
    static let lsh60_hex_left = SpeakerZone(name: "LSH60", rect: CGRect(x: 0.13, y: 0.24, width: 0.08, height: 0.10))
    static let lsh40_hex_left = SpeakerZone(name: "LSH40", rect: CGRect(x: 0.23, y: 0.31, width: 0.06, height: 0.08))
    
    // Right Hex
    static let lsh40_hex_right = SpeakerZone(name: "LSH40", rect: CGRect(x: 0.70, y: 0.31, width: 0.06, height: 0.08))
    static let lsh60_hex_right = SpeakerZone(name: "LSH60", rect: CGRect(x: 0.79, y: 0.25, width: 0.08, height: 0.10))
    static let lsh80_hex_right = SpeakerZone(name: "LSH80", rect: CGRect(x: 0.89, y: 0.22, width: 0.09, height: 0.09))
    
    // Planters - Left
    static let alsb106_left = SpeakerZone(name: "ALSB106", rect: CGRect(x: 0.03, y: 0.50, width: 0.07, height: 0.20))
    static let alsb85_left = SpeakerZone(name: "ALSB85", rect: CGRect(x: 0.13, y: 0.52, width: 0.06, height: 0.17))
    static let alsb64_left = SpeakerZone(name: "ALSB64", rect: CGRect(x: 0.22, y: 0.54, width: 0.05, height: 0.14))
    
    // Planters - Center (Red map labels them LSH80/60/40, Sketch says Mushrooms)
    static let lsh80_center = SpeakerZone(name: "LSH80", rect: CGRect(x: 0.37, y: 0.63, width: 0.07, height: 0.10))
    static let lsh60_center = SpeakerZone(name: "LSH60", rect: CGRect(x: 0.46, y: 0.61, width: 0.09, height: 0.12))
    static let lsh40_center = SpeakerZone(name: "LSH40", rect: CGRect(x: 0.58, y: 0.62, width: 0.10, height: 0.12))
    
    // Planters - Right
    static let alsb64_right = SpeakerZone(name: "ALSB64", rect: CGRect(x: 0.72, y: 0.54, width: 0.05, height: 0.14))
    static let alsb85_right = SpeakerZone(name: "ALSB85", rect: CGRect(x: 0.83, y: 0.52, width: 0.06, height: 0.17))
    static let alsb106_right = SpeakerZone(name: "ALSB106", rect: CGRect(x: 0.92, y: 0.50, width: 0.07, height: 0.20))
    
    static let allZones: [SpeakerZone] = [
        asm63_left, asm63_center, asm63_right,
        lsh80_hex_left, lsh60_hex_left, lsh40_hex_left,
        lsh40_hex_right, lsh60_hex_right, lsh80_hex_right,
        alsb106_left, alsb85_left, alsb64_left,
        lsh80_center, lsh60_center, lsh40_center,
        alsb64_right, alsb85_right, alsb106_right
    ]
}

struct ZoneWallView: View {
    @Environment(DeviceManager.self) private var deviceManager
    @State private var selectedDevice: Device?
    @State private var tapLocation: CGPoint? // For debugging
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                // 1. Background Image
                // Note: User needs to add 'WallBackground' to Assets
                Image("WallBackground")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()
                    .onTapGesture { location in
                        print("Tap at normalized: x: \(location.x / geo.size.width), y: \(location.y / geo.size.height)")
                    }
                
                // 2. Interactive Zones
                ForEach(SpeakerZone.allZones) { zone in
                    let frame = CGRect(
                        x: zone.rect.origin.x * geo.size.width,
                        y: zone.rect.origin.y * geo.size.height,
                        width: zone.rect.width * geo.size.width,
                        height: zone.rect.height * geo.size.height
                    )
                    
                    // Determine if this zone represents the currently selected device
                    let isSelected = selectedDevice?.name.localizedCaseInsensitiveContains(zone.name) ?? false
                    
                    ZStack {
                        // Invisible Tappable Area (Debug: Semitransparent red)
                        RoundedRectangle(cornerRadius: 12)
                            .fill(isSelected ? Color.blue.opacity(0.4) : Color.red.opacity(0.01)) // Make it practically invisible but tappable
                            .frame(width: frame.width, height: frame.height)
                            .position(x: frame.midX, y: frame.midY)
                            .onTapGesture {
                                handleZoneTap(zone)
                            }
                        
                        // Active Indicator Ring
                        if isSelected {
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.blue, lineWidth: 3)
                                .shadow(color: .blue, radius: 10)
                                .frame(width: frame.width, height: frame.height)
                                .position(x: frame.midX, y: frame.midY)
                        }
                    }
                }
                
                // 3. Control Deck (Floating)
                VStack {
                    Spacer()
                    if let selected = selectedDevice {
                        ControlDeckView(device: selected)
                            .padding(.horizontal, 40)
                            .padding(.bottom, 40)
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    } else {
                        // Empty state or instructions?
                        Text("Select a speaker to begin")
                            .font(.title2)
                            .fontWeight(.medium)
                            .foregroundStyle(.white)
                            .padding()
                            .background(.ultraThinMaterial)
                            .cornerRadius(12)
                            .padding(.bottom, 60)
                    }
                }
            }
        }
        .ignoresSafeArea()
        .statusBar(hidden: true)
    }
    
    private func handleZoneTap(_ zone: SpeakerZone) {
        print("Tapped zone: \(zone.name)")
        
        // Find matching device
        // We look for a device that contains the zone name (e.g. "Planter ASM63" contains "ASM63")
        // Prefer "Planter" group devices if possible due to previous logic
        let match = deviceManager.devices.values.first { device in
            device.name.localizedCaseInsensitiveContains(zone.name) &&
            device.name.localizedCaseInsensitiveContains("Planter")
        }
        
        if let device = match {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                selectedDevice = device
            }
            // Trigger backend solo mode
            Task {
                await deviceManager.activateSoloMode(for: device)
            }
        } else {
            print("No matching device found for zone: \(zone.name)")
            // Maybe show an alert or shake animation?
        }
    }
}
