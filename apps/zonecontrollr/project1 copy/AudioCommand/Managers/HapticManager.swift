import UIKit

/// Manages haptic feedback for the application
@MainActor
final class HapticManager {
    static let shared = HapticManager()
    
    private let impactGenerator = UIImpactFeedbackGenerator(style: .medium)
    private let notificationGenerator = UINotificationFeedbackGenerator()
    private let selectionGenerator = UISelectionFeedbackGenerator()
    
    private init() {
        impactGenerator.prepare()
        notificationGenerator.prepare()
        selectionGenerator.prepare()
    }
    
    /// Trigger an impact feedback (e.g., button press)
    func impact(style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred()
    }
    
    /// Trigger a selection change feedback (e.g., slider movement)
    func selection() {
        selectionGenerator.selectionChanged()
        // Re-prepare for next time
        selectionGenerator.prepare()
    }
    
    /// Trigger a notification feedback (e.g., success/error)
    func notification(type: UINotificationFeedbackGenerator.FeedbackType) {
        notificationGenerator.notificationOccurred(type)
        notificationGenerator.prepare()
    }
}
