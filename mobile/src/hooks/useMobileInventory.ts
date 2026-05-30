import { useState, useEffect } from 'react';

export interface MobileInventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  min_quantity: number;
  price: number;
  categoryName: string;
  supplierName: string;
  description: string;
  updated_at: string;
}

const DEMO_ITEMS: MobileInventoryItem[] = [
  {
    id: '1',
    name: 'MacBook Pro 14"',
    sku: 'APPLE-MBP14-001',
    quantity: 25,
    min_quantity: 5,
    price: 1999.99,
    categoryName: 'Electronics',
    supplierName: 'Apple Inc.',
    description: 'Professional laptop for development and design work',
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'iPhone 15 Pro',
    sku: 'APPLE-IPH15-002',
    quantity: 4, // Low stock to test alerts
    min_quantity: 10,
    price: 1099.00,
    categoryName: 'Electronics',
    supplierName: 'Apple Inc.',
    description: 'Latest model with titanium casing and triple camera system',
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Office Ergonomic Chair',
    sku: 'FURN-OFFCH-043',
    quantity: 18,
    min_quantity: 8,
    price: 349.99,
    categoryName: 'Furniture',
    supplierName: 'Herman Miller',
    description: 'High-back ergonomic office chair with mesh support',
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Wireless Magic Keyboard',
    sku: 'APPLE-MKYBD-098',
    quantity: 45,
    min_quantity: 12,
    price: 99.00,
    categoryName: 'Electronics',
    supplierName: 'Apple Inc.',
    description: 'Bluetooth rechargeable keyboard',
    updated_at: new Date().toISOString()
  }
];

export const useMobileInventory = () => {
  const [items, setItems] = useState<MobileInventoryItem[]>(DEMO_ITEMS);
  const [loading, setLoading] = useState(false);

  // Stats calculation
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = items.filter(item => item.quantity < item.min_quantity);

  const incrementStock = async (sku: string): Promise<{ success: boolean; itemName?: string }> => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let matchedName: string | undefined;
    let found = false;

    setItems(prev => prev.map(item => {
      if (item.sku === sku) {
        found = true;
        matchedName = item.name;
        return {
          ...item,
          quantity: item.quantity + 1,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    }));

    setLoading(false);
    return { success: found, itemName: matchedName };
  };

  const updateItemQty = async (id: string, qty: number): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: qty,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    }));
    
    setLoading(false);
    return true;
  };

  const refreshData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  };

  return {
    items,
    loading,
    totalValue,
    totalItemsCount,
    lowStockItems,
    incrementStock,
    updateItemQty,
    refreshData
  };
};
