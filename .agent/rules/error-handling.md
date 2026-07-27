# Error Handling & API Rules

This ruleset governs network requests, error boundary wraps, logging protocols, and user-facing notifications.

## 1. Async/Await Standards
- **No Promise Callbacks**: Avoid using `.then()` and `.catch()` callbacks. Write standard `async/await` syntax instead.
- **API Call Wrappers**: All async service requests must be wrapped in `try/catch` blocks inside custom service calls or local hooks.
- **Handling Loaders**: Ensure toggling loading states (`setLoading(true)` / `setLoading(false)`) is securely placed within `finally` blocks to guarantee loader cleanups.

## 2. API try-catch Wrappers & Feedback
- **User-Facing Toast Notifications**: Use `sonner` (`import { toast } from "sonner"`) to notify users of events.
  - On Success: `toast.success(message)`
  - On Failure: `toast.error(errorMessage || "Default fallback message")`
- **Confirmation dialogs**: For irreversible user actions (e.g., delete shop logo, remove inventory items), always wrap trigger actions in `<ConfirmModal>` prompts.

## 3. Proper Logging Practices
- **Catch block logging**: Always log caught errors in the developer console (`console.error("Contextual descriptive tag:", error)`) before displaying generic user-facing failure popups.
- **Production Safety**: Ensure no plain API tokens or raw backend stack-traces are logged to the console or printed in user toasts.
