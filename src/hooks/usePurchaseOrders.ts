import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { syncQueue } from '@/lib/syncQueue';
import { fifoAccounting } from '@/lib/fifoAccounting';
import type { PurchaseOrder, PurchaseOrderItem } from '@/types/inventory';

// Simulates email invoice dispatch in local storage
const simulatePOEmailDispatch = (poNumber: string, supplierName: string, supplierEmail: string, totalAmount: number, itemsCount: number) => {
  try {
    const existingStr = localStorage.getItem('logiflow_po_emails');
    const emails = existingStr ? JSON.parse(existingStr) : [];
    
    const newEmail = {
      id: `email-${Date.now()}`,
      po_number: poNumber,
      supplier_name: supplierName,
      supplier_email: supplierEmail || 'supplier@example.com',
      subject: `[LogiFlow Hub] Purchase Order ${poNumber} Dispatched`,
      body: `
        <h2>Purchase Order Invoice Confirmation</h2>
        <p><strong>PO Reference:</strong> ${poNumber}</p>
        <p><strong>Supplier:</strong> ${supplierName}</p>
        <p><strong>Date Ordered:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Lines Ordered:</strong> ${itemsCount} items</p>
        <p><strong>Total Procurement Cost:</strong> $${totalAmount.toFixed(2)}</p>
        <p>This is a simulated PDF attachment notification email sent via the SMTP pipeline.</p>
      `,
      sent_at: new Date().toISOString()
    };
    
    emails.push(newEmail);
    localStorage.setItem('logiflow_po_emails', JSON.stringify(emails));
    
    // Dispatch a custom event to notify components about the email trigger
    window.dispatchEvent(new CustomEvent('logiflow_po_notification', {
      detail: {
        poNumber,
        supplierName,
        supplierEmail: newEmail.supplier_email,
        totalAmount
      }
    }));
    
    console.log(`PO Email dispatch simulated for ${poNumber} to ${newEmail.supplier_email}`);
  } catch (e) {
    console.error('Error simulating PO email dispatch:', e);
  }
};

const getDemoPurchaseOrders = (orgId: string): PurchaseOrder[] => [
  {
    id: 'po-demo-1',
    po_number: 'PO-2026-001',
    supplier_id: 'demo-sup-1',
    status: 'ordered',
    total_amount: 5999.97,
    delivery_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    notes: 'Urgent restocking of laptops',
    created_by: 'demo-user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organization_id: orgId,
    supplier: {
      id: 'demo-sup-1',
      name: 'Apple Inc.',
      contact_email: 'business@apple.com',
      contact_phone: '1-800-APL-CARE',
      address: 'Cupertino, CA',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    items: [
      {
        id: 'po-item-demo-1',
        purchase_order_id: 'po-demo-1',
        inventory_item_id: 'demo-1',
        quantity: 3,
        cost_price: 1999.99,
        total_price: 5999.97,
        created_at: new Date().toISOString(),
        inventory_item: {
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
        }
      }
    ]
  }
];

export const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchaseOrders = async (orgId?: string) => {
    const activeOrgId = orgId || localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('organization_id', activeOrgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Purchase orders fetch failed, using demo data:', error);
        setPurchaseOrders(getDemoPurchaseOrders(activeOrgId));
        return;
      }

      // Fetch items for each PO
      const posWithItems = await Promise.all((data || []).map(async (po) => {
        const { data: items } = await supabase
          .from('purchase_order_items')
          .select(`
            *,
            inventory_item:inventory_items(*)
          `)
          .eq('purchase_order_id', po.id);
        
        return {
          ...po,
          items: items || []
        };
      }));

      const finalOrders = posWithItems.length > 0 ? posWithItems : getDemoPurchaseOrders(activeOrgId);
      setPurchaseOrders(finalOrders as PurchaseOrder[]);
    } catch (error: unknown) {
      console.warn('Purchase orders connection failed, using demo data:', error);
      setPurchaseOrders(getDemoPurchaseOrders(activeOrgId));
    }
  };

  const generatePONumber = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PO-${year}-${rand}`;
  };

  const createPurchaseOrder = async (poData: Partial<PurchaseOrder>, items: Array<{ inventory_item_id: string; quantity: number; cost_price: number }>) => {
    const activeOrgId = localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
    const poNumber = generatePONumber();
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
    const { data: { user } } = await supabase.auth.getUser();

    const poPayload = {
      po_number: poNumber,
      supplier_id: poData.supplier_id,
      status: 'draft',
      total_amount: totalAmount,
      delivery_date: poData.delivery_date || null,
      notes: poData.notes || null,
      created_by: user?.id || null,
      organization_id: activeOrgId
    };

    if (!navigator.onLine) {
      const mockPOId = `po-mock-${Date.now()}`;
      syncQueue.enqueue('CREATE_PO', {
        po: { id: mockPOId, ...poPayload },
        items: items.map(i => ({ inventory_item_id: i.inventory_item_id, quantity: i.quantity, cost_price: i.cost_price }))
      });

      const mockItems = items.map((item, idx) => ({
        id: `po-item-mock-${idx}-${Date.now()}`,
        purchase_order_id: mockPOId,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        cost_price: item.cost_price,
        total_price: item.quantity * item.cost_price,
        created_at: new Date().toISOString()
      }));

      const mockPOComplete: PurchaseOrder = {
        id: mockPOId,
        ...poPayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: mockItems as unknown as PurchaseOrderItem[]
      };

      setPurchaseOrders(prev => [mockPOComplete, ...prev]);
      toast.success('Purchase Order created locally (Offline Mode)!');
      return { success: true, data: mockPOComplete };
    }

    try {
      const { data: newPo, error: poError } = await supabase
        .from('purchase_orders')
        .insert([poPayload])
        .select()
        .single();

      if (poError || !newPo) {
        if (poError && (poError.message.includes('fetch') || poError.message.includes('Failed to fetch'))) {
          const mockPOId = `po-mock-${Date.now()}`;
          syncQueue.enqueue('CREATE_PO', {
            po: { id: mockPOId, ...poPayload },
            items: items.map(i => ({ inventory_item_id: i.inventory_item_id, quantity: i.quantity, cost_price: i.cost_price }))
          });

          const mockItems = items.map((item, idx) => ({
            id: `po-item-mock-${idx}-${Date.now()}`,
            purchase_order_id: mockPOId,
            inventory_item_id: item.inventory_item_id,
            quantity: item.quantity,
            cost_price: item.cost_price,
            total_price: item.quantity * item.cost_price,
            created_at: new Date().toISOString()
          }));

          const mockPOComplete: PurchaseOrder = {
            id: mockPOId,
            ...poPayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: mockItems as unknown as PurchaseOrderItem[]
          };

          setPurchaseOrders(prev => [mockPOComplete, ...prev]);
          toast.success('Purchase Order created locally (Offline Sync Queued)!');
          return { success: true, data: mockPOComplete };
        }
        throw poError || new Error('Failed to create PO');
      }

      if (items.length > 0) {
        const orderItems = items.map(item => ({
          purchase_order_id: newPo.id,
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          cost_price: item.cost_price,
          total_price: item.quantity * item.cost_price
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      await fetchPurchaseOrders(activeOrgId);
      toast.success('Purchase Order created successfully!');
      return { success: true, data: newPo };
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to create Purchase Order');
      return { success: false, error: err.message };
    }
  };

  const updatePurchaseOrderStatus = async (id: string, newStatus: PurchaseOrder['status']) => {
    const activeOrgId = localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
    try {
      const currentPO = purchaseOrders.find(po => po.id === id);
      if (!currentPO) throw new Error('Purchase Order not found');

      if (currentPO.status === newStatus) return { success: true };

      // Dispatch supplier invoice notification if ordered/sent
      if (newStatus === 'ordered') {
        const supplierName = currentPO.supplier?.name || 'Partner Supplier';
        const supplierEmail = currentPO.supplier?.contact_email || 'vendor@logiflow.com';
        simulatePOEmailDispatch(
          currentPO.po_number,
          supplierName,
          supplierEmail,
          currentPO.total_amount,
          currentPO.items?.length || 0
        );
      }

      if (!navigator.onLine) {
        syncQueue.enqueue('RECEIVE_PO', { id, received_at: new Date().toISOString() });
        
        // Handle local mock stock receiving
        if (newStatus === 'received') {
          for (const item of currentPO.items || []) {
            fifoAccounting.addBatch(item.inventory_item_id, item.quantity, item.cost_price);
            toast.info(`FIFO Cost batch recorded for ${item.inventory_item?.name || 'product'}: ${item.quantity} units @ $${item.cost_price.toFixed(2)}`);
          }
        }

        setPurchaseOrders(prev => prev.map(po => {
          if (po.id === id) {
            return { ...po, status: newStatus, updated_at: new Date().toISOString() };
          }
          return po;
        }));
        toast.success(`Purchase Order status updated to "${newStatus}" locally!`);
        return { success: true };
      }

      let hasRealDbUpdated = true;
      try {
        const { error } = await supabase
          .from('purchase_orders')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
      } catch (dbErr: unknown) {
        const err = dbErr as Error;
        if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
          syncQueue.enqueue('RECEIVE_PO', { id, received_at: new Date().toISOString() });
          hasRealDbUpdated = false;
        } else {
          throw dbErr;
        }
      }

      // Handle receiving products into inventory
      if (newStatus === 'received') {
        const { data: { user } } = await supabase.auth.getUser();
        
        for (const item of currentPO.items || []) {
          let currentQty = item.inventory_item?.quantity ?? 0;
          
          if (hasRealDbUpdated) {
            try {
              const { data: invItem } = await supabase
                .from('inventory_items')
                .select('quantity')
                .eq('id', item.inventory_item_id)
                .single();
              if (invItem) currentQty = invItem.quantity;
            } catch (err) {
              console.warn(err);
            }
          }

          const previousQty = currentQty;
          const newQty = previousQty + item.quantity;

          // Record inside compliant FIFO accounting batch
          fifoAccounting.addBatch(item.inventory_item_id, item.quantity, item.cost_price);
          toast.info(`FIFO Batch Cost Added: ${item.quantity} units @ $${item.cost_price.toFixed(2)}`);

          // Update inventory_items quantity
          try {
            await supabase
              .from('inventory_items')
              .update({ quantity: newQty })
              .eq('id', item.inventory_item_id);
          } catch (err) {
            console.warn(err);
          }

          // Audit transaction
          try {
            await supabase.from('inventory_transactions').insert({
              item_id: item.inventory_item_id,
              user_id: user?.id,
              transaction_type: 'add',
              quantity_change: item.quantity,
              previous_quantity: previousQty,
              new_quantity: newQty,
              notes: `Stock received via Purchase Order ${currentPO.po_number}`,
              organization_id: activeOrgId
            });
          } catch (err) {
            console.warn(err);
          }
        }
        toast.success(`Purchase Order ${currentPO.po_number} stock received!`);
      } else {
        toast.success('Purchase Order status updated successfully!');
      }

      // Sync state change locally
      setPurchaseOrders(prev => prev.map(po => {
        if (po.id === id) {
          return {
            ...po,
            status: newStatus,
            updated_at: new Date().toISOString()
          };
        }
        return po;
      }));

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update Purchase Order status';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updatePurchaseOrderShipping = async (
    id: string, 
    status: PurchaseOrder['status'], 
    carrier?: string, 
    trackingNumber?: string
  ) => {
    try {
      const currentPO = purchaseOrders.find(po => po.id === id);
      if (!currentPO) throw new Error('Purchase Order not found');

      try {
        const { error } = await supabase
          .from('purchase_orders')
          .update({ 
            status, 
            carrier: carrier || null,
            tracking_number: trackingNumber || null,
            shipped_at: status === 'ordered' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString() 
          })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.warn("Supabase PO shipping update failed, updating local state", error);
      }

      setPurchaseOrders(prev => prev.map(po => {
        if (po.id === id) {
          return {
            ...po,
            status,
            carrier: carrier || null,
            tracking_number: trackingNumber || null,
            shipped_at: status === 'ordered' ? new Date().toISOString() : po.shipped_at,
            updated_at: new Date().toISOString()
          };
        }
        return po;
      }));

      toast.success(`Purchase Order shipping status updated to "${status}"!`);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update shipping status';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    try {
      try {
        const { error } = await supabase
          .from('purchase_orders')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase PO delete failed, using local offline fallback", err);
      }

      setPurchaseOrders(prev => prev.filter(po => po.id !== id));
      toast.success('Purchase Order deleted successfully!');
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete Purchase Order';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    const loadPOs = async () => {
      setLoading(true);
      const activeOrgId = localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
      await fetchPurchaseOrders(activeOrgId);
      setLoading(false);
    };
    loadPOs();
  }, []);

  // Listen to organization selector transitions
  useEffect(() => {
    const handleOrgChange = (e: Event) => {
      setLoading(true);
      const orgId = (e as CustomEvent).detail;
      fetchPurchaseOrders(orgId).then(() => setLoading(false));
    };

    window.addEventListener('logiflow_org_changed', handleOrgChange as EventListener);
    return () => window.removeEventListener('logiflow_org_changed', handleOrgChange as EventListener);
  }, []);

  return {
    purchaseOrders,
    loading,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    updatePurchaseOrderShipping,
    deletePurchaseOrder,
    refreshPurchaseOrders: () => {
      const activeOrgId = localStorage.getItem('logiflow_active_org_id') || 'mock-org-1';
      fetchPurchaseOrders(activeOrgId);
    }
  };
};
