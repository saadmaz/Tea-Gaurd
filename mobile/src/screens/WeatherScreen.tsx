import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { apiClient } from '../api/client';
import type { WeatherResult } from '../types';

type Props = { navigation: any };

const CATEGORY_ICONS: Record<string, string> = {
  sunny: '☀️', cloudy: '⛅', rainy: '🌧️', stormy: '⛈️',
  'heavy rain': '🌧️', windy: '🌬️', foggy: '🌫️', unknown: '🌡️',
};

export default function WeatherScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await new Promise<{ latitude: number; longitude: number }>((res, rej) =>
        Geolocation.getCurrentPosition(p => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }), rej, { timeout: 10000 }),
      );
      const today = new Date().toISOString().slice(0, 10);
      const res = await apiClient.post('/weather/predict', { ...coords, date: today });
      setWeather(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Failed to fetch weather.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const icon = weather ? (CATEGORY_ICONS[weather.weather_category?.toLowerCase()] ?? '🌡️') : '🌡️';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Weather Forecast</Text>
      <Text style={styles.subtitle}>Based on your current GPS location</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Fetching forecast...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.btn} onPress={fetch}>
            <Text style={styles.btnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : weather ? (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.heroIcon}>{icon}</Text>
            <Text style={styles.heroCategory}>{weather.weather_category}</Text>
            <View style={[styles.fertBadge, { backgroundColor: weather.fertilizer_safe ? '#E8F5E9' : '#FFEBEE' }]}>
              <Text style={{ color: weather.fertilizer_safe ? '#2E7D32' : '#C62828', fontWeight: '700', fontSize: 13 }}>
                {weather.fertilizer_safe ? '✓ Safe for fertilizer' : '✗ Not safe for fertilizer'}
              </Text>
            </View>
            {weather.rain_warning && (
              <View style={styles.rainWarning}>
                <Text style={styles.rainWarningText}>⚠️ Heavy rain predicted today</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Raw Parameters</Text>
          <View style={styles.paramGrid}>
            {[
              { label: 'Precipitation', value: `${weather.raw_params.precipitation.toFixed(1)} mm`, icon: '💧' },
              { label: 'Max Temp', value: `${weather.raw_params.temp_max.toFixed(1)} °C`, icon: '🌡️' },
              { label: 'Min Temp', value: `${weather.raw_params.temp_min.toFixed(1)} °C`, icon: '❄️' },
              { label: 'Humidity (Day)', value: `${weather.raw_params.humidity_day.toFixed(0)}%`, icon: '☀️' },
              { label: 'Humidity (Night)', value: `${weather.raw_params.humidity_night.toFixed(0)}%`, icon: '🌙' },
              { label: 'Wind Speed', value: `${weather.raw_params.wind_speed.toFixed(1)} km/h`, icon: '🌬️' },
            ].map(p => (
              <View key={p.label} style={styles.paramCard}>
                <Text style={styles.paramIcon}>{p.icon}</Text>
                <Text style={styles.paramValue}>{p.value}</Text>
                <Text style={styles.paramLabel}>{p.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={fetch}>
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E3F2FD' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#0D47A1' },
  subtitle: { fontSize: 13, color: '#1565C0', marginTop: 4, marginBottom: 20 },
  center: { alignItems: 'center', paddingTop: 60 },
  loadingText: { marginTop: 12, color: '#1565C0', fontSize: 14 },
  errorText: { color: '#C62828', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  heroCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', elevation: 4, marginBottom: 20 },
  heroIcon: { fontSize: 80 },
  heroCategory: { fontSize: 26, fontWeight: '800', color: '#212121', marginTop: 12, textTransform: 'capitalize' },
  fertBadge: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12 },
  rainWarning: { backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginTop: 10 },
  rainWarningText: { color: '#F57F17', fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  paramGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  paramCard: { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', elevation: 2 },
  paramIcon: { fontSize: 28 },
  paramValue: { fontSize: 18, fontWeight: '800', color: '#0D47A1', marginTop: 6 },
  paramLabel: { fontSize: 11, color: '#9E9E9E', marginTop: 4, textAlign: 'center' },
  btn: { backgroundColor: '#1565C0', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  refreshBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#1565C0' },
  refreshText: { color: '#1565C0', fontWeight: '700', fontSize: 14 },
});
