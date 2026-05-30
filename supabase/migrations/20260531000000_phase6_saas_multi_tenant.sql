-- Phase 6: Multi-Tenant SaaS Workspace Partitioning

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Add organization_id column to core tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 3. Insert default demo organization and map existing records
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Insert default org if none exists
  INSERT INTO public.organizations (name)
  VALUES ('LogiFlow Hub Demo Org')
  ON CONFLICT DO NOTHING;

  -- Get the default organization ID
  SELECT id INTO default_org_id FROM public.organizations WHERE name = 'LogiFlow Hub Demo Org' LIMIT 1;

  -- Map existing tables
  UPDATE public.profiles SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE public.inventory_items SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE public.locations SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE public.purchase_orders SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE public.inventory_transactions SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE public.suppliers SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE public.categories SET organization_id = default_org_id WHERE organization_id IS NULL;
END $$;

-- 4. Create security definer function to get current user organization
CREATE OR REPLACE FUNCTION public.get_current_user_org()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 5. Re-configure Row Level Security Policies for Multi-Tenancy
-- We drop existing selector policies and replace them with policies scoped by organization_id.

-- Organizations policies
DROP POLICY IF EXISTS "Users can view their active organization" ON public.organizations;
CREATE POLICY "Users can view their active organization"
ON public.organizations FOR SELECT
TO authenticated USING (id = public.get_current_user_org());

-- Profiles policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
TO authenticated USING (organization_id = public.get_current_user_org());

-- Suppliers policies
DROP POLICY IF EXISTS "Users can view suppliers in their organization" ON public.suppliers;
CREATE POLICY "Users can view suppliers in their organization"
ON public.suppliers FOR SELECT
TO authenticated USING (organization_id = public.get_current_user_org());

-- Categories policies
DROP POLICY IF EXISTS "Users can view categories in their organization" ON public.categories;
CREATE POLICY "Users can view categories in their organization"
ON public.categories FOR SELECT
TO authenticated USING (organization_id = public.get_current_user_org());

-- Inventory Items policies
DROP POLICY IF EXISTS "Users can view items in their organization" ON public.inventory_items;
CREATE POLICY "Users can view items in their organization"
ON public.inventory_items FOR SELECT
TO authenticated USING (organization_id = public.get_current_user_org());

-- Locations policies
DROP POLICY IF EXISTS "Users can view locations in their organization" ON public.locations;
CREATE POLICY "Users can view locations in their organization"
ON public.locations FOR SELECT
TO authenticated USING (organization_id = public.get_current_user_org());

-- Purchase Orders policies
DROP POLICY IF EXISTS "Users can view purchase orders in their organization" ON public.purchase_orders;
CREATE POLICY "Users can view purchase orders in their organization"
ON public.purchase_orders FOR SELECT
TO authenticated USING (organization_id = public.get_current_user_org());

-- Add to supabase realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
