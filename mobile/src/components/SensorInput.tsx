import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { SensorReading } from '../types';

// Thresholds per spec (UI color coding only, not model logic)
const N_THRESHOLD = { low: 20, high: 40 };
const P_THRESHOLD = { low: 10, high: 25 };
const K_THRESHOLD = { low: 80, high: 200 };
const PH_THRESHOLD = { low: 4.5, high: 6.0 };

type Status = 'low' | 'optimal' | 'high';

function getStatus(value: number, low: number, high: number): Status {
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'optimal';
}

const STATUS_COLORS: Record<Status, string> = { low: '#C62828', optimal: '#2E7D32', high: '#F57F17' };

interface NutrientRowProps {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  unit: string;
  status?: Status;
  editable?: boolean;
}

const NutrientRow: React.FC<NutrientRowProps> = ({ label, value, onChangeText, unit, status, editable = true }) => {
  const color = status ? STATUS_COLORS[status] : '#757575';
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {editable ? (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
            placeholder="0"
          />
        ) : (
          <Text style={styles.staticValue}>{value}</Text>
        )}
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {status && (
        <View style={[styles.statusDot, { backgroundColor: color }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}
    </View>
  );
};

interface SensorInputProps {
  mode: 'manual' | 'iot';
  values: { nitrogen: string; phosphorus: string; potassium: string; ph_level: string };
  onChange?: (field: string, value: string) => void;
  iotReading?: SensorReading;
  onFetchIoT?: () => void;
  iotLoading?: boolean;
}

export const SensorInput: React.FC<SensorInputProps> = ({ mode, values, onChange, iotReading, onFetchIoT, iotLoading }) => {
  const n = parseFloat(values.nitrogen);
  const p = parseFloat(values.phosphorus);
  const k = parseFloat(values.potassium);
  const ph = parseFloat(values.ph_level);

  if (mode === 'iot') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.fetchButton} onPress={onFetchIoT} disabled={iotLoading}>
          {iotLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.fetchText}>Fetch Latest Reading</Text>}
        </TouchableOpacity>
        {iotReading && (
          <>
            <Text style={styles.timestamp}>Last updated: {new Date(iotReading.created_at).toLocaleString()}</Text>
            <NutrientRow label="Nitrogen (N)" value={iotReading.nitrogen.toFixed(1)} unit="mg/kg" status={getStatus(iotReading.nitrogen, N_THRESHOLD.low, N_THRESHOLD.high)} editable={false} />
            <NutrientRow label="Phosphorus (P)" value={iotReading.phosphorus.toFixed(1)} unit="mg/kg" status={getStatus(iotReading.phosphorus, P_THRESHOLD.low, P_THRESHOLD.high)} editable={false} />
            <NutrientRow label="Potassium (K)" value={iotReading.potassium.toFixed(1)} unit="mg/kg" status={getStatus(iotReading.potassium, K_THRESHOLD.low, K_THRESHOLD.high)} editable={false} />
            <NutrientRow label="pH Level" value={iotReading.ph_level.toFixed(2)} unit="" status={getStatus(iotReading.ph_level, PH_THRESHOLD.low, PH_THRESHOLD.high)} editable={false} />
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NutrientRow label="Nitrogen (N)" value={values.nitrogen} onChangeText={v => onChange?.('nitrogen', v)} unit="mg/kg" status={!isNaN(n) && values.nitrogen !== '' ? getStatus(n, N_THRESHOLD.low, N_THRESHOLD.high) : undefined} />
      <NutrientRow label="Phosphorus (P)" value={values.phosphorus} onChangeText={v => onChange?.('phosphorus', v)} unit="mg/kg" status={!isNaN(p) && values.phosphorus !== '' ? getStatus(p, P_THRESHOLD.low, P_THRESHOLD.high) : undefined} />
      <NutrientRow label="Potassium (K)" value={values.potassium} onChangeText={v => onChange?.('potassium', v)} unit="mg/kg" status={!isNaN(k) && values.potassium !== '' ? getStatus(k, K_THRESHOLD.low, K_THRESHOLD.high) : undefined} />
      <NutrientRow label="pH Level" value={values.ph_level} onChangeText={v => onChange?.('ph_level', v)} unit="" status={!isNaN(ph) && values.ph_level !== '' ? getStatus(ph, PH_THRESHOLD.low, PH_THRESHOLD.high) : undefined} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { flex: 1, fontSize: 14, color: '#424242' },
  inputWrap: { flexDirection: 'row', alignItems: 'center' },
  input: { width: 70, borderWidth: 1, borderColor: '#BDBDBD', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 14, textAlign: 'right', color: '#212121' },
  staticValue: { fontSize: 14, fontWeight: '600', color: '#212121', minWidth: 70, textAlign: 'right' },
  unit: { fontSize: 12, color: '#9E9E9E', marginLeft: 4, width: 45 },
  statusDot: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  statusText: { fontSize: 10, color: '#fff', fontWeight: '600', textTransform: 'uppercase' },
  fetchButton: { backgroundColor: '#2E7D32', borderRadius: 10, padding: 14, alignItems: 'center', marginVertical: 12 },
  fetchText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  timestamp: { fontSize: 11, color: '#9E9E9E', textAlign: 'center', marginBottom: 8 },
});
