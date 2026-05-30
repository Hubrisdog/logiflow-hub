import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { 
  Package, 
  Truck, 
  DollarSign, 
  LogOut, 
  Search, 
  Eye, 
  CheckCircle,
  Building,
  Navigation,
  FileText
} from "lucide-react";
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useInventory } from '@/hooks/useInventory';
import type { PurchaseOrder, PurchaseOrderItem, InventoryItem } from '@/types/inventory';
import { toast } from 'sonner';

interface SupplierPortalProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    supplier_id: string;
  };
  onLogout: () => void;
}

export const SupplierPortal = ({ user, onLogout }: SupplierPortalProps) => {
  const { purchaseOrders, updatePurchaseOrderShipping, loading: poLoading } = usePurchaseOrders();
  const { items, updateItem, loading: invLoading } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
  const [shipData, setShipData] = useState({
    carrier: '',
    trackingNumber: ''
  });

  const [editingCatalogItem, setEditingCatalogItem] = useState<InventoryItem | null>(null);
  const [catalogPrice, setCatalogPrice] = useState('');

  // Filter purchase orders issued to this supplier
  const supplierPOs = purchaseOrders.filter(po => po.supplier_id === user.supplier_id);
  
  // Filter products supplied by this supplier
  const supplierItems = items.filter(item => item.supplier_id === user.supplier_id);

  // Search filter
  const filteredPOs = supplierPOs.filter(po => 
    po.po_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = supplierItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const pendingCount = supplierPOs.filter(po => po.status === 'ordered' && !po.tracking_number).length;
  const shippedCount = supplierPOs.filter(po => po.status === 'ordered' && po.tracking_number).length;
  const totalEarnings = supplierPOs
    .filter(po => po.status === 'received')
    .reduce((sum, po) => sum + Number(po.total_amount), 0);

  const getCustomPOStatus = (po: PurchaseOrder) => {
    if (po.status === 'received') return <Badge className="bg-success text-success-foreground">Delivered</Badge>;
    if (po.status === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>;
    if (po.status === 'draft') return <Badge variant="outline">Draft Approval</Badge>;
    if (po.tracking_number) return <Badge className="bg-blue-500 text-white">Shipped / In Transit</Badge>;
    return <Badge className="bg-amber-500 text-white">Awaiting Shipment</Badge>;
  };

  const handleShipOrder = async () => {
    if (!selectedPO || !shipData.carrier || !shipData.trackingNumber) {
      toast.error("Please fill in shipping details");
      return;
    }

    const result = await updatePurchaseOrderShipping(
      selectedPO.id,
      'ordered', // Retain ordered status, update tracking details
      shipData.carrier,
      shipData.trackingNumber
    );

    if (result.success) {
      setIsShipDialogOpen(false);
      setIsDetailsOpen(false);
      setShipData({ carrier: '', trackingNumber: '' });
    }
  };

  const handleUpdateCatalogPrice = async () => {
    if (!editingCatalogItem || !catalogPrice) return;
    
    const priceNum = parseFloat(catalogPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Invalid wholesale price");
      return;
    }

    // Update item wholesale price
    const result = await updateItem(editingCatalogItem.id, {
      price: priceNum
    });

    if (result.success) {
      setEditingCatalogItem(null);
      setCatalogPrice('');
    }
  };

  const openShipDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsShipDialogOpen(true);
  };

  const openDetailsModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsDetailsOpen(true);
  };

  const openEditPriceDialog = (item: InventoryItem) => {
    setEditingCatalogItem(item);
    setCatalogPrice(item.price.toString());
  };

  if (poLoading || invLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Truck className="h-10 w-10 animate-bounce mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-semibold">Loading Supplier Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar Header */}
      <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">LogiFlow <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">Supplier Hub</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate capitalize">Apple Inc. (Partner)</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Hero Stats */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-enhanced border border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold">Awaiting Shipment</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Truck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders requiring tracking numbers</p>
            </CardContent>
          </Card>

          <Card className="card-enhanced border border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold">In Transit</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Navigation className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{shippedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Shipped orders awaiting delivery confirmation</p>
            </CardContent>
          </Card>

          <Card className="card-enhanced border border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold">Total Revenue Earned</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">${totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Revenue from delivered purchase orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs & Content */}
        <div className="space-y-4">
          <div className="flex space-x-2 border-b pb-2">
            <Button
              variant={activeTab === 'orders' ? 'default' : 'ghost'}
              onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
            >
              Purchase Orders
            </Button>
            <Button
              variant={activeTab === 'catalog' ? 'default' : 'ghost'}
              onClick={() => { setActiveTab('catalog'); setSearchTerm(''); }}
            >
              Wholesale Catalog Price
            </Button>
          </div>

          <Card className="card-enhanced shadow-md">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="capitalize">{activeTab === 'orders' ? 'Inbound Purchase Orders' : 'Supplier Product Catalog'}</CardTitle>
                <CardDescription>
                  {activeTab === 'orders' 
                    ? 'Manage order status, confirm tracking IDs, and review warehouse receipts' 
                    : 'Manage wholesale price offerings. Changes apply instantly to low-stock ordering processes.'}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === 'orders' ? "Search PO number..." : "Search product SKU..."}
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            
            <CardContent>
              {activeTab === 'orders' ? (
                /* Orders Tab Table */
                filteredPOs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-semibold">No purchase orders found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Order Date</TableHead>
                          <TableHead>Target Total</TableHead>
                          <TableHead>Tracking ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPOs.map((po) => (
                          <TableRow key={po.id}>
                            <TableCell className="font-bold font-mono">{po.po_number}</TableCell>
                            <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="font-semibold">${Number(po.total_amount).toFixed(2)}</TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {po.tracking_number ? `${po.carrier} (${po.tracking_number})` : 'Awaiting shipment'}
                            </TableCell>
                            <TableCell>{getCustomPOStatus(po)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => openDetailsModal(po)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                                {po.status === 'ordered' && !po.tracking_number && (
                                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => openShipDialog(po)}>
                                    <Truck className="h-4 w-4 mr-1" />
                                    Ship Order
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                /* Catalog Tab Table */
                filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-semibold">No supplied catalog items found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Current Warehouse Qty</TableHead>
                          <TableHead>Wholesale Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-semibold">{item.name}</TableCell>
                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                            <TableCell>{item.category?.name || 'N/A'}</TableCell>
                            <TableCell className="font-semibold">{item.quantity} units</TableCell>
                            <TableCell className="font-semibold">${item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => openEditPriceDialog(item)}>
                                Edit Wholesale Price
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* PO Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Purchase Order Details: {selectedPO?.po_number}</span>
            </DialogTitle>
            <DialogDescription>
              Issued by LogiFlow Procurement Team
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block">Partner Supplier</span>
                  <span className="text-sm font-semibold flex items-center">
                    <Building className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {selectedPO.supplier?.name}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block">Order Value</span>
                  <span className="text-sm font-bold text-gradient">${Number(selectedPO.total_amount).toFixed(2)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block">Date Created</span>
                  <span className="text-sm font-semibold">{new Date(selectedPO.created_at).toLocaleDateString()}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block">Shipping Tracking ID</span>
                  <span className="text-sm font-semibold">
                    {selectedPO.tracking_number ? `${selectedPO.carrier} (${selectedPO.tracking_number})` : 'Awaiting Shipment'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-bold text-sm">Ordered Products</Label>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items?.map((item: PurchaseOrderItem) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-sm">{item.inventory_item?.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{item.inventory_item?.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{item.quantity}</TableCell>
                          <TableCell>${Number(item.cost_price).toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">${Number(item.total_price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedPO.notes && (
                <div className="space-y-1.5 p-3 bg-card border rounded-lg">
                  <Label className="text-xs text-muted-foreground block font-bold">Notes</Label>
                  <p className="text-sm">{selectedPO.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedPO?.status === 'ordered' && !selectedPO.tracking_number && (
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => openShipDialog(selectedPO)}>
                <Truck className="h-4 w-4 mr-2" />
                Ship Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Order Dialog */}
      <Dialog open={isShipDialogOpen} onOpenChange={setIsShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-amber-500" />
              <span>Record Shipment for {selectedPO?.po_number}</span>
            </DialogTitle>
            <DialogDescription>
              Enter courier tracking codes to transition this order to in-transit status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">Logistics Carrier</Label>
              <Input
                id="carrier"
                placeholder="e.g. DHL, FedEx, UPS"
                value={shipData.carrier}
                onChange={(e) => setShipData({ ...shipData, carrier: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                placeholder="e.g. TRK983827110"
                value={shipData.trackingNumber}
                onChange={(e) => setShipData({ ...shipData, trackingNumber: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShipDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShipOrder} disabled={!shipData.carrier || !shipData.trackingNumber}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Price Dialog */}
      <Dialog open={!!editingCatalogItem} onOpenChange={(open) => !open && setEditingCatalogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Wholesale Price</DialogTitle>
            <DialogDescription>
              Set the wholesale cost price for <strong>{editingCatalogItem?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wholesale-price">Wholesale Unit Price ($)</Label>
              <Input
                id="wholesale-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={catalogPrice}
                onChange={(e) => setCatalogPrice(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCatalogItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCatalogPrice}>
              Update Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
