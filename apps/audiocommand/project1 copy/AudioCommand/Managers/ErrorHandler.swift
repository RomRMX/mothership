import Foundation
import SwiftUI

/// Manages error state and notification presentation
@Observable
@MainActor
final class ErrorHandler {
    static let shared = ErrorHandler()
    
    /// Current active error to display
    var currentError: AppError?
    
    /// Whether the toast is visible
    var isShowingToast: Bool = false
    
    private var dismissTask: Task<Void, Never>?
    
    init() {}
    
    /// Trigger an error toast
    func handle(error: Error) {
        if let appError = error as? AppError {
            show(appError)
        } else {
            // Use the localized description directly to avoid "Unknown Error" prefix
            // if we can map it to a generic case without the prefix
            show(.generic(error.localizedDescription))
        }
    }
    
    func show(_ error: AppError) {
        // Cancel any pending dismiss
        dismissTask?.cancel()
        
        // Update state with animation
        withAnimation {
            self.currentError = error
            self.isShowingToast = true
        }
        
        // Auto-dismiss after 4 seconds
        dismissTask = Task {
            try? await Task.sleep(for: .seconds(4))
            guard !Task.isCancelled else { return }
            
            withAnimation {
                self.isShowingToast = false
            }
            
            // Clear error object after animation completes
            try? await Task.sleep(for: .seconds(0.5))
            self.currentError = nil
        }
    }
    
    /// Manually dismiss
    func dismiss() {
        dismissTask?.cancel()
        withAnimation {
            isShowingToast = false
        }
    }
}
