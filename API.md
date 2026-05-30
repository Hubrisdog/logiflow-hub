# LogiFlow Hub REST API & Schema Documentation 🪐

This document describes the data entities, properties, and Supabase REST mappings utilized across the LogiFlow Hub inventory management platform.

---

## 🔐 Authentication
All database calls are secured using JSON Web Tokens (JWT) issued by **Supabase Auth**. Requests must include the authorization headers:
```
Authorization: Bearer <your_supabase_jwt_token>
```

---

## 📊 Database Entities Mappings

### 1. Profiles (`public.profiles`)
Tracks registered users and determines system permission access levels.
```typescript
interface Profile {
  id: string;               // UUID
  user_id: string;          // UUID (references auth.users)
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'supplier'; // Authorization roles
  supplier_id?: string;     // UUID (references suppliers - null for admin/staff)
  created_at: string;
  updated_at: string;
}
```

### 2. Locations (`public.locations`)
Represents warehouse spaces or physical stockrooms.
```typescript
interface Location {
  id: string;               // UUID
  name: string;             // e.g. "Main Warehouse"
  address?: string;
  description?: string;
  created_at: string;
}
```

### 3. Item Stock Locations (`public.item_stock_locations`)
A many-to-many lookup mapping inventory items to specific locations.
```typescript
interface ItemStockLocation {
  id: string;               // UUID
  item_id: string;          // UUID (references inventory_items)
  location_id: string;      // UUID (references locations)
  quantity: number;         // Stock level at this location
  shelf_location?: string;  // Aisle/bin coordinates (e.g., "Aisle 3, Shelf B")
  created_at: string;
  updated_at: string;
}
```

### 4. Purchase Orders (`public.purchase_orders`)
Inbound procurement shipments ordered from suppliers.
```typescript
interface PurchaseOrder {
  id: string;               // UUID
  order_number: string;     // Unique PO format (e.g. "PO-1004")
  supplier_id: string;      // UUID (references suppliers)
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  total_amount: number;     // Sum of all items in this PO
  carrier?: string;         // Shipping carrier (for suppliers)
  tracking_number?: string; // Shipping tracking ID
  shipped_at?: string;      // Shipped ISO timestamp
  received_at?: string;     // Received ISO timestamp
  created_at: string;
  updated_at: string;
}
```

### 5. Purchase Order Items (`public.purchase_order_items`)
Line items mapped inside a specific Purchase Order.
```typescript
interface PurchaseOrderItem {
  id: string;               // UUID
  purchase_order_id: string;// UUID (references purchase_orders)
  item_id: string;          // UUID (references inventory_items)
  quantity: number;         // Unit quantities to order
  unit_cost: number;        // Cost per unit (wholesale cost)
  created_at: string;
}
```

### 6. Inventory Items (`public.inventory_items`)
The main catalog entries containing safety limits.
```typescript
interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category_id?: string;
  supplier_id?: string;
  quantity: number;
  min_quantity: number;     // Low-stock safety threshold
  price: number;            // Standard retail price
  description?: string;
  created_at: string;
  updated_at: string;
}
```

### 7. Inventory Transactions (`public.inventory_transactions`)
Transactional audit trail records capturing stock changes.
```typescript
interface InventoryTransaction {
  id: string;
  item_id: string;
  user_id: string;
  transaction_type: 'add' | 'remove' | 'adjust' | 'create' | 'update' | 'delete';
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  notes?: string;
  created_at: string;
}
```

---

## 📈 REST Endpoint Mappings

All REST endpoints follow Supabase's auto-generated paths `/rest/v1/{table_name}`.

### Examples

#### 1. Increment Stock Level on Barcode Scan
`PATCH /rest/v1/inventory_items?id=eq.{item_id}`
```json
{
  "quantity": 101,
  "updated_at": "2026-05-31T02:00:00Z"
}
```

#### 2. Update Supplier Dispatch Information (Supplier Portal)
`PATCH /rest/v1/purchase_orders?id=eq.{po_id}`
```json
{
  "status": "sent",
  "carrier": "FedEx",
  "tracking_number": "123456789012",
  "shipped_at": "2026-05-31T02:00:00Z"
}
```

#### 3. Fetch forecasting low stock items
`GET /rest/v1/inventory_items?select=*&quantity=lte.min_quantity`

---

Built with 🪐 by Hubris
