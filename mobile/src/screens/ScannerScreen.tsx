import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  Alert,
  Animated
} from 'react-native';
import { Camera, Volume2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react-native';
import { MobileInventoryItem } from '../hooks/useMobileInventory';

interface ScannerScreenProps {
  inventoryItems: MobileInventoryItem[];
  onScanSuccess: (sku: string) => Promise<{ success: boolean; itemName?: string }>;
}

export const ScannerScreen = ({ inventoryItems, onScanSuccess }: ScannerScreenProps) => {
  const [manualSku, setManualSku] = useState('');
  const [selectedSimSku, setSelectedSimSku] = useState('');
  const [scanning, setScanning] = useState(false);
  
  // Laser line animation
  const laserAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 200,
            duration: 1500,
            useNativeDriver: true
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      laserAnim.setValue(0);
    }
  }, [scanning]);

  const handleSimulateScan = async (skuToScan: string) => {
    if (!skuToScan) {
      Alert.alert('Selection Required', 'Please select a simulated product to scan.');
      return;
    }

    setScanning(true);
    
    // Artificial scanning lock-on delay
    setTimeout(async () => {
      setScanning(false);
      const result = await onScanSuccess(skuToScan);
      
      if (result.success) {
        Alert.alert('Scan Success', `Product: ${result.itemName}\nSKU: ${skuToScan}\nQuantity has been incremented by +1.`);
        setManualSku('');
        setSelectedSimSku('');
      } else {
        Alert.alert('Scan Error', `SKU ${skuToScan} not found in inventory.`);
      }
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Scanner Viewport */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.cameraBox}>
            {scanning ? (
              <View style={styles.scanningLayer}>
                {/* Glowing Laser line */}
                <Animated.View style={[
                  styles.laserLine, 
                  { transform: [{ translateY: laserAnim }] }
                ]} />
                <Text style={styles.viewfinderText}>Locking on barcode...</Text>
              </View>
            ) : (
              <View style={styles.idleLayer}>
                <Camera size={36} color="#71717a" style={styles.cameraIcon} />
                <Text style={styles.viewfinderText}>Camera stream ready</Text>
              </View>
            )}

            {/* Corner Indicators overlays */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Simulation console */}
        <View style={styles.consoleContainer}>
          <View style={styles.consoleHeader}>
            <Sparkles size={16} color="#eab308" />
            <Text style={styles.consoleTitle}>Interactive Barcode Simulator</Text>
          </View>

          <Text style={styles.consoleSub}>Select a test product to simulate scanning the barcode badge:</Text>
          
          <View style={styles.skuGrid}>
            {inventoryItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.skuChip,
                  selectedSimSku === item.sku ? styles.skuChipActive : null
                ]}
                onPress={() => setSelectedSimSku(item.sku)}
                disabled={scanning}
              >
                <Text style={[
                  styles.skuChipText,
                  selectedSimSku === item.sku ? styles.skuChipTextActive : null
                ]}>
                  {item.sku} ({item.name.split(' ')[0]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.scanBtn, !selectedSimSku || scanning ? styles.scanBtnDisabled : null]}
            onPress={() => handleSimulateScan(selectedSimSku)}
            disabled={!selectedSimSku || scanning}
          >
            {scanning ? (
              <View style={styles.btnLoadingRow}>
                <RefreshCw size={16} color="#ffffff" style={styles.spinIcon} />
                <Text style={styles.scanBtnText}>Processing Scan...</Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Volume2 size={16} color="#ffffff" />
                <Text style={styles.scanBtnText}>Trigger Scan Beep (+1)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Manual Keyboard input fallback */}
        <View style={styles.manualContainer}>
          <Text style={styles.manualTitle}>Manual SKU Input Fallback</Text>
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Enter SKU manually..."
              placeholderTextColor="#71717a"
              autoCapitalize="characters"
              value={manualSku}
              onChangeText={setManualSku}
              editable={!scanning}
            />
            <TouchableOpacity
              style={[styles.manualBtn, !manualSku || scanning ? styles.manualBtnDisabled : null]}
              onPress={() => handleSimulateScan(manualSku)}
              disabled={!manualSku || scanning}
            >
              <Text style={styles.manualBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    justifyContent: 'space-between',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraBox: {
    width: '100%',
    height: 240,
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  idleLayer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningLayer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    marginBottom: 10,
  },
  viewfinderText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  laserLine: {
    position: 'absolute',
    left: '10%',
    width: '80%',
    height: 2,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#ef4444',
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  consoleContainer: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 16,
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  consoleTitle: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: 'bold',
  },
  consoleSub: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  skuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  skuChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  skuChipActive: {
    borderColor: '#eab308',
    backgroundColor: '#eab30810',
  },
  skuChipText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  skuChipTextActive: {
    color: '#fbbf24',
  },
  scanBtn: {
    height: 48,
    backgroundColor: '#eab308',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnDisabled: {
    backgroundColor: '#27272a',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  spinIcon: {
    // animated spin logic if any
  },
  manualContainer: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
  },
  manualTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 10,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#fafafa',
    fontSize: 13,
  },
  manualBtn: {
    width: 80,
    height: 44,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualBtnDisabled: {
    backgroundColor: '#27272a',
  },
  manualBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
