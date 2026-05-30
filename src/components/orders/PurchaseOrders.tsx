import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInventory } from "@/hooks/useInventory";
import type { PurchaseOrder, PurchaseOrderItem } from "@/types/inventory";
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  ShoppingCart,
  Calendar,
  Building2,
  FileText,
  Clock,
  CheckCircle,
  Truck,
  X,
  AlertCircle
} from "lucide-react";

interface PurchaseOrdersProps {
  userRole: 'admin' | 'staff';
}

export const PurchaseOrders = ({ userRole }: PurchaseOrdersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  const [formData, setFormData] = useState({
    supplier_id: "",
    delivery_date: "",
    notes: "",
    items: [] as Array<{
      inventory_item_id: string;
      quantity: number;
      cost_price: number;
    }>
  });

  const { purchaseOrders, loading, createPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { items: inventoryItems } = useInventory();

  const filteredPOs = purchaseOrders.filter(po => 
    po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (po.notes && po.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      delivery_date: "",
      notes: "",
      items: []
    });
  };

  const handleCreatePO = async () => {
    if (!formData.supplier_id || formData.items.length === 0) return;
    const result = await createPurchaseOrder(formData, formData.items);
    if (result.success) {
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const addItemToPO = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { inventory_item_id: "", quantity: 1, cost_price: 0 }]
    }));
  };

  const removeItemFromPO = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updatePOItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'inventory_item_id' && value) {
            const matched = inventoryItems.find(x => x.id === value);
            if (matched) updatedItem.cost_price = Number(matched.price) * 0.7; // Estimate wholesale cost price as 70% of retail price
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'ordered':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20"><Truck className="w-3 h-3 mr-1" />Ordered</Badge>;
      case 'received':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Received</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Purchase Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Purchase Orders</h2>
          <p className="text-muted-foreground font-medium">
            Issue stock replenishment orders to suppliers and receive inventory
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="btn-gradient">
          <Plus className="mr-2 h-4 w-4" />
          Create PO
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Total POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">{purchaseOrders.length}</div>
            <p className="text-xs text-muted-foreground font-medium">Replenishment history</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Ordered Status</CardTitle>
            <Truck className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">
              {purchaseOrders.filter(po => po.status === 'ordered').length}
            </div>
            <p className="text-xs text-muted-foreground font-medium">Pending shipment from supplier</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Received POs</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {purchaseOrders.filter(po => po.status === 'received').length}
            </div>
            <p className="text-xs text-muted-foreground font-medium">Successfully processed</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Total Expense</CardTitle>
            <div className="text-sm font-bold">$</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">
              ${purchaseOrders.reduce((sum, po) => sum + Number(po.total_amount), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground font-medium">Accumulated worth of orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="card-enhanced">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search POs by order number or supplier name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 focus-accent"
            />
          </div>
        </CardContent>
      </Card>

      {/* PO Table */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gradient">Purchase Orders</CardTitle>
          <CardDescription>
            Supplier replenishment orders status and stock processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPOs.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono font-semibold">{po.po_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 font-medium">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{po.supplier?.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {po.delivery_date ? new Date(po.delivery_date).toLocaleDateString() : 'Not Specified'}
                  </TableCell>
                  <TableCell className="font-bold text-gradient">${Number(po.total_amount).toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(po.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setViewingPO(po);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {po.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updatePurchaseOrderStatus(po.id, 'ordered')}
                          className="h-8 text-xs font-semibold"
                        >
                          Send Order
                        </Button>
                      )}

                      {po.status === 'ordered' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updatePurchaseOrderStatus(po.id, 'received')}
                          className="h-8 text-xs font-semibold bg-success/10 text-success hover:bg-success/20 border-success/30"
                        >
                          Receive Stock
                        </Button>
                      )}

                      {userRole === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (window.confirm('Delete this purchase order?')) {
                              await deletePurchaseOrder(po.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add PO Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl popover-content max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gradient font-bold text-xl">Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a stock replenishment request for your suppliers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="font-semibold">Select Supplier *</Label>
                <Select value={formData.supplier_id} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}>
                  <SelectTrigger className="dropdown-content font-medium">
                    <SelectValue placeholder="Choose a supplier" />
                  </SelectTrigger>
                  <SelectContent className="dropdown-content">
                    {suppliers.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deliv-date" className="font-semibold">Estimated Delivery Date</Label>
                <Input
                  id="deliv-date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                  className="focus-accent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Order Items</Label>
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 p-3 border rounded-lg bg-muted/20 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Product</Label>
                    <Select 
                      value={item.inventory_item_id} 
                      onValueChange={(val) => updatePOItem(index, 'inventory_item_id', val)}
                    >
                      <SelectTrigger className="dropdown-content">
                        <SelectValue placeholder="Choose product" />
                      </SelectTrigger>
                      <SelectContent className="dropdown-content">
                        {inventoryItems.map(invItem => (
                          <SelectItem key={invItem.id} value={invItem.id}>
                            {invItem.name} (SKU: {invItem.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updatePOItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <Label className="text-xs">Wholesale Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.cost_price}
                      onChange={(e) => updatePOItem(index, 'cost_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItemFromPO(index)}
                    className="text-destructive mb-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" onClick={addItemToPO} variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Item to PO
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="font-semibold">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Include order description, payment terms, etc."
                rows={3}
                className="focus-accent"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePO} className="btn-gradient">Create Draft PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl popover-content max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gradient font-bold text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Purchase Order Details</span>
            </DialogTitle>
            <DialogDescription>
              Complete information regarding PO {viewingPO?.po_number}
            </DialogDescription>
          </DialogHeader>
          {viewingPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 bg-muted/20 rounded-lg">
                  <Label className="text-xs text-muted-foreground font-semibold">Supplier Details</Label>
                  <p className="font-bold text-gradient">{viewingPO.supplier?.name}</p>
                  <p className="text-sm text-muted-foreground">{viewingPO.supplier?.contact_email}</p>
                  <p className="text-sm text-muted-foreground">{viewingPO.supplier?.contact_phone}</p>
                </div>
                <div className="space-y-1 p-3 bg-muted/20 rounded-lg">
                  <Label className="text-xs text-muted-foreground font-semibold">Order Information</Label>
                  <div className="flex justify-between text-sm">
                    <span>PO Status:</span>
                    <span>{getStatusBadge(viewingPO.status)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total Cost:</span>
                    <span className="text-gradient font-bold">${Number(viewingPO.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Order Date:</span>
                    <span>{new Date(viewingPO.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-gradient">Ordered Items</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Cost Price</TableHead>
                        <TableHead>Total Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingPO.items?.map((item: PurchaseOrderItem) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{item.inventory_item?.name || 'Loading...'}</p>
                              <p className="text-xs text-muted-foreground font-mono">{item.inventory_item?.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{item.quantity}</TableCell>
                          <TableCell>${Number(item.cost_price).toFixed(2)}</TableCell>
                          <TableCell className="font-bold text-gradient">${Number(item.total_price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {viewingPO.notes && (
                <div className="p-3 bg-muted/20 rounded-lg">
                  <Label className="text-xs text-muted-foreground font-semibold">Notes</Label>
                  <p className="text-sm mt-1">{viewingPO.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
