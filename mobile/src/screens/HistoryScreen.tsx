import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { ConfidenceBadge } from '../components/ResultOverlay';
import type { DetectionRecord, DetectionType } from '../types';

const ICONS: Record<string, string> = {
  disease_blight: '🍂', disease_canker: '🦠', pest_shot_hole: '🦟',
  weather: '⛅', fertilizer: '🌱', healthy: '✅',
};

const TYPE_OPTIONS: { key: DetectionType | ''; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'disease_blight', label: 'Blight' },
  { key: 'disease_canker', label: 'Canker' },
  { key: 'pest_shot_hole', label: 'Pest' },
  { key: 'weather', label: 'Weather' },
  { key: 'fertilizer', label: 'Fertilizer' },
  { key: 'healthy', label: 'Healthy' },
];

export default function HistoryScreen() {
  const [records, setRecords] = useState<DetectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<DetectionType | ''>('');
  const [selected, setSelected] = useState<DetectionRecord | null>(null);
  const PAGE_SIZE = 20;

  const fetch = useCallback(async (p = 1, type = typeFilter, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      let url = `/detections/history?page=${p}&page_size=${PAGE_SIZE}`;
      if (type) url += `&detection_type=${type}`;
      const res = await apiClient.get(url);
      const { results, total: t } = res.data.data;
      setRecords(prev => reset ? results : [...prev, ...results]);
      setTotal(t);
      setPage(p);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [loading, typeFilter]);

  useFocusEffect(useCallback(() => { fetch(1, typeFilter, true); }, [typeFilter]));

  const loadMore = () => {
    if (records.length < total && !loading) fetch(page + 1);
  };

  const setFilter = (type: DetectionType | '') => {
    setTypeFilter(type);
    setRecords([]);
    setPage(1);
  };

  const renderItem = ({ item }: { item: DetectionRecord }) => (
    <TouchableOpacity style={styles.row} onPress={() => setSelected(item)}>
      <Text style={styles.rowIcon}>{ICONS[item.detection_type] ?? '📋'}</Text>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{item.result_label.replace(/_/g, ' ')}</Text>
        <Text style={styles.rowType}>{item.detection_type.replace(/_/g, ' ')}</Text>
        <Text style={styles.rowDate}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {item.confidence !== undefined && (
        <Text style={styles.confText}>{Math.round(item.confidence * 100)}%</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      {/* Filter bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {TYPE_OPTIONS.map(({ key, label }) => (
          <TouchableOpacity
            key={label}
            style={[styles.chip, typeFilter === key && styles.chipActive]}
            onPress={() => setFilter(key as DetectionType | '')}
          >
            <Text style={[styles.chipText, typeFilter === key && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={records}
        keyExtractor={r => r.id}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No records found.</Text> : null
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 20 }} color="#2E7D32" /> : null}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Detail modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <ScrollView>
              <Text style={styles.detailIcon}>{selected ? ICONS[selected.detection_type] ?? '📋' : ''}</Text>
              <Text style={styles.detailLabel}>{selected?.result_label.replace(/_/g, ' ')}</Text>
              <Text style={styles.detailType}>{selected?.detection_type.replace(/_/g, ' ')}</Text>
              {selected?.confidence !== undefined && <ConfidenceBadge confidence={selected.confidence} />}
              {selected?.damage_pct !== undefined && (
                <View style={styles.dmgRow}>
                  <Text style={styles.dmgText}>Damage: {selected.damage_pct.toFixed(1)}%</Text>
                </View>
              )}
              {selected?.latitude !== undefined && (
                <Text style={styles.detailMeta}>📍 {selected.latitude.toFixed(5)}, {selected.longitude?.toFixed(5)}</Text>
              )}
              <Text style={styles.detailMeta}>🕐 {selected ? new Date(selected.created_at).toLocaleString() : ''}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F5' },
  filterBar: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#BDBDBD', backgroundColor: '#fff', marginRight: 8 },
  chipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { fontSize: 13, color: '#757575', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4, borderRadius: 12, padding: 14, elevation: 1 },
  rowIcon: { fontSize: 28, marginRight: 12 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: '#212121', textTransform: 'capitalize' },
  rowType: { fontSize: 11, color: '#9E9E9E', textTransform: 'capitalize', marginTop: 2 },
  rowDate: { fontSize: 11, color: '#BDBDBD', marginTop: 2 },
  confText: { fontSize: 14, fontWeight: '800', color: '#2E7D32' },
  empty: { textAlign: 'center', color: '#9E9E9E', padding: 40, fontSize: 15 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '70%' },
  handle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  detailIcon: { fontSize: 40, textAlign: 'center' },
  detailLabel: { fontSize: 22, fontWeight: '800', color: '#212121', textAlign: 'center', marginTop: 8, textTransform: 'capitalize' },
  detailType: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', textTransform: 'capitalize', marginTop: 4 },
  dmgRow: { backgroundColor: '#FFEBEE', borderRadius: 8, padding: 10, marginTop: 12, alignItems: 'center' },
  dmgText: { color: '#C62828', fontWeight: '700', fontSize: 15 },
  detailMeta: { fontSize: 13, color: '#757575', marginTop: 10, textAlign: 'center' },
  closeBtn: { backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
