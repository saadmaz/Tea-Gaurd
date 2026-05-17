import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { apiClient } from '../api/client';
import { SensorInput } from '../components/SensorInput';
import { WeatherBanner } from '../components/WeatherBanner';
import type { FertilizerResult, SensorReading, WeatherResult } from '../types';

const CULTIVARS = ['TRI 2025', 'TRI 2043', 'TRI 3025', 'TRI 4042', 'DN', 'Other'];

type Props = { navigation: any };

export default function FertilizerScreen({ navigation }: Props) {
  const [tab, setTab] = useState<'iot' | 'manual'>('manual');
  const [values, setValues] = useState({ nitrogen: '', phosphorus: '', potassium: '', ph_level: '' });
  const [cultivar, setCultivar] = useState(CULTIVARS[0]);
  const [iotReading, setIotReading] = useState<SensorReading | null>(null);
  const [iotLoading, setIotLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FertilizerResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const getCoords = (): Promise<{ latitude: number; longitude: number }> =>
    new Promise((res, rej) =>
      Geolocation.getCurrentPosition(p => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }), rej, { timeout: 8000 }),
    );

  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      const coords = await getCoords();
      const today = new Date().toISOString().slice(0, 10);
      const res = await apiClient.post('/weather/predict', { ...coords, date: today });
      setWeather(res.data.data);
    } catch {
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchWeather(); }, []);

  const fetchIoT = async () => {
    setIotLoading(true);
    try {
      const res = await apiClient.get('/sensor/latest');
      const reading = res.data.data;
      setIotReading(reading);
      setValues({
        nitrogen: String(reading.nitrogen),
        phosphorus: String(reading.phosphorus),
        potassium: String(reading.potassium),
        ph_level: String(reading.ph_level),
      });
    } catch (err: any) {
      Alert.alert('Error', 'Could not fetch sensor data.');
    } finally {
      setIotLoading(false);
    }
  };

  const handleRecommend = async () => {
    const n = parseFloat(values.nitrogen);
    const p = parseFloat(values.phosphorus);
    const k = parseFloat(values.potassium);
    const ph = parseFloat(values.ph_level);
    if ([n, p, k, ph].some(isNaN)) {
      Alert.alert('Error', 'Enter valid numeric values for all nutrient fields.');
      return;
    }
    setLoading(true);
    try {
      let coords = { latitude: 0, longitude: 0 };
      try { coords = await getCoords(); } catch { }
      const res = await apiClient.post('/fertilizer/recommend', {
        nitrogen: n, phosphorus: p, potassium: k, ph_level: ph,
        plant_type: 'tea', cultivar,
        ...coords,
        sensor_reading_id: tab === 'iot' && iotReading ? iotReading.id : null,
      });
      setResult(res.data.data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message ?? 'Recommendation failed.');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = { low: '#C62828', optimal: '#2E7D32', high: '#F57F17' };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Fertilizer Recommendation</Text>

      <WeatherBanner weather={weather ?? undefined} loading={weatherLoading} />

      {/* Tab selector */}
      <View style={styles.tabBar}>
        {(['manual', 'iot'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'manual' ? 'Manual Entry' : 'IoT Sensor'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SensorInput
        mode={tab}
        values={values}
        onChange={(f, v) => setValues(prev => ({ ...prev, [f]: v }))}
        iotReading={iotReading ?? undefined}
        onFetchIoT={fetchIoT}
        iotLoading={iotLoading}
      />

      {/* Cultivar selector */}
      <Text style={styles.fieldLabel}>Cultivar</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cultivarScroll}>
        {CULTIVARS.map(c => (
          <TouchableOpacity key={c} style={[styles.chip, cultivar === c && styles.chipActive]} onPress={() => setCultivar(c)}>
            <Text style={[styles.chipText, cultivar === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.btn} onPress={handleRecommend} disabled={loading}>
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color="#fff" />
            <Text style={[styles.btnText, { marginLeft: 10 }]}>Analyzing...</Text>
          </View>
        ) : (
          <Text style={styles.btnText}>Get Recommendation</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={styles.resultCard}>
          {!result.application_safe && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>⚠️ Application not recommended due to weather conditions.</Text>
            </View>
          )}
          <Text style={styles.fertType}>{result.fertilizer_type}</Text>
          <Text style={styles.fertQty}>{result.quantity_kg_ha.toFixed(1)} kg/ha</Text>
          <View style={[styles.safeBadge, { backgroundColor: result.application_safe ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={{ color: result.application_safe ? '#2E7D32' : '#C62828', fontWeight: '700' }}>
              {result.application_safe ? '✓ Safe to Apply' : '✗ Not Recommended Today'}
            </Text>
          </View>

          <TouchableOpacity style={styles.expandToggle} onPress={() => setExpanded(e => !e)}>
            <Text style={styles.expandToggleText}>{expanded ? '▲ Hide' : '▼ Show'} Reasoning</Text>
          </TouchableOpacity>

          {expanded && (
            <View style={styles.reasoning}>
              {Object.entries({
                'Nitrogen': result.reasoning.nitrogen_status,
                'Phosphorus': result.reasoning.phosphorus_status,
                'Potassium': result.reasoning.potassium_status,
                'pH': result.reasoning.ph_status,
              }).map(([k, v]) => (
                <View key={k} style={styles.reasonRow}>
                  <Text style={styles.reasonKey}>{k}</Text>
                  <Text style={[styles.reasonVal, { color: STATUS_COLORS[v] ?? '#424242' }]}>{v}</Text>
                </View>
              ))}
              <View style={styles.reasonRow}>
                <Text style={styles.reasonKey}>Weather</Text>
                <Text style={styles.reasonVal}>{result.reasoning.weather_factor}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F8E9' },
  container: { paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#1B5E20', padding: 20, paddingBottom: 8 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, backgroundColor: '#E8F5E9', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#2E7D32' },
  tabText: { fontWeight: '600', color: '#558B2F' },
  tabTextActive: { color: '#fff' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#424242', marginLeft: 16, marginTop: 16, marginBottom: 8 },
  cultivarScroll: { paddingLeft: 16, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#BDBDBD', marginRight: 8 },
  chipActive: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  chipText: { fontSize: 13, color: '#757575' },
  chipTextActive: { color: '#2E7D32', fontWeight: '700' },
  btn: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultCard: { margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 3 },
  warningBanner: { backgroundColor: '#FFF8E1', borderRadius: 8, padding: 12, marginBottom: 12 },
  warningText: { color: '#F57F17', fontSize: 13 },
  fertType: { fontSize: 22, fontWeight: '800', color: '#212121' },
  fertQty: { fontSize: 32, fontWeight: '800', color: '#2E7D32', marginTop: 4 },
  safeBadge: { borderRadius: 8, padding: 10, marginTop: 12, alignItems: 'center' },
  expandToggle: { marginTop: 12, alignItems: 'center', padding: 8 },
  expandToggleText: { color: '#2E7D32', fontWeight: '600', fontSize: 13 },
  reasoning: { borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 8, paddingTop: 8 },
  reasonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  reasonKey: { fontSize: 13, color: '#757575' },
  reasonVal: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
});
