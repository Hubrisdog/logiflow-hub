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
import { useLocations } from "@/hooks/useLocations";
import { useInventory } from "@/hooks/useInventory";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Building2,
  Package,
  Layers,
  ArrowRightLeft
} from "lucide-react";

interface LocationsManagementProps {
  userRole: 'admin' | 'staff';
}

export const LocationsManagement = ({ userRole }: LocationsManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: ""
  });

  const [allocateData, setAllocateData] = useState({
    item_id: "",
    location_id: "",
    quantity: "",
    shelf_location: ""
  });

  const { locations, stockLocations, loading, addLocation, updateLocation, deleteLocation, updateItemStockAtLocation } = useLocations();
  const { items } = useInventory();

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      description: ""
    });
  };

  const handleAddLocation = async () => {
    if (!formData.name) return;
    const result = await addLocation(formData);
    if (result.success) {
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleAllocateStock = async () => {
    if (!allocateData.item_id || !allocateData.location_id || !allocateData.quantity) return;
    
    const result = await updateItemStockAtLocation(
      allocateData.item_id,
      allocateData.location_id,
      parseInt(allocateData.quantity),
      allocateData.shelf_location || null
    );

    if (result.success) {
      setIsAllocateDialogOpen(false);
      setAllocateData({
        item_id: "",
        location_id: "",
        quantity: "",
        shelf_location: ""
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading warehouses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Multi-Location Inventory</h2>
          <p className="text-muted-foreground font-medium">
            Manage multiple warehouses and track stock allocations per location
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAllocateDialogOpen(true)} variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Allocate Stock
          </Button>
          {userRole === 'admin' && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="btn-gradient">
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Warehouses</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">{locations.length}</div>
            <p className="text-xs text-muted-foreground font-medium">Active facilities</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Total Stock Placed</CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <Package className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stockLocations.reduce((sum, sl) => sum + sl.quantity, 0)}
            </div>
            <p className="text-xs text-muted-foreground font-medium">Across all locations</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Allocated Items</CardTitle>
            <div className="p-2 rounded-lg bg-accent/10">
              <Layers className="h-4 w-4 text-accent-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">
              {new Set(stockLocations.map(sl => sl.item_id)).size}
            </div>
            <p className="text-xs text-muted-foreground font-medium">Unique products placed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="card-enhanced">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search warehouses by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 focus-accent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gradient">Warehouse Locations</CardTitle>
          <CardDescription>
            Physical storage locations configured in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Current Items Stock</TableHead>
                {userRole === 'admin' && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((loc) => {
                const totalStock = stockLocations
                  .filter(sl => sl.location_id === loc.id)
                  .reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <TableRow key={loc.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2 font-medium">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{loc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {loc.address ? (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{loc.address}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {loc.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-gradient">{totalStock} units</span>
                    </TableCell>
                    {userRole === 'admin' && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (window.confirm('Delete warehouse location? All stock will lose its location mapping.')) {
                              await deleteLocation(loc.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Location Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="popover-content">
          <DialogHeader>
            <DialogTitle className="text-gradient font-bold text-xl">Add New Warehouse</DialogTitle>
            <DialogDescription>
              Register a new physical warehouse or stockroom in your system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-semibold">Warehouse Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. West Warehouse"
                className="focus-accent"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="font-semibold">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g. 100 Main St."
                className="focus-accent"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="font-semibold">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description of what is stored here"
                rows={3}
                className="focus-accent"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLocation} className="btn-gradient">Add Warehouse</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Stock Dialog */}
      <Dialog open={isAllocateDialogOpen} onOpenChange={setIsAllocateDialogOpen}>
        <DialogContent className="popover-content">
          <DialogHeader>
            <DialogTitle className="text-gradient font-bold text-xl">Allocate Stock to Warehouse</DialogTitle>
            <DialogDescription>
              Assign physical stock count and shelf details of a product to a warehouse location.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-semibold">Select Product *</Label>
              <Select value={allocateData.item_id} onValueChange={(value) => setAllocateData(prev => ({ ...prev, item_id: value }))}>
                <SelectTrigger className="dropdown-content font-medium">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent className="dropdown-content">
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label className="font-semibold">Select Warehouse Location *</Label>
              <Select value={allocateData.location_id} onValueChange={(value) => setAllocateData(prev => ({ ...prev, location_id: value }))}>
                <SelectTrigger className="dropdown-content font-medium">
                  <SelectValue placeholder="Choose a location" />
                </SelectTrigger>
                <SelectContent className="dropdown-content">
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="alloc-qty" className="font-semibold">Quantity *</Label>
                <Input
                  id="alloc-qty"
                  type="number"
                  placeholder="e.g. 50"
                  value={allocateData.quantity}
                  onChange={(e) => setAllocateData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="focus-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="alloc-shelf" className="font-semibold">Shelf Details</Label>
                <Input
                  id="alloc-shelf"
                  placeholder="e.g. Aisle 5, Row B"
                  value={allocateData.shelf_location}
                  onChange={(e) => setAllocateData(prev => ({ ...prev, shelf_location: e.target.value }))}
                  className="focus-accent"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAllocateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAllocateStock} className="btn-gradient">Allocate Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
