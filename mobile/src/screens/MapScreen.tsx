import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  Modal, Image,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { apiClient } from '../api/client';
import { InfectionMarker } from '../components/InfectionMarker';
import type { MapMarker } from '../types';

type FilterType = 'all' | 'disease' | 'pest' | 'healthy';
type DayRange = 7 | 30 | 90;

type Props = { navigation: any };

export default function MapScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [days, setDays] = useState<DayRange>(30);
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 7.8731, longitude: 80.7718, latitudeDelta: 0.5, longitudeDelta: 0.5,
  });

  useEffect(() => {
    Geolocation.getCurrentPosition(
      p => setRegion({ latitude: p.coords.latitude, longitude: p.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }),
      () => {},
      { timeout: 6000 },
    );
  }, []);

  useEffect(() => { fetchMarkers(); }, [filter, days]);

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const type = filter === 'all' ? '' : `&detection_type=${filter}`;
      const res = await apiClient.get(`/map/markers?days=${days}${type}`);
      setMarkers(res.data.data ?? []);
    } catch {
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  };

  const FILTER_CHIPS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'disease', label: 'Disease' },
    { key: 'pest', label: 'Pest' },
    { key: 'healthy', label: 'Healthy' },
  ];

  const DAY_OPTS: DayRange[] = [7, 30, 90];

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} region={region} onRegionChangeComplete={setRegion}>
        {markers.map(m => (
          <InfectionMarker key={m.id} marker={m} onPress={setSelected} />
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#2E7D32" />
        </View>
      )}

      {/* Top controls */}
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTER_CHIPS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, filter === key && styles.chipActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          {DAY_OPTS.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, days === d && styles.chipActiveDays]}
              onPress={() => setDays(d)}
            >
              <Text style={[styles.chipText, days === d && styles.chipTextActive]}>{d}d</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom sheet for selected marker */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelected(null)}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetType}>{selected?.detection_type?.replace(/_/g, ' ')}</Text>
            <Text style={styles.sheetLabel}>{selected?.label}</Text>
            {selected?.damage_pct !== undefined && (
              <Text style={styles.sheetDmg}>Damage: {selected.damage_pct.toFixed(1)}%</Text>
            )}
            <Text style={styles.sheetDate}>
              {selected ? new Date(selected.created_at).toLocaleString() : ''}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loadingOverlay: { position: 'absolute', top: 120, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 12 },
  controls: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 48, paddingBottom: 8, backgroundColor: 'rgba(255,255,255,0.95)' },
  filterRow: { paddingHorizontal: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#BDBDBD', marginRight: 8 },
  chipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipActiveDays: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  chipText: { fontSize: 13, color: '#757575', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  divider: { width: 1, backgroundColor: '#E0E0E0', marginRight: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetType: { fontSize: 12, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.5 },
  sheetLabel: { fontSize: 22, fontWeight: '800', color: '#212121', marginTop: 4, textTransform: 'capitalize' },
  sheetDmg: { fontSize: 15, color: '#C62828', fontWeight: '700', marginTop: 6 },
  sheetDate: { fontSize: 13, color: '#757575', marginTop: 6 },
  closeBtn: { marginTop: 20, backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
