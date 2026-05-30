import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Settings2, 
  Sparkles, 
  ShoppingCart, 
  AlertTriangle, 
  HelpCircle,
  Building,
  RefreshCw,
  Plus
} from "lucide-react";
import { useInventory } from '@/hooks/useInventory';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { toast } from 'sonner';

export const AutomationHub = () => {
  const { items, suppliers, refreshData } = useInventory();
  const { createPurchaseOrder } = usePurchaseOrders();
  
  const [safetyMultiplier, setSafetyMultiplier] = useState(1.5);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});
  const [selectedSuppliers, setSelectedSuppliers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Determine which items are low stock (using safety stock multiplier)
  const recommendations = items.map(item => {
    const threshold = Math.round(item.min_quantity * safetyMultiplier);
    const isBelowThreshold = item.quantity < threshold;
    const recommendedQty = isBelowThreshold 
      ? Math.max(10, Math.ceil((item.min_quantity * safetyMultiplier * 2) - item.quantity))
      : 0;

    return {
      item,
      threshold,
      isBelowThreshold,
      recommendedQty,
      defaultSupplierId: item.supplier_id || suppliers[0]?.id || ''
    };
  }).filter(rec => rec.isBelowThreshold);

  // Handle select all
  const isAllSelected = recommendations.length > 0 && recommendations.every(rec => selectedItems[rec.item.id]);
  const handleToggleSelectAll = (checked: boolean) => {
    const updated: Record<string, boolean> = {};
    if (checked) {
      recommendations.forEach(rec => {
        updated[rec.item.id] = true;
      });
    }
    setSelectedItems(updated);
  };

  const handleToggleSelectRow = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const handleQuantityChange = (itemId: string, val: number) => {
    if (val < 1) return;
    setCustomQuantities(prev => ({
      ...prev,
      [itemId]: val
    }));
  };

  const handleSupplierChange = (itemId: string, supplierId: string) => {
    setSelectedSuppliers(prev => ({
      ...prev,
      [itemId]: supplierId
    }));
  };

  const handleGenerateBulkOrders = async () => {
    const selectedRecs = recommendations.filter(rec => selectedItems[rec.item.id]);
    
    if (selectedRecs.length === 0) {
      toast.error("Please select at least one item to reorder");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Group items by their chosen supplier
      const supplierGroups: Record<string, Array<{ inventory_item_id: string; quantity: number; cost_price: number }>> = {};
      
      selectedRecs.forEach(rec => {
        const chosenSupplierId = selectedSuppliers[rec.item.id] || rec.defaultSupplierId;
        if (!chosenSupplierId) return;

        const qty = customQuantities[rec.item.id] || rec.recommendedQty;
        // Estimate wholesale cost as 60% of retail price
        const costPrice = Number((rec.item.price * 0.6).toFixed(2));

        if (!supplierGroups[chosenSupplierId]) {
          supplierGroups[chosenSupplierId] = [];
        }

        supplierGroups[chosenSupplierId].push({
          inventory_item_id: rec.item.id,
          quantity: qty,
          cost_price: costPrice
        });
      });

      let orderCount = 0;
      
      // Call createPurchaseOrder for each supplier group
      for (const [supplierId, groupItems] of Object.entries(supplierGroups)) {
        if (groupItems.length === 0) continue;
        
        const res = await createPurchaseOrder({
          supplier_id: supplierId,
          notes: `Auto-generated draft via Smart Restock Hub (Multiplier: ${safetyMultiplier}x)`,
          delivery_date: new Date(Date.now() + 86400000 * 7).toISOString() // 1 week delivery estimate
        }, groupItems);

        if (res.success) {
          orderCount++;
        }
      }

      if (orderCount > 0) {
        toast.success(`Successfully drafted ${orderCount} Purchase Orders by Supplier! Check the Orders page.`);
        // Reset selections
        setSelectedItems({});
        setCustomQuantities({});
        setSelectedSuppliers({});
      } else {
        toast.error("Failed to generate Purchase Orders");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during order generation");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Control Header Card */}
      <Card className="card-enhanced shadow-md border border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <span>Restock Threshold Settings</span>
            </CardTitle>
            <CardDescription>
              Scale the safety stock threshold multiplier to automatically identify inventory levels requiring replenishment.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold flex items-center">
                <Sparkles className="h-4 w-4 text-primary mr-1" />
                Safety Multiplier: <span className="text-primary font-bold ml-1.5">{safetyMultiplier.toFixed(1)}x</span>
              </Label>
              <Badge variant="secondary">
                {safetyMultiplier <= 1.2 ? 'Lean Stocking' : safetyMultiplier <= 1.8 ? 'Balanced Buffer' : 'Aggressive Safety Buffer'}
              </Badge>
            </div>
            <Slider
              min={1.0}
              max={2.5}
              step={0.1}
              value={[safetyMultiplier]}
              onValueChange={(val) => setSafetyMultiplier(val[0])}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              A safety multiplier adjusts the baseline safety levels. A higher value flags item shortages early (e.g. for seasonal demands).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Table Card */}
      <Card className="card-enhanced shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Smart Reorder Recommendations</span>
            </CardTitle>
            <CardDescription>
              {recommendations.length === 0 
                ? "All products are safely stocked at this multiplier level." 
                : `${recommendations.length} items have fallen below safety thresholds and require restocking.`}
            </CardDescription>
          </div>
          {recommendations.length > 0 && (
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={handleGenerateBulkOrders}
              disabled={isGenerating}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isGenerating ? "Drafting..." : "Draft Selected POs"}
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircleComponent />
              <p className="font-semibold text-lg text-success mt-4">Inventory Safely Stocked</p>
              <p className="text-sm mt-1">Adjust safety multiplier if you wish to define larger safety buffers.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={isAllSelected}
                        onCheckedChange={handleToggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Qty on Hand</TableHead>
                    <TableHead>Safety Limit</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="w-32">Reorder Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map((rec) => {
                    const itemId = rec.item.id;
                    const isSelected = !!selectedItems[itemId];
                    const qty = customQuantities[itemId] || rec.recommendedQty;
                    const chosenSupplierId = selectedSuppliers[itemId] || rec.defaultSupplierId;

                    return (
                      <TableRow key={itemId} className={isSelected ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={(checked) => handleToggleSelectRow(itemId, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{rec.item.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{rec.item.category?.name}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{rec.item.sku}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="font-semibold">
                            {rec.item.quantity} units
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-muted-foreground">
                          {rec.threshold} units
                        </TableCell>
                        <TableCell>
                          <select
                            value={chosenSupplierId}
                            onChange={(e) => handleSupplierChange(itemId, e.target.value)}
                            className="bg-background border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-40"
                          >
                            {suppliers.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={qty}
                            onChange={(e) => handleQuantityChange(itemId, parseInt(e.target.value) || 1)}
                            className="h-8 w-24 font-semibold text-center"
                            min={1}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CheckCircleComponent = () => (
  <div className="mx-auto w-12 h-12 rounded-full bg-success/15 flex items-center justify-center">
    <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  </div>
);
