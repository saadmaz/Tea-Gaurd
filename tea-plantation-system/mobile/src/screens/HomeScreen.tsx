import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { SummaryCard } from '../components/SummaryCard';
import { WeatherBanner } from '../components/WeatherBanner';
import type { WeatherResult, DetectionRecord, FertilizerResult } from '../types';
import { useFocusEffect } from '@react-navigation/native';

type Props = { navigation: any };

export default function HomeScreen({ navigation }: Props) {
  const { state: authState, dispatch } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [lastDetection, setLastDetection] = useState<DetectionRecord | null>(null);
  const [detectionLoading, setDetectionLoading] = useState(false);
  const [lastFertilizer, setLastFertilizer] = useState<DetectionRecord | null>(null);
  const [fertLoading, setFertLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    // Fetch last detection
    setDetectionLoading(true);
    setFertLoading(true);
    try {
      const det = await apiClient.get('/detections/history?page_size=1');
      setLastDetection(det.data.data?.results?.[0] ?? null);
    } catch {
      setLastDetection(null);
    } finally {
      setDetectionLoading(false);
    }

    try {
      const fert = await apiClient.get('/detections/history?detection_type=fertilizer&page_size=1');
      setLastFertilizer(fert.data.data?.results?.[0] ?? null);
    } catch {
      setLastFertilizer(null);
    } finally {
      setFertLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch({ type: 'LOGOUT' }) },
    ]);
  };

  const quickActions = [
    { label: 'Disease', icon: '🔬', screen: 'DiseaseDetection', color: '#C62828' },
    { label: 'Pest', icon: '🦟', screen: 'PestDetection', color: '#E65100' },
    { label: 'Fertilizer', icon: '🌱', screen: 'Fertilizer', color: '#1B5E20' },
    { label: 'Map', icon: '🗺️', screen: 'Map', color: '#0D47A1' },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, {authState.user?.full_name?.split(' ')[0] ?? 'Grower'}</Text>
          <Text style={styles.subGreeting}>Your plantation at a glance</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>⏻</Text>
        </TouchableOpacity>
      </View>

      <WeatherBanner weather={weather ?? undefined} loading={weatherLoading} />

      {/* Summary cards */}
      <Text style={styles.sectionTitle}>Summary</Text>
      <SummaryCard
        title="Last Detection"
        value={lastDetection ? lastDetection.result_label : 'No detections yet'}
        subtitle={lastDetection ? new Date(lastDetection.created_at).toLocaleDateString() : undefined}
        loading={detectionLoading}
        accentColor="#2E7D32"
        onPress={() => navigation.navigate('History')}
      />
      <SummaryCard
        title="Last Fertilizer Rec."
        value={lastFertilizer?.metadata?.fertilizer_type ?? (lastFertilizer ? lastFertilizer.result_label : 'None')}
        subtitle={lastFertilizer ? new Date(lastFertilizer.created_at).toLocaleDateString() : undefined}
        loading={fertLoading}
        accentColor="#1565C0"
        onPress={() => navigation.navigate('Fertilizer')}
      />

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickRow}>
        {quickActions.map(({ label, icon, screen, color }) => (
          <TouchableOpacity key={screen} style={[styles.quickBtn, { borderColor: color }]} onPress={() => navigation.navigate(screen)}>
            <Text style={styles.quickIcon}>{icon}</Text>
            <Text style={[styles.quickLabel, { color }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History button */}
      <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('History')}>
        <Text style={styles.historyText}>📋 View Full History</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F8E9' },
  container: { paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  subGreeting: { fontSize: 13, color: '#558B2F', marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { fontSize: 22, color: '#757575' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 20, marginTop: 20, marginBottom: 8 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  quickBtn: { flex: 1, marginHorizontal: 4, alignItems: 'center', paddingVertical: 16, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, elevation: 1 },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  historyBtn: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', elevation: 1, borderWidth: 1, borderColor: '#E0E0E0' },
  historyText: { color: '#424242', fontWeight: '600', fontSize: 14 },
});
