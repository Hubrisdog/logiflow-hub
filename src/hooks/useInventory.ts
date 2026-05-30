import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { syncQueue } from '@/lib/syncQueue';
import { fifoAccounting } from '@/lib/fifoAccounting';
import type { InventoryItem, Category, Supplier } from '@/types/inventory';

// Demo data for when database is not accessible
const getDemoItems = (): InventoryItem[] => [
  {
    id: 'demo-1',
    name: 'MacBook Pro 14"',
    sku: 'APPLE-MBP14-001',
    category_id: 'demo-cat-1',
    supplier_id: 'demo-sup-1',
    quantity: 25,
    min_quantity: 5,
    price: 1999.99,
    description: 'Professional laptop for development and design work',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'demo-2',
    name: 'iPad Pro 11"',
    sku: 'APPLE-IPAD11-002',
    category_id: 'demo-cat-1',
    supplier_id: 'demo-sup-1',
    quantity: 40,
    min_quantity: 8,
    price: 799.99,
    description: 'M4 chip powerhouse tablet for sketch & mobility',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'demo-3',
    name: 'Ergonomic Desk Chair',
    sku: 'STEELCASE-CHAIR-003',
    category_id: 'demo-cat-2',
    supplier_id: 'demo-sup-2',
    quantity: 12,
    min_quantity: 3,
    price: 450.00,
    description: 'Fully adjustable task chair for lumbar support',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const getDemoCategories = (): Category[] => [
  { 
    id: 'demo-cat-1', 
    name: 'Electronics', 
    description: 'Electronic devices and components',
    created_at: new Date().toISOString()
  },
  { 
    id: 'demo-cat-2', 
    name: 'Office Supplies', 
    description: 'Office equipment and supplies',
    created_at: new Date().toISOString()
  },
  { 
    id: 'demo-cat-3', 
    name: 'Other', 
    description: 'Miscellaneous items that don\'t fit other categories',
    created_at: new Date().toISOString()
  }
];

const getDemoSuppliers = (): Supplier[] => [
  { 
    id: 'demo-sup-1', 
    name: 'Apple Inc.', 
    contact_email: 'business@apple.com', 
    contact_phone: '1-800-APL-CARE', 
    address: 'Cupertino, CA',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 'demo-sup-2', 
    name: 'Steelcase Corp', 
    contact_email: 'support@steelcase.com', 
    contact_phone: '1-888-STEELCASE', 
    address: 'Grand Rapids, MI',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async (orgId?: string) => {
    const activeOrgId = orgId || localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category:categories(name),
          supplier:suppliers(name)
        `)
        .eq('organization_id', activeOrgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Database fetch failed, using demo data:', error);
        const demoItems = getDemoItems().map(item => ({ ...item, organization_id: activeOrgId }));
        setItems(demoItems);
        fifoAccounting.initialize(demoItems);
        return;
      }
      const fetchedItems = (data as unknown as InventoryItem[]) || [];
      const itemsList = fetchedItems.length > 0 ? fetchedItems : getDemoItems().map(item => ({ ...item, organization_id: activeOrgId }));
      setItems(itemsList);
      fifoAccounting.initialize(itemsList);
    } catch (error: unknown) {
      console.warn('Database connection failed, using demo data:', error);
      const demoItems = getDemoItems().map(item => ({ ...item, organization_id: activeOrgId }));
      setItems(demoItems);
      fifoAccounting.initialize(demoItems);
    }
  };

  const fetchCategories = async (orgId?: string) => {
    const activeOrgId = orgId || localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('organization_id', activeOrgId)
        .order('name');

      if (error) {
        setCategories(getDemoCategories());
        return;
      }
      setCategories(data && data.length > 0 ? data : getDemoCategories());
    } catch (error: unknown) {
      setCategories(getDemoCategories());
    }
  };

  const fetchSuppliers = async (orgId?: string) => {
    const activeOrgId = orgId || localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('organization_id', activeOrgId)
        .order('name');

      if (error) {
        setSuppliers(getDemoSuppliers());
        return;
      }
      setSuppliers(data && data.length > 0 ? data : getDemoSuppliers());
    } catch (error: unknown) {
      setSuppliers(getDemoSuppliers());
    }
  };

  const addItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'category' | 'supplier'>) => {
    const activeOrgId = localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
    const payload = {
      name: item.name,
      sku: item.sku,
      category_id: item.category_id,
      supplier_id: item.supplier_id,
      quantity: item.quantity,
      min_quantity: item.min_quantity,
      price: item.price,
      description: item.description,
      organization_id: activeOrgId
    };

    if (!navigator.onLine) {
      const mockId = `item-mock-${Date.now()}`;
      syncQueue.enqueue('ADD_ITEM', { id: mockId, ...payload });

      const matchedCategory = categories.find(c => c.id === item.category_id);
      const matchedSupplier = suppliers.find(s => s.id === item.supplier_id);
      const mockItem: InventoryItem = {
        id: mockId,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: matchedCategory,
        supplier: matchedSupplier
      };
      setItems(prev => [mockItem, ...prev]);
      fifoAccounting.initialize([mockItem]);
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([payload])
        .select();

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          const mockId = `item-mock-${Date.now()}`;
          syncQueue.enqueue('ADD_ITEM', { id: mockId, ...payload });

          const matchedCategory = categories.find(c => c.id === item.category_id);
          const matchedSupplier = suppliers.find(s => s.id === item.supplier_id);
          const mockItem: InventoryItem = {
            id: mockId,
            ...payload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: matchedCategory,
            supplier: matchedSupplier
          };
          setItems(prev => [mockItem, ...prev]);
          fifoAccounting.initialize([mockItem]);
          return { success: true };
        }
        throw error;
      }

      // Create transaction record for new item
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data && data[0]) {
        await supabase.from('inventory_transactions').insert({
          item_id: data[0].id,
          user_id: user.id,
          transaction_type: 'create',
          quantity_change: 0,
          previous_quantity: 0,
          new_quantity: item.quantity,
          notes: `New item created with initial quantity of ${item.quantity}`,
          organization_id: activeOrgId
        });
      }

      await fetchItems();
      toast.success('Item added successfully!');
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to add item');
      return { success: false, error: err.message };
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const activeOrgId = localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
    const currentItem = items.find(item => item.id === id);
    if (!currentItem) throw new Error('Item not found');

    // Run FIFO batch updates if quantity changes
    if (updates.quantity !== undefined && updates.quantity !== currentItem.quantity) {
      if (updates.quantity < currentItem.quantity) {
        const qtyDeducted = currentItem.quantity - updates.quantity;
        const { exactCogs } = fifoAccounting.consumeStock(id, qtyDeducted);
        console.log(`FIFO consumed: ${qtyDeducted} units. Exact COGS calculated: $${exactCogs.toFixed(2)}`);
      } else {
        const qtyAdded = updates.quantity - currentItem.quantity;
        fifoAccounting.addBatch(id, qtyAdded, parseFloat((currentItem.price * 0.6).toFixed(2)));
        console.log(`FIFO added batch: ${qtyAdded} units.`);
      }
    }

    if (!navigator.onLine) {
      syncQueue.enqueue('UPDATE_ITEM', { id, ...updates });

      const matchedCategory = categories.find(c => c.id === (updates.category_id ?? currentItem.category_id));
      const matchedSupplier = suppliers.find(s => s.id === (updates.supplier_id ?? currentItem.supplier_id));
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            ...updates,
            category: matchedCategory || item.category,
            supplier: matchedSupplier || item.supplier,
            updated_at: new Date().toISOString()
          };
        }
        return item;
      }));
      toast.success('Item updated locally (Offline Mode)!');
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id);

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          syncQueue.enqueue('UPDATE_ITEM', { id, ...updates });

          const matchedCategory = categories.find(c => c.id === (updates.category_id ?? currentItem.category_id));
          const matchedSupplier = suppliers.find(s => s.id === (updates.supplier_id ?? currentItem.supplier_id));
          setItems(prev => prev.map(item => {
            if (item.id === id) {
              return {
                ...item,
                ...updates,
                category: matchedCategory || item.category,
                supplier: matchedSupplier || item.supplier,
                updated_at: new Date().toISOString()
              };
            }
            return item;
          }));
          toast.success('Item updated locally (Offline Sync Queued)!');
          return { success: true };
        }
        throw error;
      }

      // Create transaction record for quantity changes
      if (updates.quantity !== undefined && updates.quantity !== currentItem.quantity) {
        const quantityChange = updates.quantity - currentItem.quantity;
        const transactionType = quantityChange > 0 ? 'add' : 'remove';

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('inventory_transactions').insert({
            item_id: id,
            user_id: user.id,
            transaction_type: transactionType,
            quantity_change: Math.abs(quantityChange),
            previous_quantity: currentItem.quantity,
            new_quantity: updates.quantity,
            notes: `Quantity ${transactionType === 'add' ? 'increased' : 'decreased'} from ${currentItem.quantity} to ${updates.quantity}`,
            organization_id: activeOrgId
          });
        }
      }

      await fetchItems();
      toast.success('Item updated successfully!');
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to update item');
      return { success: false, error: err.message };
    }
  };

  const deleteItem = async (id: string) => {
    const activeOrgId = localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
    const currentItem = items.find(item => item.id === id);
    if (!currentItem) throw new Error('Item not found');

    if (!navigator.onLine) {
      syncQueue.enqueue('DELETE_ITEM', { id });
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item deleted locally (Offline)!');
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          syncQueue.enqueue('DELETE_ITEM', { id });
          setItems(prev => prev.filter(item => item.id !== id));
          toast.success('Item deleted locally (Offline Sync Queued)!');
          return { success: true };
        }
        throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('inventory_transactions').insert({
          item_id: id,
          user_id: user.id,
          transaction_type: 'delete',
          quantity_change: 0,
          previous_quantity: currentItem.quantity,
          new_quantity: 0,
          notes: `Item deleted from inventory`,
          organization_id: activeOrgId
        });
      }

      await fetchItems();
      toast.success('Item deleted successfully!');
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to delete item');
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const activeOrgId = localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
      
      const timeoutId = setTimeout(() => {
        console.warn('Database connection timeout, using demo data');
        const demoItems = getDemoItems().map(item => ({ ...item, organization_id: activeOrgId }));
        setItems(demoItems);
        setCategories(getDemoCategories());
        setSuppliers(getDemoSuppliers());
        fifoAccounting.initialize(demoItems);
        setLoading(false);
      }, 5000);

      try {
        await Promise.all([
          fetchItems(activeOrgId),
          fetchCategories(activeOrgId),
          fetchSuppliers(activeOrgId)
        ]);
        clearTimeout(timeoutId);
        setLoading(false);
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn('Data loading failed, using demo data:', error);
        const demoItems = getDemoItems().map(item => ({ ...item, organization_id: activeOrgId }));
        setItems(demoItems);
        setCategories(getDemoCategories());
        setSuppliers(getDemoSuppliers());
        fifoAccounting.initialize(demoItems);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Listen to organization selector transitions
  useEffect(() => {
    const handleOrgChange = (e: Event) => {
      setLoading(true);
      const newOrgId = (e as CustomEvent).detail;
      Promise.all([
        fetchItems(newOrgId),
        fetchCategories(newOrgId),
        fetchSuppliers(newOrgId)
      ]).then(() => setLoading(false));
    };

    window.addEventListener('logiflow_org_changed', handleOrgChange as EventListener);
    return () => window.removeEventListener('logiflow_org_changed', handleOrgChange as EventListener);
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const itemsSubscription = supabase
      .channel('inventory_items')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory_items' },
        () => {
          const activeOrgId = localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
          fetchItems(activeOrgId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(itemsSubscription);
    };
  }, []);

  const lowStockItems = items.filter(item => item.quantity <= item.min_quantity);
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  // Calculate precise FIFO compliant cost valuation (wholesale assets valuation)
  const fifoValue = items.reduce((sum, item) => sum + fifoAccounting.calculateValuation(item.id, item.price * 0.6), 0);

  return {
    items,
    categories,
    suppliers,
    loading,
    lowStockItems,
    totalValue,
    fifoValue,
    addItem,
    updateItem,
    deleteItem,
    refreshData: () => {
      const activeOrgId = localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
      fetchItems(activeOrgId);
      fetchCategories(activeOrgId);
      fetchSuppliers(activeOrgId);
    }
  };
};