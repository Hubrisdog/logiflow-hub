import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  DollarSign, 
  Download, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Building,
  Info,
  Calendar
} from "lucide-react";
import { useInventory } from '@/hooks/useInventory';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';

interface SyncLog {
  id: string;
  platform: 'QuickBooks' | 'Xero';
  type: string;
  status: 'success' | 'failed';
  records: number;
  timestamp: string;
}

export const AccountingHub = () => {
  const { items, totalValue } = useInventory();
  const { purchaseOrders } = usePurchaseOrders();
  const { transactions } = useTransactions();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncHistory, setSyncHistory] = useState<SyncLog[]>([
    { id: '1', platform: 'QuickBooks', type: 'Inventory Valuation Sync', status: 'success', records: 24, timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString() },
    { id: '2', platform: 'Xero', type: 'Accounts Payable Bills Sync', status: 'success', records: 8, timestamp: new Date(Date.now() - 3600000 * 48).toLocaleString() },
    { id: '3', platform: 'QuickBooks', type: 'COGS Ledger Update', status: 'success', records: 110, timestamp: new Date(Date.now() - 3600000 * 72).toLocaleString() },
    { id: '4', platform: 'Xero', type: 'Inventory Valuation Sync', status: 'failed', records: 0, timestamp: new Date(Date.now() - 3600000 * 96).toLocaleString() }
  ]);

  // Financial calculations
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Cost is estimated at 60% of retail price
  const estimatedCostValue = items.reduce((sum, item) => sum + (item.quantity * item.price * 0.6), 0);
  
  // COGS = sum of units sold/removed * wholesale cost
  const cogsValue = transactions
    .filter(t => t.transaction_type === 'remove')
    .reduce((sum, t) => {
      const itemPrice = items.find(i => i.id === t.item_id)?.price || 50;
      return sum + (t.quantity_change * itemPrice * 0.6);
    }, 0);

  // Sales Revenue estimate from transaction removals (retail price)
  const salesRevenue = transactions
    .filter(t => t.transaction_type === 'remove')
    .reduce((sum, t) => {
      const itemPrice = items.find(i => i.id === t.item_id)?.price || 50;
      return sum + (t.quantity_change * itemPrice);
    }, 0);

  const profitMargin = salesRevenue > 0 ? ((salesRevenue - cogsValue) / salesRevenue) * 100 : 40;

  // QuickBooks CSV Export
  const handleExportQuickBooks = () => {
    try {
      const csvRows = [
        ['Item Name', 'SKU', 'Description', 'Quantity on Hand', 'Cost Price', 'Retail Price', 'Total Asset Cost', 'Preferred Supplier'],
        ...items.map(item => [
          `"${item.name.replace(/"/g, '""')}"`,
          item.sku,
          `"${(item.description || '').replace(/"/g, '""')}"`,
          item.quantity,
          (item.price * 0.6).toFixed(2),
          item.price.toFixed(2),
          (item.quantity * item.price * 0.6).toFixed(2),
          item.supplier?.name || 'N/A'
        ])
      ];

      const csvContent = csvRows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `QuickBooks_Inventory_Valuation_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QuickBooks Inventory Valuation CSV exported successfully!");
    } catch (err) {
      toast.error("Failed to export QuickBooks CSV");
    }
  };

  // Xero Bills/Ledger Export
  const handleExportXero = () => {
    try {
      const csvRows = [
        ['ContactName', 'EmailAddress', 'InvoiceNumber', 'InvoiceDate', 'DueDate', 'Description', 'Quantity', 'UnitAmount', 'AccountCode', 'TaxType'],
        ...purchaseOrders
          .filter(po => po.status === 'received' || po.status === 'ordered')
          .map(po => [
            `"${po.supplier?.name || 'Partner Supplier'}"`,
            po.supplier?.contact_email || '',
            po.po_number,
            new Date(po.created_at).toISOString().split('T')[0],
            po.delivery_date ? new Date(po.delivery_date).toISOString().split('T')[0] : new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], // 30 day net
            `"Procurement Bill for Purchase Order ${po.po_number}"`,
            1,
            Number(po.total_amount).toFixed(2),
            '500', // Cost of Goods Sold Asset code in Xero
            'NONE'
          ])
      ];

      const csvContent = csvRows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Xero_Accounts_Payable_Bills_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Xero Accounts Payable Bills CSV exported successfully!");
    } catch (err) {
      toast.error("Failed to export Xero CSV");
    }
  };

  // Run API Sync Simulation loader
  const handleTriggerSync = (platform: 'QuickBooks' | 'Xero') => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(0);

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSyncing(false);
            
            // Add to history
            const recordsSynced = platform === 'QuickBooks' ? items.length : purchaseOrders.length;
            const newLog: SyncLog = {
              id: (syncHistory.length + 1).toString(),
              platform,
              type: platform === 'QuickBooks' ? 'Inventory Valuation Sync' : 'Accounts Payable Bills Sync',
              status: 'success',
              records: recordsSynced,
              timestamp: new Date().toLocaleString()
            };
            setSyncHistory(prevHistory => [newLog, ...prevHistory]);
            
            toast.success(`Successfully synchronized ${recordsSynced} ledger records with ${platform} API!`);
          }, 300);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Accounting Hub</h2>
        <p className="text-muted-foreground font-medium">
          Monitor valuation ledgers, compute profitability indexes, and synchronize records with QuickBooks & Xero.
        </p>
      </div>

      {/* Financial Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-enhanced border border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold">Inventory Valuation (Cost)</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estimatedCostValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on estimated wholesale unit costs</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold">Asset Value (Retail)</CardTitle>
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Calculated at current pricing models</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold">Cost of Goods Sold (COGS)</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${cogsValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Accrued cost of sold/removed items</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold">Estimated Gross Profit Margin</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Wholesale price margin margin buffer</p>
          </CardContent>
        </Card>
      </div>

      {/* Syncing Progress Indicator */}
      {isSyncing && (
        <Card className="card-enhanced border-primary/30 bg-primary/5 animate-pulse">
          <CardContent className="py-4 space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="flex items-center">
                <RefreshCw className="h-4 w-4 animate-spin mr-2 text-primary" />
                Synchronizing batch ledger records with financial platform API...
              </span>
              <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* QuickBooks & Xero Sync Integration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* QuickBooks Card */}
        <Card className="card-enhanced shadow-md flex flex-col justify-between">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center space-x-2 text-[#0077C5]">
                  <Building className="h-5 w-5 mr-1" />
                  QuickBooks Online
                </CardTitle>
                <CardDescription>
                  Keep your corporate ledger valuation up to date.
                </CardDescription>
              </div>
              <Badge className="bg-[#0077C5]/10 text-[#0077C5] hover:bg-[#0077C5]/20 font-semibold border-none">API Connector</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Syncs inventory asset accounts, stock numbers on hand, and average wholesale cost allocations directly into QBO asset accounts.
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#0077C5] hover:bg-[#005a96] text-white" onClick={() => handleTriggerSync('QuickBooks')} disabled={isSyncing}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Trigger API Sync
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportQuickBooks}>
                <Download className="h-4 w-4 mr-1.5" />
                Export Valuation CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Xero Card */}
        <Card className="card-enhanced shadow-md flex flex-col justify-between">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center space-x-2 text-[#13B5EA]">
                  <Building className="h-5 w-5 mr-1" />
                  Xero Ledger Sync
                </CardTitle>
                <CardDescription>
                  Reconcile supplier procurement invoices and bills.
                </CardDescription>
              </div>
              <Badge className="bg-[#13B5EA]/10 text-[#13B5EA] hover:bg-[#13B5EA]/20 font-semibold border-none">API Connector</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Extracts completed warehouse receipts and transfers them into Xero accounts payable as draft bills to accelerate partner payouts.
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#13B5EA] hover:bg-[#0f8cb6] text-white" onClick={() => handleTriggerSync('Xero')} disabled={isSyncing}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Trigger API Sync
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportXero}>
                <Download className="h-4 w-4 mr-1.5" />
                Export Bills CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Logs Table */}
      <Card className="card-enhanced shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
            Synchronisation Audit History
          </CardTitle>
          <CardDescription>
            Audit log of financial integrations running locally or over API channels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Operation Type</TableHead>
                  <TableHead>Records Synced</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Sync Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncHistory.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-semibold">{log.platform}</TableCell>
                    <TableCell className="text-muted-foreground">{log.type}</TableCell>
                    <TableCell className="font-semibold">{log.records} entries</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.timestamp}</TableCell>
                    <TableCell>
                      {log.status === 'success' ? (
                        <Badge className="bg-success text-success-foreground flex items-center w-fit gap-1 border-none font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center w-fit gap-1 border-none font-semibold">
                          <AlertCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
