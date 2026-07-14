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
