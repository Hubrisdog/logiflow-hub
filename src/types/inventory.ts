import { Database } from "@/integrations/supabase/types";

// Database types from Supabase
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row'] & {
  category?: Database['public']['Tables']['categories']['Row'];
  supplier?: Database['public']['Tables']['suppliers']['Row'];
  stock_locations?: ItemStockLocation[];
};

export type Category = Database['public']['Tables']['categories']['Row'];
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type InventoryTransaction = Database['public']['Tables']['inventory_transactions']['Row'] & {
  item?: { name: string; sku: string };
  user?: { name: string; email: string };
};
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Insert types for creating new records
export type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
export type InventoryTransactionInsert = Database['public']['Tables']['inventory_transactions']['Insert'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

// Update types for updating records
export type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];
export type InventoryTransactionUpdate = Database['public']['Tables']['inventory_transactions']['Update'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Phase 1 Custom Types (Locations & Purchase Orders)
export interface Location {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemStockLocation {
  id: string;
  item_id: string;
  location_id: string;
  quantity: number;
  shelf_location: string | null;
  created_at: string;
  updated_at: string;
  location?: Location;
  item?: InventoryItem;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  total_amount: number;
  delivery_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  carrier?: string | null;
  tracking_number?: string | null;
  shipped_at?: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string;
  quantity: number;
  cost_price: number;
  total_price: number;
  created_at: string;
  inventory_item?: InventoryItem;
}