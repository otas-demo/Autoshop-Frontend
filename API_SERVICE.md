# API Service Reference

## Base Configuration

- **Base URL:** Configured via `VITE_API_BASE_URL` env variable
- **Auth:** JWT Bearer token stored in `localStorage` key `authToken`
- **Interceptors:** Auto-attached token on requests; auto-logout + redirect on 401 responses

---

## Auth

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `login` | POST | `/admin/login` | `{ name, password }` | `{ admin, token }` |

---

## Admin

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `createAdminAccount` | POST | `/admin/signup` | `{ name, password, confirmPassword, locationId?, role }` | Admin object |
| `fetchAdminAccounts` | GET | `/admin` | - | Admin[] |
| `updateAdminAccount` | PATCH | `/admin/:accountId` | `{ name?, role? }` | Updated admin |
| `deleteAdminAccount` | DELETE | `/admin/:accountId` | - | - |
| `softDeleteAdminAccount` | PATCH | `/admin/soft-delete/:accountId` | - | - |
| `restoreAdminAccount` | PATCH | `/admin/restore/:accountId` | - | - |

---

## Inventory

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `createProduct` | POST | `/inventory` | `{ productName, productCode, SKU?, category?, buyingPrice, sellingPrice, wholesalePrices?, quantity?, description? }` | Product |
| `fetchProducts` | GET | `/inventory` | - | Product[] |
| `fetchProductById` | GET | `/inventory/:productId` | - | Product (with stock details) |
| `fetchCategories` | GET | `/inventory/categories` | - | string[] |
| `updateProduct` | PATCH | `/inventory/:productId` | `{ productName, productCode, SKU, category, buyingPrice, sellingPrice, wholesalePrices?, unitOfMeasure, ... }` | Updated product |
| `updateProductStatus` | PATCH | `/inventory/:productId` | `{ status: "active" \| "inactive" }` | - |
| `importExcel` | POST | `/inventory/import-excel` | File (multipart/form-data) | `{ created, failed }` |
| `transferInventoryToStorefront` | POST | `/storefront-inventory` | `{ inventoryIds[], storefrontId }` | - |
| `transferInventoryToWarehouse` | POST | `/warehouse` | `{ inventoryIds[], warehouseId }` | - |

---

## Orders

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `createOrder` | POST | `/order` | `{ storefrontId, ordersProducts: [{inventoryId, quantity}], paidAmount, paymentType, paymentMethod, creditPersonId?, subTotal?, tax?, discount?, finalAmount? }` | Order |
| `fetchOrders` | GET | `/order` | `startDate?, endDate?, paymentType?` | Order[] |
| `fetchOrderById` | GET | `/order/:orderId` | - | Order |
| `fetchOrdersByStorefront` | GET | `/order` | `storefrontId, startDate?, endDate?` | Order[] |
| `fetchCreditOrders` | GET | `/order` | `paymentType=credit, startDate?, endDate?, paymentMethod?` | Order[] |
| `addItemsToOrder` | PATCH | `/order/:orderId/items/add` | `{ items: [{inventoryId, quantity}], subTotal, tax, discount, finalAmount, extraChange, paidAmount }` | - |
| `removeItemsFromOrder` | PATCH | `/order/:orderId/items/remove` | `{ items: [{inventoryId, quantity}], subTotal, tax, discount, finalAmount, extraChange, paidAmount }` | - |
| `updatePaidAmount` | PATCH | `/order/:orderId/paid-amount` | `paidAmount` | - |
| `assignCreditPerson` | PATCH | `/order/:orderId/credit-person` | `creditPersonId` | - |
| `deleteOrder` | DELETE | `/order/:orderId` | - | - |
| `deleteCreditOrder` | DELETE | `/order/:orderId` | - | - |

---

## Purchasing

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `createPurchase` | POST | `/purchase` | `{ products: [{inventoryId, purchaseQuantity}], supplierId, note?, totalAmount }` | Purchase |
| `fetchPurchases` | GET | `/purchase` | `page?, limit?, isDeleted?, status?` | Purchase[] |
| `fetchPurchaseById` | GET | `/purchase/:purchaseId` | - | Purchase |
| `updatePurchaseStatus` | PATCH | `/purchase/:id/status` | `status` | - |
| `softDeletePurchase` | PATCH | `/purchase/:purchaseId/soft-delete` | - | - |
| `restorePurchase` | PATCH | `/purchase/:purchaseId/restore` | - | - |

### Goods Received Notes (GRN)

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `createGRN` | POST | `/grn` | `{ purchasingId, lineItems: [{productCode, goodQuantity, badQuantity}], grnDate, notes }` | GRN |
| `fetchGRNs` | GET | `/grn` | `page?, limit?` | GRN[] |
| `fetchGRNById` | GET | `/grn/:grnId` | - | GRN |
| `updateGRNStatus` | PATCH | `/grn/:grnId/status` | `status` | - |
| `updateGRNLineItems` | PATCH | `/grn/:grnId/line-items` | `[{lineItemId, goodQuantity, badQuantity, notes?}]` | - |

### Transfers

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `transferGRN` | POST | `/transfer` | `{ grnId, destinationWarehouseId, lineItems: [{productCode, quantity}], transferDate, notes? }` | Transfer |
| `fetchTransfers` | GET | `/transfer` | - | Transfer[] |
| `fetchTransferById` | GET | `/transfer/:transferId` | - | Transfer |
| `updateTransferStatus` | PATCH | `/transfer/:transferId/status` | `status` | - |

---

## Credit

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `createCreditPersona` | POST | `/credit-persona` | `{ name, phone, address? }` | Persona |
| `fetchCreditPersonas` | GET | `/credit-persona` | - | Persona[] |
| `updateCreditPersona` | PATCH | `/credit-persona/:creditPersonId` | `{ name?, phone?, address? }` | Updated persona |
| `createCreditRecord` | POST | `/credit-record` | `{ orderId, paidAmount, paymentMethod }` | Record |
| `fetchCreditPersonaRecords` | GET | `/credit-persona/:creditPersonId/credit-records` | `page?` | Records with summary |

---

## Supplier

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `createSupplier` | POST | `/supplier-profile` | `{ supplierName, contactNumber }` | Supplier |
| `fetchSuppliers` | GET | `/supplier-profile` | `isDeleted?` | Supplier[] |
| `updateSupplier` | PATCH | `/supplier-profile/:supplierId` | `{ supplierName?, contactNumber? }` | Updated supplier |
| `softDeleteSupplier` | PATCH | `/supplier-profile/:supplierId/soft-delete` | - | - |
| `restoreSupplier` | PATCH | `/supplier-profile/:supplierId/restore` | - | - |
| `deleteSupplier` | DELETE | `/supplier-profile/:supplierId` | - | - |

---

## Warehouse

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `createWarehouseProfile` | POST | `/warehouse-profile` | `{ warehouseCode, warehouseName, address, phone, email?, managerName?, status?, description?, notes? }` | Profile |
| `fetchWarehouseProfiles` | GET | `/warehouse-profile` | - | Profile[] |
| `updateWarehouseProfile` | PATCH | `/warehouse-profile/:warehouseId` | Profile fields | Updated profile |
| `fetchWarehouseStock` | GET | `/warehouse` | `warehouseId?, page?, limit?, category?, search?` | Stock records |
| `updateWarehouseStockQuantity` | PATCH | `/warehouse/:stockRecordId/quantity` | `{ quantityChange, reason }` | - |
| `createWarehouseTransfer` | POST | `/transfer` | `{ sourceType, sourceWarehouseId, destinationStorefrontId, lineItems: [{productCode, quantity, notes?}], transferDate?, notes? }` | Transfer |

---

## Storefront

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `createStorefrontProfile` | POST | `/storefront-profile` | `{ storefrontCode, storefrontName, address, phone, email?, managerName?, status?, description?, notes? }` | Profile |
| `fetchStorefrontProfiles` | GET | `/storefront-profile` | - | Profile[] |
| `updateStorefrontProfile` | PATCH | `/storefront-profile/:storefrontId` | Profile fields | Updated profile |
| `fetchStorefrontStock` | GET | `/storefront-inventory` | `storefrontId?, page?, limit?, category?, search?` | Stock records |
| `updateStorefrontStockQuantity` | PATCH | `/storefront-inventory/:stockRecordId/quantity` | `{ quantityChange, reason }` | - |

---

## Expense

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `createExpense` | POST | `/expense` | `{ category, amount, date, notes? }` | Expense |
| `fetchExpenses` | GET | `/expense` | `startDate?, endDate?` | Expense[] |
| `updateExpense` | PATCH | `/expense/:expenseId` | `{ category?, amount?, date?, notes? }` | Updated expense |
| `deleteExpense` | DELETE | `/expense/:expenseId` | - | - |

---

## Reports

All report functions come in pairs: single-storefront (requires `storefrontId`) and all-storefronts variant.

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `fetchSaleReport` / `fetchAllStorefrontsSaleReport` | GET | `/sale-report` | `storefrontId?, startDate?, endDate?` | Sales totals |
| `fetchProductSalesStatistics` / `fetchAllStorefrontsProductSalesStatistics` | GET | `/sale-report/products` | `storefrontId?, startDate?, endDate?` | Per-product stats |
| `fetchPaidOrdersReport` / `fetchAllStorefrontsPaidOrdersReport` | GET | `/sale-report/paid-orders` | `storefrontId?, startDate?, endDate?` | Payment method breakdown |
| `fetchCreditOrdersReport` / `fetchAllStorefrontsCreditOrdersReport` | GET | `/sale-report/credit-orders` | `storefrontId?, startDate?, endDate?` | Credit order breakdown |
| `fetchProductsByCreditPerson` | GET | `/sale-report/products-by-credit-person` | `inventoryId?, startDate?, endDate?, storefrontId?` | Credit person analytics |
| `fetchCreditPersonaProducts` | GET | `/sale-report/credit-persona-products` | `creditPersonaId` | Product breakdown |
| `fetchFOCOrders` / `fetchAllStorefrontsFOCOrders` | GET | `/order` | `paymentType=paid&paymentMethod=foc, storefrontId?, startDate, endDate` | FOC orders |
| `fetchCreditRecords` | GET | `/credit-record` | `startDate?, endDate?, storefrontId?, limit?` | Credit payment records |

---

## Shop Settings

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `fetchShopSettings` | GET | `/shop-settings` | - | Settings |
| `saveShopSettings` | POST | `/shop-settings` | `{ shopName, address, phoneNumber }` | Settings |
| `uploadShopLogo` | POST | `/shop-settings/logo` | File (multipart, JPEG/PNG/WebP, max 5MB) | - |
| `deleteShopLogo` | DELETE | `/shop-settings/logo` | - | - |

---

## Stock Audit

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `fetchStockAuditLogs` | GET | `/stock-audit-logs` | `page?, limit?` | Audit logs |

---

## Location

| Function | Method | Endpoint | Parameters | Returns |
|----------|--------|----------|------------|---------|
| `fetchLocationProfiles` | GET | `/location-profile` | - | Location[] |

---

## Common Patterns

### Soft-Delete / Restore
Admin, Supplier, and Purchase domains support soft-delete:
```
PATCH /<resource>/:id/soft-delete    # Deactivate
PATCH /<resource>/:id/restore        # Reactivate
```

### Pagination
Several endpoints support `page` and `limit` query parameters:
```
GET /purchase?page=1&limit=20
GET /grn?page=2&limit=10
GET /stock-audit-logs?page=1&limit=10
```

### Date Filtering
Orders, expenses, and reports support date range filtering:
```
GET /order?startDate=2024-01-01&endDate=2024-12-31
GET /expense?startDate=2024-01-01&endDate=2024-12-31
```

### Error Handling
- All service functions throw on non-2xx responses
- 401 responses trigger automatic token removal and redirect to `/login`
- UI components should catch errors and display toast notifications via `sonner`
