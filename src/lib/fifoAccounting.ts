export interface FifoBatch {
  id: string;
  quantity: number;
  unit_cost: number;
  received_at: string;
}

export interface ItemBatches {
  [itemId: string]: FifoBatch[];
}

export const fifoAccounting = {
  // Retrieve all batches
  getBatches(): ItemBatches {
    try {
      const data = localStorage.getItem('logiflow_fifo_batches');
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error reading FIFO batches:', e);
      return {};
    }
  },

  // Save batches
  saveBatches(batches: ItemBatches) {
    try {
      localStorage.setItem('logiflow_fifo_batches', JSON.stringify(batches));
    } catch (e) {
      console.error('Error saving FIFO batches:', e);
    }
  },

  // Initialize batches for items list
  initialize(items: { id: string; quantity?: number; price: number; created_at?: string }[]) {
    const batches = this.getBatches();
    let modified = false;

    items.forEach((item) => {
      if (!batches[item.id]) {
        batches[item.id] = [
          {
            id: `batch-${item.id}-init`,
            quantity: item.quantity || 0,
            unit_cost: parseFloat((item.price * 0.6).toFixed(2)), // Default to 60% of retail price
            received_at: item.created_at || new Date().toISOString()
          }
        ];
        modified = true;
      }
    });

    if (modified) {
      this.saveBatches(batches);
    }
  },

  // Append new stock batch (from purchase order receive event)
  addBatch(itemId: string, quantity: number, unitCost: number) {
    const batches = this.getBatches();
    if (!batches[itemId]) {
      batches[itemId] = [];
    }

    batches[itemId].push({
      id: `batch-${itemId}-${Date.now()}`,
      quantity,
      unit_cost: unitCost,
      received_at: new Date().toISOString()
    });
    this.saveBatches(batches);
  },

  // Deduct stock using First-In-First-Out logic and return calculated exact cost of goods sold
  consumeStock(itemId: string, quantityToRemove: number): { exactCogs: number; consumedCount: number } {
    const batches = this.getBatches();
    if (!batches[itemId] || batches[itemId].length === 0) {
      // If no batch exist, fallback to average cost assumption
      return { exactCogs: 0, consumedCount: 0 };
    }

    let remainingToRemove = quantityToRemove;
    let totalCogs = 0;
    let consumedCount = 0;

    while (remainingToRemove > 0 && batches[itemId].length > 0) {
      const oldestBatch = batches[itemId][0];
      
      if (oldestBatch.quantity <= remainingToRemove) {
        // Consume entire batch
        totalCogs += oldestBatch.quantity * oldestBatch.unit_cost;
        remainingToRemove -= oldestBatch.quantity;
        consumedCount += oldestBatch.quantity;
        batches[itemId].shift(); // Remove the consumed batch
      } else {
        // Consume partial batch
        totalCogs += remainingToRemove * oldestBatch.unit_cost;
        oldestBatch.quantity -= remainingToRemove;
        consumedCount += remainingToRemove;
        remainingToRemove = 0;
      }
    }

    this.saveBatches(batches);
    
    // Dispatch a transaction event for accounting charts
    window.dispatchEvent(new CustomEvent('logiflow_fifo_transaction', {
      detail: { itemId, quantityRemoved: consumedCount, exactCogs: totalCogs }
    }));

    return { exactCogs: totalCogs, consumedCount };
  },

  // Calculate total compliant asset valuation based on current FIFO queue
  calculateValuation(itemId: string, defaultCost: number): number {
    const batches = this.getBatches();
    if (!batches[itemId] || batches[itemId].length === 0) {
      return 0;
    }
    return batches[itemId].reduce((sum, batch) => sum + (batch.quantity * batch.unit_cost), 0);
  }
};
