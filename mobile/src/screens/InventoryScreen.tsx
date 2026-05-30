import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView, 
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Search, Filter, AlertTriangle, Plus, Minus, X, Tag, Factory } from 'lucide-react-native';
import { MobileInventoryItem } from '../hooks/useMobileInventory';

interface InventoryScreenProps {
  userRole: 'admin' | 'staff' | 'supplier';
  items: MobileInventoryItem[];
  loading: boolean;
  onUpdateItemQty: (id: string, qty: number) => Promise<boolean>;
}

export const InventoryScreen = ({
  userRole,
  items,
  loading,
  onUpdateItemQty
}: InventoryScreenProps) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MobileInventoryItem | null>(null);
  const [editQty, setEditQty] = useState('0');

  // Derive unique categories
  const categories = ['All', ...Array.from(new Set(items.map(i => i.categoryName)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openDetail = (item: MobileInventoryItem) => {
    setSelectedItem(item);
    setEditQty(item.quantity.toString());
    setDetailModalOpen(true);
  };

  const handleSaveQty = async () => {
    if (!selectedItem) return;

    const parsedQty = parseInt(editQty);
    if (isNaN(parsedQty) || parsedQty < 0) {
      Alert.alert('Validation Error', 'Please enter a valid stock quantity (0 or greater).');
      return;
    }

    const success = await onUpdateItemQty(selectedItem.id, parsedQty);
    if (success) {
      setDetailModalOpen(false);
      setSelectedItem(null);
    } else {
      Alert.alert('Save Failed', 'Could not update inventory quantity.');
    }
  };

  const renderItemCard = ({ item }: { item: MobileInventoryItem }) => {
    const isLow = item.quantity < item.min_quantity;
    return (
      <TouchableOpacity 
        style={[styles.itemCard, isLow ? styles.cardLow : null]} 
        onPress={() => openDetail(item)}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSku}>{item.sku}</Text>
          </View>
          <View style={[
            styles.badge, 
            isLow ? styles.badgeLow : styles.badgeNormal
          ]}>
            <Text style={[
              styles.badgeText,
              isLow ? { color: '#ef4444' } : { color: '#10b981' }
            ]}>
              {isLow ? 'Low Stock' : 'In Stock'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Tag size={12} color="#71717a" />
            <Text style={styles.detailText}>{item.categoryName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Factory size={12} color="#71717a" />
            <Text style={styles.detailText}>{item.supplierName}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          <View style={styles.qtyContainer}>
            <Text style={styles.qtyLabel}>On Hand: </Text>
            <Text style={[styles.qtyValue, isLow ? { color: '#ef4444' } : { color: '#10b981' }]}>
              {item.quantity}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Search Input bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product name or SKU..."
            placeholderTextColor="#71717a"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category Horizontal Filter Chips list */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCategory === item ? styles.filterChipActive : null
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCategory === item ? styles.filterChipTextActive : null
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.filterListContent}
          />
        </View>

        {/* Inventory Items List */}
        <FlatList
          data={filteredItems}
          renderItem={renderItemCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No inventory products found matching filters.</Text>
            </View>
          }
        />

        {/* Item Details and Edit Modal Dialog */}
        {selectedItem && (
          <Modal
            visible={detailModalOpen}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setDetailModalOpen(false)}
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalBg}
            >
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Product Details</Text>
                  <TouchableOpacity onPress={() => setDetailModalOpen(false)}>
                    <X size={20} color="#fafafa" />
                  </TouchableOpacity>
                </View>

                {/* Product Stats info */}
                <View style={styles.modalBody}>
                  <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                  <Text style={styles.modalItemSku}>{selectedItem.sku}</Text>
                  
                  <View style={styles.modalDetailGrid}>
                    <View style={styles.modalDetailCol}>
                      <Text style={styles.gridLabel}>Category</Text>
                      <Text style={styles.gridVal}>{selectedItem.categoryName}</Text>
                    </View>
                    <View style={styles.modalDetailCol}>
                      <Text style={styles.gridLabel}>Price</Text>
                      <Text style={styles.gridVal}>${selectedItem.price.toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.modalDetailGrid}>
                    <View style={styles.modalDetailCol}>
                      <Text style={styles.gridLabel}>Supplier</Text>
                      <Text style={styles.gridVal}>{selectedItem.supplierName}</Text>
                    </View>
                    <View style={styles.modalDetailCol}>
                      <Text style={styles.gridLabel}>Min Quantity Alert Threshold</Text>
                      <Text style={styles.gridVal}>{selectedItem.min_quantity} units</Text>
                    </View>
                  </View>

                  <View style={styles.descriptionCard}>
                    <Text style={styles.descTitle}>Description</Text>
                    <Text style={styles.descText}>{selectedItem.description || 'No description provided.'}</Text>
                  </View>

                  {/* Stock override control input (conditional user role check) */}
                  {userRole !== 'supplier' ? (
                    <View style={styles.stockControlCard}>
                      <Text style={styles.controlTitle}>Modify Stock Level</Text>
                      <View style={styles.controlInputsRow}>
                        <TouchableOpacity 
                          style={styles.controlBtn}
                          onPress={() => setEditQty((Math.max(0, parseInt(editQty || '0') - 1)).toString())}
                        >
                          <Minus size={18} color="#fafafa" />
                        </TouchableOpacity>

                        <TextInput
                          style={styles.controlInput}
                          keyboardType="numeric"
                          value={editQty}
                          onChangeText={setEditQty}
                        />

                        <TouchableOpacity 
                          style={styles.controlBtn}
                          onPress={() => setEditQty((parseInt(editQty || '0') + 1).toString())}
                        >
                          <Plus size={18} color="#fafafa" />
                        </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveQty}>
                        <Text style={styles.saveBtnText}>Save stock modifications</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.supplierWarningCard}>
                      <AlertTriangle size={14} color="#eab308" />
                      <Text style={styles.supplierWarningText}>
                        Supplier roles have read-only access to stock counts. Please submit a purchase order bill to request changes.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        )}
      </View>
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
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#18181b',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fafafa',
    fontSize: 14,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterListContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 20,
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
  },
  cardLow: {
    borderColor: '#ef444433',
    backgroundColor: '#ef444408',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  itemSku: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeNormal: {
    backgroundColor: '#10b9811a',
  },
  badgeLow: {
    backgroundColor: '#ef44441a',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fafafa',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '500',
  },
  modalBg: {
    flex: 1,
    backgroundColor: '#000000a6',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#09090b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  modalBody: {
    padding: 20,
  },
  modalItemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  modalItemSku: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 20,
  },
  modalDetailGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  modalDetailCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gridVal: {
    fontSize: 14,
    color: '#fafafa',
    marginTop: 4,
    fontWeight: '500',
  },
  descriptionCard: {
    backgroundColor: '#18181b',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginTop: 10,
    marginBottom: 20,
  },
  descTitle: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
    fontWeight: '500',
  },
  stockControlCard: {
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3b82f633',
  },
  controlTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 12,
  },
  controlInputsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlInput: {
    width: 80,
    height: 44,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    color: '#fafafa',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveBtn: {
    height: 44,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  supplierWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#eab30810',
    borderWidth: 1,
    borderColor: '#eab30833',
    borderRadius: 12,
  },
  supplierWarningText: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
});
