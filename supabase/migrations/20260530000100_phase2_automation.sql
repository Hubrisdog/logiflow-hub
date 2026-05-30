-- Extend profiles role validation to support supplier accounts
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'staff', 'supplier'));

-- Add supplier_id to profiles to link a user account to a specific supplier
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Add shipping and tracking details to purchase_orders
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
