import SwiftUI

struct ControlDeckView: View {
    @Environment(DeviceManager.self) private var deviceManager
    let device: Device
    
    @State private var localVolume: Double = 0
    @State private var isDraggingVolume: Bool = false
    
    var body: some View {
        HStack(spacing: 20) {
            // 1. Info Area
            VStack(alignment: .leading, spacing: 4) {
                Text(device.preferences.customName ?? device.name)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                
                Text(device.status.metadataDisplay)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))
                    .lineLimit(1)
            }
            .frame(maxWidth: 200, alignment: .leading)
            
            Divider()
                .overlay(Color.white.opacity(0.2))
            
            // 2. Transport Controls
            HStack(spacing: 16) {
                Button {
                    Task { await deviceManager.previousTrack(for: device) }
                } label: {
                    Image(systemName: "backward.fill")
                        .font(.title3)
                }

                Button {
                    Task { await deviceManager.togglePlayPause(for: device) }
                } label: {
                    Image(systemName: device.status.playbackState == .playing ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 44))
                }
                
                Button {
                    Task { await deviceManager.nextTrack(for: device) }
                } label: {
                    Image(systemName: "forward.fill")
                        .font(.title3)
                }
            }
            .foregroundStyle(.white)
            
            Divider()
                .overlay(Color.white.opacity(0.2))
            
            // 3. Volume
            HStack {
                Image(systemName: "speaker.wave.2.fill")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
                
                Slider(value: $localVolume, in: 0...100, step: 1) { editing in
                    isDraggingVolume = editing
                    if !editing {
                        Task { await deviceManager.setVolume(Int(localVolume), for: device) }
                    }
                }
                .frame(width: 120)
            }
            
            Divider()
                .overlay(Color.white.opacity(0.2))
                
            // 4. Presets
            HStack(spacing: 12) {
                ForEach(1...3, id: \.self) { index in
                    Button {
                        Task { await deviceManager.triggerPreset(index, for: device) }
                    } label: {
                        Text("\(index)")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .frame(width: 32, height: 32)
                            .background(Color.white.opacity(0.15))
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.white.opacity(0.3), lineWidth: 1))
                    }
                    .foregroundStyle(.white)
                }
            }
        }
        .padding(16)
        .background {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.2), radius: 10, y: 10)
        }
        .padding(.bottom, 20)
        .onAppear {
            localVolume = Double(device.status.volume)
        }
        .onChange(of: device.status.volume) { oldValue, newValue in
            if !isDraggingVolume {
                localVolume = Double(newValue)
            }
        }
    }
}
