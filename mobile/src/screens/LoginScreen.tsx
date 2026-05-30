import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Package, Mail, Lock, ShieldCheck } from 'lucide-react-native';

interface LoginScreenProps {
  onLoginSuccess: (user: { name: string; email: string; role: 'admin' | 'staff' | 'supplier' }) => void;
}

export const LoginScreen = ({ onLoginSuccess }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (selectedEmail?: string, selectedPassword?: string) => {
    const finalEmail = selectedEmail || email;
    const finalPassword = selectedPassword || password;

    if (!finalEmail || !finalPassword) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    // Simulate database auth call
    setTimeout(() => {
      setLoading(false);
      
      if (finalEmail === 'admin@logiflow.com' && finalPassword === 'admin123') {
        onLoginSuccess({
          name: 'System Admin',
          email: finalEmail,
          role: 'admin'
        });
      } else if (finalEmail === 'staff@logiflow.com' && finalPassword === 'staff123') {
        onLoginSuccess({
          name: 'Warehouse Operator',
          email: finalEmail,
          role: 'staff'
        });
      } else if (finalEmail === 'supplier@logiflow.com' && finalPassword === 'supplier123') {
        onLoginSuccess({
          name: 'Partner Supplier',
          email: finalEmail,
          role: 'supplier'
        });
      } else {
        Alert.alert('Authentication Failed', 'Invalid credentials. Please use demo buttons or correct accounts.');
      }
    }, 800);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* App Branding logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBg}>
            <Package size={44} color="#3b82f6" />
          </View>
          <Text style={styles.title}>LogiFlow</Text>
          <Text style={styles.subtitle}>Inventory Management Mobile Hub</Text>
        </View>

        {/* Input fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Mail size={18} color="#71717a" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#71717a"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={18} color="#71717a" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#71717a"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Demo Credentials shortcuts */}
        <View style={styles.demoContainer}>
          <View style={styles.demoTitleRow}>
            <ShieldCheck size={14} color="#3b82f6" />
            <Text style={styles.demoTitle}>Developer Access shortcuts</Text>
          </View>

          <View style={styles.demoButtonsRow}>
            <TouchableOpacity 
              style={[styles.demoButton, { borderColor: '#ef4444' }]}
              onPress={() => handleLogin('admin@logiflow.com', 'admin123')}
            >
              <Text style={[styles.demoButtonText, { color: '#ef4444' }]}>Admin Demo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.demoButton, { borderColor: '#10b981' }]}
              onPress={() => handleLogin('staff@logiflow.com', 'staff123')}
            >
              <Text style={[styles.demoButtonText, { color: '#10b981' }]}>Staff Demo</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.demoButton, styles.supplierDemoButton]}
            onPress={() => handleLogin('supplier@logiflow.com', 'supplier123')}
          >
            <Text style={[styles.demoButtonText, { color: '#eab308' }]}>Supplier Partner Demo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b', // Sleek zinc-950 dark background
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1d4ed81a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3b82f633',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 4,
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#18181b', // Zinc-900 inputs
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fafafa',
    fontSize: 15,
  },
  button: {
    height: 52,
    backgroundColor: '#2563eb', // Blue-600 action buttons
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2563eb',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoContainer: {
    marginTop: 45,
    padding: 16,
    backgroundColor: '#09090b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  demoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  demoTitle: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginLeft: 6,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  demoButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  supplierDemoButton: {
    width: '100%',
    marginTop: 10,
    borderColor: '#eab308',
  },
  demoButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
