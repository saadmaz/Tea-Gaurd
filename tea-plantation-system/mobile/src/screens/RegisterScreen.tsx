import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

type Props = { navigation: any };

export default function RegisterScreen({ navigation }: Props) {
  const { dispatch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirmPassword: '',
    estate_name: '', district: '', latitude: '', longitude: '', cultivar_type: '',
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleRegister = async () => {
    if (!form.full_name || !form.email || !form.password || !form.estate_name || !form.district) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    const lat = parseFloat(form.latitude);
    const lon = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Error', 'Enter valid GPS coordinates.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        full_name: form.full_name.trim(),
        estate_name: form.estate_name.trim(),
        district: form.district.trim(),
        latitude: lat,
        longitude: lon,
        cultivar_type: form.cultivar_type.trim() || undefined,
      });
      const { token, user_id } = res.data.data;
      // After register, log in to get full user object
      const loginRes = await apiClient.post('/auth/login', { email: form.email.trim().toLowerCase(), password: form.password });
      const { user } = loginRes.data.data;
      dispatch({ type: 'LOGIN', token, user });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Registration failed.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Set up your estate profile</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          {[
            { field: 'full_name', label: 'Full Name *', placeholder: 'Kamal Perera', keyboard: 'default' as const },
            { field: 'email', label: 'Email *', placeholder: 'kamal@estate.lk', keyboard: 'email-address' as const },
            { field: 'password', label: 'Password *', placeholder: '••••••••', keyboard: 'default' as const, secure: true },
            { field: 'confirmPassword', label: 'Confirm Password *', placeholder: '••••••••', keyboard: 'default' as const, secure: true },
          ].map(({ field, label, placeholder, keyboard, secure }) => (
            <View key={field}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#BDBDBD"
                value={(form as any)[field]}
                onChangeText={v => set(field, v)}
                keyboardType={keyboard}
                autoCapitalize={field === 'email' ? 'none' : 'words'}
                secureTextEntry={secure}
              />
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Estate Details</Text>
          {[
            { field: 'estate_name', label: 'Estate Name *', placeholder: 'Nuwara Eliya Tea Estate', keyboard: 'default' as const },
            { field: 'district', label: 'District *', placeholder: 'Nuwara Eliya', keyboard: 'default' as const },
            { field: 'latitude', label: 'Latitude *', placeholder: '6.9734', keyboard: 'numeric' as const },
            { field: 'longitude', label: 'Longitude *', placeholder: '80.7832', keyboard: 'numeric' as const },
            { field: 'cultivar_type', label: 'Cultivar Type', placeholder: 'TRI 2025', keyboard: 'default' as const },
          ].map(({ field, label, placeholder, keyboard }) => (
            <View key={field}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#BDBDBD"
                value={(form as any)[field]}
                onChangeText={v => set(field, v)}
                keyboardType={keyboard}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F1F8E9' },
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#1B5E20' },
  subtitle: { fontSize: 14, color: '#558B2F', marginTop: 4 },
  form: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#424242', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#212121', backgroundColor: '#FAFAFA' },
  button: { backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { alignItems: 'center', marginTop: 14 },
  linkText: { color: '#757575', fontSize: 14 },
  linkBold: { color: '#2E7D32', fontWeight: '700' },
});
