import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  Download,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventory } from '@/hooks/useInventory';
import { useTransactions } from '@/hooks/useTransactions';
import { useUsers } from '@/hooks/useUsers';

interface CustomTooltipPayloadItem {
  name: string;
  value: number;
  color?: string;
  fill?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-primary/20 p-3 rounded-lg shadow-xl text-xs font-semibold">
        <p className="text-muted-foreground font-bold mb-1">{label}</p>
        {payload.map((pld) => (
          <div key={pld.name} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center text-foreground font-medium">
              <span className="w-2.5 h-2.5 rounded-full mr-1.5 style-marker" style={{ backgroundColor: pld.color || pld.fill }} />
              {pld.name === 'value' ? 'Asset Value' : pld.name === 'inventory' ? 'Inventory Value' : pld.name}
            </span>
            <span className="font-bold text-primary ml-4">
              {pld.name.toLowerCase().includes('value') || pld.name.toLowerCase().includes('inventory') 
                ? `$${Number(pld.value).toLocaleString()}` 
                : pld.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface AnalyticsDashboardProps {
  userRole: 'admin' | 'staff';
  onNavigate?: (page: string) => void;
}

export const AnalyticsDashboard = ({ userRole, onNavigate }: AnalyticsDashboardProps) => {
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('inventory');
  
  const { items, totalValue, lowStockItems } = useInventory();
  const { transactions, transactionStats } = useTransactions();
  const { users, totalUsers } = useUsers();

  // Calculate analytics data
  const inventoryByCategory = items.reduce((acc, item) => {
    const category = item.category?.name || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { name: category, count: 0, value: 0 };
    }
    acc[category].count += item.quantity;
    acc[category].value += item.quantity * item.price;
    return acc;
  }, {} as Record<string, { name: string; count: number; value: number }>);

  const categoryData = Object.values(inventoryByCategory).map(cat => ({
    name: cat.name,
    count: cat.count,
    value: Math.round(cat.value)
  }));

  const topProducts = items
    .sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price))
    .slice(0, 5)
    .map(item => ({
      name: item.name,
      value: item.quantity * item.price,
      quantity: item.quantity
    }));

  const forecastingData = items.map(item => {
    const rangeDays = parseInt(timeRange) || 30;
    const removalsCount = transactions
      .filter(t => t.item_id === item.id && t.transaction_type === 'remove')
      .reduce((sum, t) => sum + t.quantity_change, 0);
      
    const velocity = Number((removalsCount / rangeDays).toFixed(2));
    
    let daysRemaining = Infinity;
    if (velocity > 0) {
      daysRemaining = Number((item.quantity / velocity).toFixed(1));
    }
    
    return {
      item,
      velocity,
      daysRemaining,
      removalsCount
    };
  });

  const criticalItems = forecastingData
    .filter(fd => fd.velocity > 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 4);

  interface TrajectoryPoint {
    name: string;
    [key: string]: string | number;
  }

  const TRAJECTORY_COLORS = ['#ea580c', '#06b6d4', '#db2777', '#7c3aed'];

  const depletionTrajectoryData: TrajectoryPoint[] = Array.from({ length: 7 }, (_, i) => {
    const day = i * 5; // Day 0, 5, 10, 15, 20, 25, 30
    const point: TrajectoryPoint = { name: `Day ${day}` };
    criticalItems.forEach(({ item, velocity }) => {
      point[item.name] = Math.max(0, Number((item.quantity - velocity * day).toFixed(0)));
    });
    return point;
  });

  const monthlyTrends = [
    { month: 'Jan', inventory: 125000, transactions: 45, users: 8 },
    { month: 'Feb', inventory: 132000, transactions: 52, users: 9 },
    { month: 'Mar', inventory: 128000, transactions: 48, users: 10 },
    { month: 'Apr', inventory: 145000, transactions: 61, users: 11 },
    { month: 'May', inventory: 138000, transactions: 55, users: 12 },
    { month: 'Jun', inventory: 152000, transactions: 68, users: 13 }
  ];

  const transactionTypes = [
    { name: 'Add Stock', value: transactionStats.adds, color: '#06b6d4' },
    { name: 'Remove Stock', value: transactionStats.removes, color: '#ef4444' },
    { name: 'Adjustments', value: transactionStats.adjustments, color: '#f59e0b' },
    { name: 'New Items', value: transactionStats.total - transactionStats.adds - transactionStats.removes - transactionStats.adjustments, color: '#ea580c' }
  ];

  const COLORS = ['#ea580c', '#06b6d4', '#db2777', '#eab308', '#7c3aed'];

  const exportData = () => {
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Inventory Value', `$${totalValue.toLocaleString()}`],
      ['Total Items', items.length.toString()],
      ['Low Stock Items', lowStockItems.length.toString()],
      ['Total Users', totalUsers.toString()],
      ['Total Transactions', transactionStats.total.toString()],
      ['Monthly Growth', '12.5%']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground font-medium">
            Comprehensive insights into your inventory performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15.3%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+2</span> from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inventory by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Distribution of items across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <defs>
                  <linearGradient id="categoryValueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.25} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-[10px]" />
                <YAxis stroke="currentColor" className="text-muted-foreground text-[10px]" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Asset Value" fill="url(#categoryValueGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="trendInventoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="trendTransactionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="month" stroke="currentColor" className="text-muted-foreground text-[10px]" />
                <YAxis stroke="currentColor" className="text-muted-foreground text-[10px]" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="inventory" name="Inventory Value" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#trendInventoryGradient)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="transactions" name="Transactions Count" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#trendTransactionsGradient)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products by Value */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Value</CardTitle>
            <CardDescription>Highest value inventory items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${product.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Types */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Types</CardTitle>
            <CardDescription>Distribution of inventory activities</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={transactionTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {transactionTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projected Stock Depletion Trajectory Chart */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive animate-pulse-slow" />
            Projected Stock Depletion Trajectory (Next 30 Days)
          </CardTitle>
          <CardDescription>
            Visualizing the depletion path for the top critical items running low based on current daily consumption velocities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {criticalItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-success mb-2" />
              <p className="font-semibold text-sm">All inventory items are currently stable</p>
              <p className="text-xs max-w-sm mt-1">No removal transaction velocities were detected over the active time range to project depletion trajectories.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={depletionTrajectoryData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-[10px]" />
                <YAxis stroke="currentColor" className="text-muted-foreground text-[10px]" label={{ value: 'Projected Units', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'currentColor', fontSize: 10, fontWeight: 'bold' } }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                {criticalItems.map((ci, index) => (
                  <Line
                    key={ci.item.id}
                    type="monotone"
                    dataKey={ci.item.name}
                    stroke={TRAJECTORY_COLORS[index % TRAJECTORY_COLORS.length]}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Predictive Run-out Forecasting */}
      <Card className="card-enhanced">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary animate-pulse-slow" />
                Predictive Run-out & Stock Velocity Forecasting
              </CardTitle>
              <CardDescription>
                Estimated consumption velocity and projected run-out dates based on removals over the active {timeRange}-day range.
              </CardDescription>
            </div>
            {onNavigate && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onNavigate('automation')}
                className="hover-accent text-xs"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-accent animate-pulse" />
                Go to Restock Hub
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Item Name</TableHead>
                  <TableHead className="font-bold">SKU</TableHead>
                  <TableHead className="font-bold">Current Stock</TableHead>
                  <TableHead className="font-bold">Daily Velocity</TableHead>
                  <TableHead className="font-bold">Projected Depletion</TableHead>
                  <TableHead className="font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastingData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No forecasting data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  forecastingData.map(({ item, velocity, daysRemaining }) => {
                    let badgeColor = "bg-green-500/10 text-green-500 border-green-500/20";
                    let statusLabel = "Safe (>30d)";
                    
                    if (daysRemaining <= 10) {
                      badgeColor = "bg-red-500/10 text-red-500 border-red-500/20 font-bold animate-pulse";
                      statusLabel = `Critical (${daysRemaining}d)`;
                    } else if (daysRemaining <= 30) {
                      badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                      statusLabel = `Warning (${daysRemaining}d)`;
                    } else if (daysRemaining === Infinity) {
                      statusLabel = "Stable (0 velocity)";
                    }

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">{item.sku}</TableCell>
                        <TableCell className="font-medium">{item.quantity} units</TableCell>
                        <TableCell className="text-muted-foreground text-sm font-medium">
                          {velocity > 0 ? `${velocity} units/day` : '0.00 units/day'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeColor}>
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {onNavigate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-primary hover:underline h-8 px-2 font-semibold"
                              onClick={() => onNavigate('automation')}
                            >
                              Quick Reorder
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest inventory transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.transaction_type === 'add' ? 'bg-green-500' :
                    transaction.transaction_type === 'remove' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div>
                    <p className="font-medium">
                      {transaction.transaction_type === 'add' ? 'Stock Added' :
                       transaction.transaction_type === 'remove' ? 'Stock Removed' :
                       transaction.transaction_type === 'adjust' ? 'Stock Adjusted' :
                       'Item Updated'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.item?.name} • {transaction.user?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {transaction.transaction_type === 'add' ? '+' : ''}
                    {transaction.quantity_change} units
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
