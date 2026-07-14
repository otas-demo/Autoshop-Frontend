# Development Guide

## Architecture Overview

AutoShop Frontend is a React 19 SPA built with Vite and TypeScript. It communicates with a REST API backend via Axios with JWT authentication.

```
┌─────────────────────────────────────────────┐
│                  App.tsx                     │
│  LanguageProvider > AppProvider > Router     │
├─────────────────────────────────────────────┤
│  Pages (route components)                   │
│  └── consume context + call services        │
├─────────────────────────────────────────────┤
│  Services (API layer)                       │
│  └── 14 domain modules using Axios          │
├─────────────────────────────────────────────┤
│  Backend API (VITE_API_BASE_URL)            │
└─────────────────────────────────────────────┘
```

## State Management

### AppContext (`context/AppContext.tsx`)
- Holds global application state: products, sales, customers, expenses, purchase orders, GRNs, logs, current user
- Exposes action methods: `addProduct`, `processSale`, `cancelSale`, `transferStock`, `createPurchaseOrder`, `createGRN`, `addExpense`, `addCustomer`, `recordPayment`
- Persists state to localStorage via `services/dataService.ts`
- Role-based business rules (Staff discount limits, Admin-only cancellation)

### LanguageContext (`context/LanguageContext.tsx`)
- Manages current language (`"en"` or `"my"`)
- Provides `t(key)` function for translation lookups using dot-notation
- Persists language preference to localStorage
- Falls back to English for missing keys

## Routing

All routes are defined in `App.tsx`. Protected routes use the `ProtectedRoute` wrapper.

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `Login` | Authentication page |
| `/pos` | `POS` | Point of Sale terminal |
| `/inventory` | `Inventory` | Product management |
| `/warehouse` | `Warehouse` | Warehouse listing |
| `/warehouse/:id` | `WarehouseDetail` | Single warehouse detail |
| `/storefront` | `Storefront` | Storefront listing |
| `/storefront/:id` | `StorefrontDetail` | Single storefront detail |
| `/suppliers` | `Suppliers` | Supplier management |
| `/purchasing` | `Purchasing` | Purchase orders |
| `/orders` | `Orders` | Order management |
| `/credit-orders` | `CreditOrders` | Credit-based orders |
| `/credits` | `Credits` | Credit personas |
| `/credits/:id` | `CreditDetail` | Individual credit detail |
| `/expenses` | `Expenses` | Expense tracking |
| `/reports` | `Reports` | Analytics and reports |
| `/settings` | `Settings` | Shop settings |
| `/accounts` | `AccountManagement` | User accounts |
| `/ai-chat` | `AIChat` | AI assistant |
| `/mobile-print/:orderId` | `MobilePrint` | Mobile receipt printing |
| `/print-receipt/:orderId` | `PrintReceipt` | Receipt printing |

## Key Types (`types.ts`)

```typescript
// Core domain types
Product        // id, name, category, stockWarehouse, stockShop, costPrice, sellingPrice
CartItem       // extends Product with qty
Sale           // invoiceNumber, items[], subtotal, total, paymentMethod, status
Customer       // name, phone, outstandingBalance
Expense        // title, amount, category, date
Supplier       // supplierName, contactNumber
WarehouseProfile  // locationCode, locationName, address, phone
PurchaseOrder  // poNumber, supplierName, items[], status (PENDING|PARTIALLY_RECEIVED|RECEIVED)
GoodsReceivedNote  // grnNumber, poId, items[] (qtyGood, qtyBad)
AuditLog       // action, details, user, timestamp

// Enums
Role           // ADMIN, STAFF
PaymentMethod  // Cash, KBZPay, WavePay, AYAPay, UABPay, BankTransfer, Credit, FOC
ProductCategory // PhoneCover, TemperedGlass, ChargerCable, etc.
```

## Service Layer Pattern

Each service module follows a consistent pattern:

```typescript
// services/Domain/functionName.ts
import axios from "../axios";

export const createSomething = async (data: CreatePayload) => {
  const response = await axios.post("/endpoint", data);
  return response.data;
};
```

- All API calls use the configured Axios instance (`services/axios.ts`)
- JWT token is auto-attached via request interceptor
- 401 responses trigger auto-logout and redirect to `/login`
- Base URL is configured via `VITE_API_BASE_URL` env variable

## Adding a New Page

1. Create `pages/NewPage.tsx`
2. Add route in `App.tsx` inside the `ProtectedRoute` wrapper
3. Add navigation link in `components/Sidebar.tsx`
4. Add translation keys in `translations/en.ts` and `translations/my.ts`

## Adding a New Service

1. Create `services/Domain/functionName.ts`
2. Import `axios` from `../axios`
3. Export an async function that calls the appropriate HTTP method
4. Add types in `types.ts` if needed

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | Yes |
| `GEMINI_API_KEY` | Google Gemini API key (for AI chat) | No |

## TypeScript Config

- Target: ES2022
- Module: ESNext with bundler resolution
- Path alias: `@/*` maps to project root
- `noEmit: true` (type-checking only)
- Strict mode is not enabled

## Build & Deploy

```bash
# Development
npm run dev        # Starts on http://localhost:3000

# Production
npm run build      # Outputs to dist/
npm run preview    # Preview dist/ locally
```

Deploy to Netlify by pushing to your connected repository. The `netlify.toml` handles SPA routing.
