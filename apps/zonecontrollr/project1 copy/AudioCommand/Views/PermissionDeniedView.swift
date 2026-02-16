import SwiftUI

/// View shown when Local Network permission is denied
struct PermissionDeniedView: View {
    var body: some View {
        VStack(spacing: 24) {
            // Icon
            Image(systemName: "network.slash")
                .font(.system(size: 60))
                .foregroundStyle(.orange)
            
            // Title
            Text("Local Network Access Required")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
            
            // Explanation
            VStack(alignment: .leading, spacing: 12) {
                Text("Audio Command needs permission to discover devices on your network.")
                    .foregroundStyle(.white.opacity(0.8))
                
                Text("To enable:")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
                
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .top, spacing: 8) {
                        Text("1.")
                            .foregroundStyle(.white.opacity(0.6))
                        Text("Tap **Open Settings** below")
                            .foregroundStyle(.white.opacity(0.8))
                    }
                    
                    HStack(alignment: .top, spacing: 8) {
                        Text("2.")
                            .foregroundStyle(.white.opacity(0.6))
                        Text("Toggle **Local Network** to ON")
                            .foregroundStyle(.white.opacity(0.8))
                    }
                    
                    HStack(alignment: .top, spacing: 8) {
                        Text("3.")
                            .foregroundStyle(.white.opacity(0.6))
                        Text("Return to Audio Command")
                            .foregroundStyle(.white.opacity(0.8))
                    }
                }
                .font(.system(size: 14))
            }
            .padding(16)
            .background(.white.opacity(0.05))
            .cornerRadius(12)
            
            // Open Settings Button
            Button {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            } label: {
                HStack {
                    Image(systemName: "gear")
                    Text("Open Settings")
                        .font(.system(size: 16, weight: .semibold))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    LinearGradient(
                        colors: [.orange, .orange.opacity(0.8)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(12)
            }
        }
        .padding(32)
        .frame(maxWidth: 400)
    }
}

#Preview {
    ZStack {
        Color.black
        PermissionDeniedView()
    }
}
