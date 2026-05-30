import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView,
  Platform
} from 'react-native';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Camera, 
  ChevronRight, 
  LogOut, 
  User 
} from 'lucide-react-native';
import { MobileInventoryItem } from '../hooks/useMobileInventory';

interface DashboardScreenProps {
  user: { name: string; email: string; role: 'admin' | 'staff' | 'supplier' };
  items: MobileInventoryItem[];
  totalValue: number;
  totalItemsCount: number;
  lowStockItems: MobileInventoryItem[];
  onNavigateToTab: (tab: 'inventory' | 'scanner') => void;
  onLogout: () => void;
}

export const DashboardScreen = ({
  user,
  items,
  totalValue,
  totalItemsCount,
  lowStockItems,
  onNavigateToTab,
  onLogout
}: DashboardScreenProps) => {

  const renderLowStockItem = ({ item }: { item: MobileInventoryItem }) => (
    <View style={styles.lowStockRow}>
      <View style={styles.lowStockItemLeft}>
        <View style={styles.warningIndicator}>
          <AlertTriangle size={16} color="#ef4444" />
        </View>
        <View>
          <Text style={styles.lowStockName}>{item.name}</Text>
          <Text style={styles.lowStockSku}>{item.sku}</Text>
        </View>
      </View>
      <View style={styles.lowStockItemRight}>
        <Text style={styles.lowStockQtyText}>Qty: {item.quantity}</Text>
        <Text style={styles.lowStockMinText}>Min: {item.min_quantity}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* User Greeting Profile Header */}
        <View style={styles.header}>
          <View style={styles.userProfile}>
            <View style={styles.avatarBg}>
              <User size={20} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <LogOut size={18} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* User Role Badge */}
        <View style={styles.roleBadgeContainer}>
          <View style={[
            styles.roleBadge, 
            user.role === 'admin' ? styles.roleAdmin : 
            user.role === 'staff' ? styles.roleStaff : styles.roleSupplier
          ]}>
            <Text style={[
              styles.roleText,
              user.role === 'admin' ? { color: '#f87171' } : 
              user.role === 'staff' ? { color: '#34d399' } : { color: '#fbbf24' }
            ]}>
              {user.role === 'admin' ? 'Administrator' : 
               user.role === 'staff' ? 'Warehouse Staff' : 'Partner Supplier'}
            </Text>
          </View>
        </View>

        {/* Core Financial & Capacity Metrics cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Asset Value</Text>
              <TrendingUp size={16} color="#3b82f6" />
            </View>
            <Text style={styles.metricVal}>${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
            <Text style={styles.metricSub}>Current wholesale valuation</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Items in Stock</Text>
              <Package size={16} color="#10b981" />
            </View>
            <Text style={styles.metricVal}>{totalItemsCount}</Text>
            <Text style={styles.metricSub}>{items.length} unique catalog SKUs</Text>
          </View>
        </View>

        {/* Quick action buttons */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: '#1d4ed81a', borderColor: '#3b82f64d' }]}
              onPress={() => onNavigateToTab('scanner')}
            >
              <Camera size={22} color="#3b82f6" />
              <Text style={[styles.actionLabel, { color: '#3b82f6' }]}>Scan SKU</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: '#064e3b1a', borderColor: '#10b9814d' }]}
              onPress={() => onNavigateToTab('inventory')}
            >
              <Package size={22} color="#10b981" />
              <Text style={[styles.actionLabel, { color: '#10b981' }]}>Browse Catalog</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Low Stock alerts section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
            <View style={[styles.alertBadge, { backgroundColor: lowStockItems.length > 0 ? '#ef44441a' : '#10b9811a' }]}>
              <Text style={[styles.alertBadgeText, { color: lowStockItems.length > 0 ? '#ef4444' : '#10b981' }]}>
                {lowStockItems.length} alerts
              </Text>
            </View>
          </View>

          {lowStockItems.length > 0 ? (
            <View style={styles.lowStockCard}>
              <FlatList
                data={lowStockItems}
                renderItem={renderLowStockItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          ) : (
            <View style={styles.emptyAlertsCard}>
              <Text style={styles.emptyAlertsText}>All stock levels are currently healthy.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  roleAdmin: {
    backgroundColor: '#ef444410',
    borderColor: '#ef444433',
  },
  roleStaff: {
    backgroundColor: '#10b98110',
    borderColor: '#10b98133',
  },
  roleSupplier: {
    backgroundColor: '#eab30810',
    borderColor: '#eab30833',
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  metricSub: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  alertBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  lowStockCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 8,
  },
  lowStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  lowStockItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  warningIndicator: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ef44441a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lowStockName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fafafa',
  },
  lowStockSku: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  lowStockItemRight: {
    alignItems: 'flex-end',
  },
  lowStockQtyText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  lowStockMinText: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  emptyAlertsCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
    alignItems: 'center',
  },
  emptyAlertsText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
  },
});
