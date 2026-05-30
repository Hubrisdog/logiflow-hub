import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Location, ItemStockLocation } from '@/types/inventory';

const getDemoLocations = (): Location[] => [
  {
    id: 'loc-demo-1',
    name: 'Main Warehouse',
    address: '123 Logistics Way, Sector 4',
    description: 'Primary storage facility for bulk inventory',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'loc-demo-2',
    name: 'Retail Showroom',
    address: '456 Market St, Plaza Level',
    description: 'Front showroom displays and immediate stock',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const getDemoStockLocations = (): ItemStockLocation[] => [
  {
    id: 'stock-demo-1',
    item_id: 'demo-1',
    location_id: 'loc-demo-1',
    quantity: 20,
    shelf_location: 'Aisle 1, Rack A',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'stock-demo-2',
    item_id: 'demo-1',
    location_id: 'loc-demo-2',
    quantity: 5,
    shelf_location: 'Front Display',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [stockLocations, setStockLocations] = useState<ItemStockLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) {
        console.warn('Locations fetch failed, using demo data:', error);
        setLocations(getDemoLocations());
        return;
      }
      setLocations(data || getDemoLocations());
    } catch (error: unknown) {
      console.warn('Locations connection failed, using demo data:', error);
      setLocations(getDemoLocations());
    }
  };

  const fetchStockLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('item_stock_locations')
        .select(`
          *,
          location:locations(*)
        `);

      if (error) {
        console.warn('Stock locations fetch failed, using demo data:', error);
        setStockLocations(getDemoStockLocations());
        return;
      }
      setStockLocations(data || getDemoStockLocations());
    } catch (error: unknown) {
      console.warn('Stock locations connection failed, using demo data:', error);
      setStockLocations(getDemoStockLocations());
    }
  };

  const addLocation = async (location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert([location])
        .select();

      if (error) throw error;
      toast.success('Location created successfully!');
      await fetchLocations();
      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add location';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateLocation = async (id: string, updates: Partial<Location>) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Location updated successfully!');
      await fetchLocations();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update location';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Location deleted successfully!');
      await fetchLocations();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete location';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateItemStockAtLocation = async (itemId: string, locationId: string, quantity: number, shelfLocation: string | null) => {
    try {
      const { data: existing } = await supabase
        .from('item_stock_locations')
        .select('*')
        .eq('item_id', itemId)
        .eq('location_id', locationId)
        .maybeSingle();

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('item_stock_locations')
          .update({ quantity, shelf_location: shelfLocation })
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('item_stock_locations')
          .insert([{ item_id: itemId, location_id: locationId, quantity, shelf_location: shelfLocation }]);
        error = insertError;
      }

      if (error) throw error;
      
      // Update overall item quantity
      const { data: stockItems } = await supabase
        .from('item_stock_locations')
        .select('quantity')
        .eq('item_id', itemId);
      
      if (stockItems) {
        const newTotal = stockItems.reduce((sum, current) => sum + current.quantity, 0);
        await supabase
          .from('inventory_items')
          .update({ quantity: newTotal })
          .eq('id', itemId);
      }

      toast.success('Stock allocated successfully!');
      await fetchStockLocations();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to allocate stock';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([fetchLocations(), fetchStockLocations()]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  return {
    locations,
    stockLocations,
    loading,
    addLocation,
    updateLocation,
    deleteLocation,
    updateItemStockAtLocation,
    refreshLocations: () => Promise.all([fetchLocations(), fetchStockLocations()])
  };
};
