import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SyncOperation {
  id: string;
  type: 'ADD_ITEM' | 'UPDATE_ITEM' | 'DELETE_ITEM' | 'CREATE_PO' | 'RECEIVE_PO' | 'UPDATE_STOCK' | 'ADD_LOCATION' | 'ALLOCATE_LOCATION_STOCK';
  payload: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  timestamp: string;
}

const STORAGE_KEY = 'logiflow_sync_queue';

export const syncQueue = {
  // Get all queued operations
  getQueue(): SyncOperation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading sync queue from localStorage:', e);
      return [];
    }
  },

  // Save the operations queue
  saveQueue(queue: SyncOperation[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Error saving sync queue to localStorage:', e);
    }
  },

  // Add an operation to the queue
  enqueue(type: SyncOperation['type'], payload: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const queue = this.getQueue();
    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    queue.push(operation);
    this.saveQueue(queue);
    
    // Dispatch a custom event to notify components about the queue size changes
    window.dispatchEvent(new CustomEvent('logiflow_sync_queue_changed', { detail: queue.length }));
    
    toast.warning(`Offline: Action "${type}" queued for synchronization.`);
  },

  // Clear all operations
  clear() {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('logiflow_sync_queue_changed', { detail: 0 }));
  },

  // Process all queued items sequentially in order of timestamp
  async processQueue(): Promise<boolean> {
    const queue = this.getQueue();
    if (queue.length === 0) return true;

    console.log(`Processing sync queue with ${queue.length} items...`);
    window.dispatchEvent(new CustomEvent('logiflow_sync_status', { detail: 'syncing' }));
    
    let processedCount = 0;
    const remainingQueue: SyncOperation[] = [];

    for (const op of queue) {
      try {
        let success = false;
        
        switch (op.type) {
          case 'ADD_ITEM': {
            const { error } = await supabase.from('inventory_items').insert([op.payload]);
            if (!error) success = true;
            break;
          }
          case 'UPDATE_ITEM': {
            const { id, ...updates } = op.payload;
            const { error } = await supabase.from('inventory_items').update(updates).eq('id', id);
            if (!error) success = true;
            break;
          }
          case 'DELETE_ITEM': {
            const { error } = await supabase.from('inventory_items').delete().eq('id', op.payload.id);
            if (!error) success = true;
            break;
          }
          case 'CREATE_PO': {
            const { po, items } = op.payload;
            const { data: newPo, error: poError } = await supabase.from('purchase_orders').insert([po]).select();
            if (!poError && newPo && newPo[0]) {
              const poId = newPo[0].id;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const poItems = items.map((item: any) => ({ ...item, purchase_order_id: poId }));
              const { error: itemsError } = await supabase.from('purchase_order_items').insert(poItems);
              if (!itemsError) success = true;
            }
            break;
          }
          case 'RECEIVE_PO': {
            const { id, received_at } = op.payload;
            const { error } = await supabase.from('purchase_orders').update({
              status: 'received',
              received_at
            }).eq('id', id);
            if (!error) success = true;
            break;
          }
          case 'UPDATE_STOCK': {
            const { id, quantity, updated_at } = op.payload;
            const { error } = await supabase.from('inventory_items').update({ quantity, updated_at }).eq('id', id);
            if (!error) success = true;
            break;
          }
          case 'ADD_LOCATION': {
            const { error } = await supabase.from('locations').insert([op.payload]);
            if (!error) success = true;
            break;
          }
          case 'ALLOCATE_LOCATION_STOCK': {
            const { error } = await supabase.from('item_stock_locations').insert([op.payload]).select();
            if (!error) success = true;
            break;
          }
        }

        if (success) {
          processedCount++;
        } else {
          // If a call fails, we keep it in the queue to retry later
          remainingQueue.push(op);
        }
      } catch (err) {
        console.error(`Failed to process queued operation ${op.id} (${op.type}):`, err);
        remainingQueue.push(op);
      }
    }

    this.saveQueue(remainingQueue);
    window.dispatchEvent(new CustomEvent('logiflow_sync_queue_changed', { detail: remainingQueue.length }));
    
    if (processedCount > 0) {
      toast.success(`Synchronized ${processedCount} offline actions successfully!`);
    }

    if (remainingQueue.length === 0) {
      window.dispatchEvent(new CustomEvent('logiflow_sync_status', { detail: 'online' }));
      return true;
    } else {
      window.dispatchEvent(new CustomEvent('logiflow_sync_status', { detail: 'pending_sync' }));
      return false;
    }
  }
};

// Initialize listeners for connection transitions
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    toast.success('Connection restored. Initiating sync queue reconciliation...');
    syncQueue.processQueue();
  });

  window.addEventListener('offline', () => {
    toast.error('Network connection lost. Running in offline fallback mode.');
    window.dispatchEvent(new CustomEvent('logiflow_sync_status', { detail: 'offline' }));
  });
}
