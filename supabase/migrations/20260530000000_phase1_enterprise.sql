-- Phase 1: Locations & Purchase Orders

-- 1. Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create item_stock_locations table for many-to-many items & locations
CREATE TABLE IF NOT EXISTS public.item_stock_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  shelf_location TEXT, -- e.g. "Aisle 4, Shelf B"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(item_id, location_id)
);

-- 3. Create purchase_orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create purchase_order_items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  cost_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can view locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can view stock locations" ON public.item_stock_locations;
DROP POLICY IF EXISTS "Admins and Staff can manage stock locations" ON public.item_stock_locations;
DROP POLICY IF EXISTS "Authenticated users can view purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Admins and Staff can manage purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can view purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Admins and Staff can manage purchase order items" ON public.purchase_order_items;

-- RLS Policies for locations
CREATE POLICY "Authenticated users can view locations" 
ON public.locations FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Admins can manage locations" 
ON public.locations FOR ALL 
TO authenticated USING (public.get_current_user_role() = 'admin') WITH CHECK (public.get_current_user_role() = 'admin');

-- RLS Policies for item_stock_locations
CREATE POLICY "Authenticated users can view stock locations" 
ON public.item_stock_locations FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Admins and Staff can manage stock locations" 
ON public.item_stock_locations FOR ALL 
TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

-- RLS Policies for purchase_orders
CREATE POLICY "Authenticated users can view purchase orders" 
ON public.purchase_orders FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Admins and Staff can manage purchase orders" 
ON public.purchase_orders FOR ALL 
TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

-- RLS Policies for purchase_order_items
CREATE POLICY "Authenticated users can view purchase order items" 
ON public.purchase_order_items FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Admins and Staff can manage purchase order items" 
ON public.purchase_order_items FOR ALL 
TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_item_stock_locations_updated_at
  BEFORE UPDATE ON public.item_stock_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial locations
INSERT INTO public.locations (name, description, address) VALUES
  ('Main Warehouse', 'Primary storage facility for bulk inventory', '123 Logistics Way, Sector 4'),
  ('Retail Showroom', 'Front showroom displays and immediate stock', '456 Market St, Plaza Level'),
  ('East Storage Yard', 'Secondary storage for outdoor and oversized equipment', '789 Industrial Blvd')
ON CONFLICT (name) DO NOTHING;

-- Seed some initial stock distributions if inventory exists
INSERT INTO public.item_stock_locations (item_id, location_id, quantity, shelf_location)
SELECT 
  i.id,
  (SELECT id FROM public.locations WHERE name = 'Main Warehouse'),
  i.quantity,
  'Aisle 1, Rack A'
FROM public.inventory_items i
ON CONFLICT (item_id, location_id) DO NOTHING;

-- Add realtime functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_stock_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_order_items;
