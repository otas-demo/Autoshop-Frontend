# OTAS POS

A lightweight, offline-capable Point of Sale system tailored for mobile accessory shops with dual-location inventory management.

## Features

- **Point of Sale**: Complete sales management with receipt printing
- **Inventory Management**: Track products across multiple locations
- **Warehouse & Storefront**: Dual-location inventory tracking
- **Supplier Management**: Manage vendors and purchase orders
- **Credit Sales**: Handle customer credit accounts and payments
- **Expense Tracking**: Monitor business expenses
- **Reporting**: Comprehensive sales and inventory reports
- **Multi-language Support**: English and Myanmar language support
- **Offline Capability**: Works without internet connection
- **Modern UI**: Clean, responsive interface with light blue theme

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Local Storage**: Data persistence

## Getting Started

**Prerequisites:** Modern web browser (Chrome, Firefox, Safari, Edge)

### Run Locally

1. Clone or download the project files
2. Open `index.html` in your web browser
   - Or use a local server for better development experience:

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve .

   # Using PHP
   php -S localhost:8000
   ```

3. Navigate to `http://localhost:8000` (or appropriate port)

## Usage

1. **First Time Setup**: Create admin account through login screen
2. **Dashboard**: Access all main features from the sidebar
3. **Sales**: Use POS interface for daily transactions
4. **Inventory**: Manage products and stock levels
5. **Reports**: View sales analytics and inventory reports

## Data Storage

All data is stored locally in the browser's localStorage:

- Sales transactions
- Product inventory
- Customer information
- Supplier details
- User accounts

**Note**: Data is stored locally and not synchronized across devices or browsers.

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

This project is proprietary software for OTAS POS system.

# AutoShop (OTAS POS)

A lightweight Point of Sale system tailored for mobile accessory shops with dual-location inventory management (warehouse + storefront).

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **HTTP Client:** Axios with JWT auth interceptors
- **Charts:** Recharts
- **Icons:** Lucide React
- **PDF:** jsPDF + jspdf-autotable
- **Deployment:** Netlify

## Features

- **Point of Sale** - Complete sales workflow with multiple payment methods (Cash, KBZPay, WavePay, AYA Pay, UAB Pay, Bank Transfer, Credit, FOC)
- **Inventory Management** - Product CRUD, Excel import, stock tracking across locations
- **Dual-Location Stock** - Warehouse and storefront inventory with transfer management
- **Purchase Orders** - PO creation, Goods Received Notes (GRN), stock transfers
- **Credit System** - Credit personas, outstanding balances, payment recording
- **Supplier Management** - Supplier profiles with soft-delete/restore
- **Expense Tracking** - Categorized expense management
- **Reporting** - Sales reports, product statistics, credit order analytics, FOC reports
- **Account Management** - User accounts with Owner/Cashier/Manager roles
- **Multi-language** - English and Myanmar language support
- **Shop Settings** - Configurable shop name, address, phone, logo, and tax settings
- **AI Chat** - Built-in AI assistant

## Prerequisites

- Node.js 18+
- npm or yarn

## Getting Started

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd Autoshop-Frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your API base URL:

   ```
   VITE_API_BASE_URL=https://your-api-domain.com/api/v1/
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` in your browser.

## Available Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start Vite dev server on port 3000 |
| `npm run build`   | Build for production               |
| `npm run preview` | Preview production build locally   |

## Project Structure

```
Autoshop-Frontend/
├── public/                  # Static assets (logos, images)
├── components/              # Reusable UI components
│   ├── Common/              # Shared modals
│   ├── Inventory/           # Product components
│   ├── Orders/              # Order components
│   ├── Print/               # Receipt printing
│   ├── Purchasing/          # PO/GRN components
│   ├── Reports/             # Report components
│   └── Settings/            # Settings components
├── context/                 # React context providers
│   ├── AppContext.tsx        # Global state management
│   └── LanguageContext.tsx   # i18n provider
├── pages/                   # Route-level components (19 pages)
├── services/                # API service layer (14 domain modules)
│   ├── Auth/                # Login, token management
│   ├── Admin/               # User account CRUD
│   ├── Inventory/           # Product management
│   ├── Order/               # Order CRUD
│   ├── Purchase/            # PO and GRN management
│   ├── Credit/              # Credit personas and records
│   ├── Expense/             # Expense CRUD
│   ├── Reports/             # Analytics endpoints
│   ├── Supplier/            # Supplier CRUD
│   ├── Warehouse/           # Warehouse profiles and stock
│   ├── Storefront/          # Storefront profiles and stock
│   ├── ShopSettings/        # Shop configuration
│   ├── StockAudit/          # Audit logs
│   └── Location/            # Location profiles
├── translations/            # i18n files (en, my)
├── utils/                   # Utility functions
├── types.ts                 # Shared TypeScript types
├── constants.ts             # App constants and seed data
├── App.tsx                  # Root component with routing
└── index.tsx                # Entry point
```

## Authentication

- JWT-based authentication with token stored in `localStorage`
- Auto-redirect to `/login` on 401 responses
- Protected routes via `ProtectedRoute` component

## Internationalization

- Two languages: English (`en`) and Myanmar (`my`)
- Default language: Myanmar
- Usage: `const { t } = useLanguage(); t("namespace.key")`
- Falls back to English for missing keys

## Deployment

Configured for Netlify with SPA redirect rules. Build the project and deploy the `dist/` folder, or connect your repository to Netlify for automatic deployments.

## License

Proprietary software for OTAS POS system.
