# Code Style & Conventions

This ruleset governs file organization, language features, and functional style inside the frontend application.

## 1. File & Folder Naming Conventions
- **Components**: Use `PascalCase.tsx` (e.g., `ShopInfoCard.tsx`, `DailyReportScheduleCard.tsx`).
- **Custom Hooks**: Use `camelCase.ts` starting with `use` prefix (e.g., `useLanguage.ts`, `useApp.ts`).
- **Helper Utilities & Services**: Use `camelCase.ts` (e.g., `printPaperSize.ts`, `fetchShopSettings.ts`).
- **Folders**: Use `PascalCase` for component category folders (e.g., `components/Settings/`) and `camelCase` for structural/utility folders.
- **Assets & Style sheets**: Use `kebab-case` for global resources.

## 2. TypeScript Guidelines
- **Strict Typing Mandatory**: Do not use `any`. Use unknown, generics, or type unions when values are dynamic.
- **Explicit Interfaces**: Export clear type interfaces for component properties (`interface XProps { ... }`).
- **Functional Components**: Declare all React components as `React.FC<Props>` or regular functions with explicit return typing `React.ReactElement`.
- **Destructuring**: Destructure props directly in function parameters.

## 3. Best Practices for Hooks, Props, and Handlers
- **Props Naming**: Use the `on*` naming convention for event callback props (e.g., `onSuccess`, `onCancel`, `onStatusChange`).
- **Event Handlers**: Use the `handle*` naming convention for internal component methods that trigger actions (e.g., `handleSubmit`, `handleSave`, `handleFileChange`).
- **Hooks Order**: Place Hooks at the top of the component functions in the following order:
  1. React contexts (`useLanguage`, etc.)
  2. Router/Navigation hooks (`useNavigate`, `useParams`)
  3. Local state hooks (`useState`)
  4. References (`useRef`)
  5. Callbacks & effects (`useCallback`, `useEffect`)
