import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Platform, 
  StatusBar 
} from 'react-native';
import { Home, Package, Camera } from 'lucide-react-native';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { useMobileInventory } from './src/hooks/useMobileInventory';

interface UserProfile {
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'supplier';
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'scanner'>('dashboard');

  const {
    items,
    loading,
    totalValue,
    totalItemsCount,
    lowStockItems,
    incrementStock,
    updateItemQty
  } = useMobileInventory();

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Render screens conditionally based on navigation state
  const renderScreen = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardScreen
            user={user}
            items={items}
            totalValue={totalValue}
            totalItemsCount={totalItemsCount}
            lowStockItems={lowStockItems}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onLogout={handleLogout}
          />
        );
      case 'inventory':
        return (
          <InventoryScreen
            userRole={user.role}
            items={items}
            loading={loading}
            onUpdateItemQty={updateItemQty}
          />
        );
      case 'scanner':
        return (
          <ScannerScreen
            inventoryItems={items}
            onScanSuccess={incrementStock}
          />
        );
    }
  };

  // If user is not authenticated, show the LoginScreen
  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#09090b" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />
      
      {/* Active Screen View */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Custom Bottom Tab Bar Navigation UI */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('dashboard')}
        >
          <Home 
            size={22} 
            color={activeTab === 'dashboard' ? '#3b82f6' : '#71717a'} 
          />
          <Text style={[
            styles.tabLabel, 
            { color: activeTab === 'dashboard' ? '#3b82f6' : '#71717a' }
          ]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('inventory')}
        >
          <Package 
            size={22} 
            color={activeTab === 'inventory' ? '#3b82f6' : '#71717a'} 
          />
          <Text style={[
            styles.tabLabel, 
            { color: activeTab === 'inventory' ? '#3b82f6' : '#71717a' }
          ]}>
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('scanner')}
        >
          <Camera 
            size={22} 
            color={activeTab === 'scanner' ? '#3b82f6' : '#71717a'} 
          />
          <Text style={[
            styles.tabLabel, 
            { color: activeTab === 'scanner' ? '#3b82f6' : '#71717a' }
          ]}>
            Scanner
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 88 : 64,
    backgroundColor: '#18181b', // Zinc-900 tabbar background
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});
