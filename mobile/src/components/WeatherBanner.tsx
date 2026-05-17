import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WeatherResult } from '../types';

interface WeatherBannerProps {
  weather?: WeatherResult;
  loading?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  sunny: '☀️', cloudy: '⛅', rainy: '🌧️', stormy: '⛈️',
  'heavy rain': '🌧️', windy: '🌬️', foggy: '🌫️', unknown: '🌡️',
};

export const WeatherBanner: React.FC<WeatherBannerProps> = ({ weather, loading }) => {
  if (loading) {
    return (
      <View style={[styles.banner, styles.neutral]}>
        <Text style={styles.text}>Fetching weather...</Text>
      </View>
    );
  }

  if (!weather) return null;

  const isWarning = weather.rain_warning;
  const icon = CATEGORY_ICONS[weather.weather_category?.toLowerCase()] ?? '🌡️';

  return (
    <View style={[styles.banner, isWarning ? styles.warning : styles.safe]}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textBlock}>
        <Text style={styles.category}>{weather.weather_category}</Text>
        {isWarning ? (
          <Text style={styles.text}>Heavy rain predicted. Fertilizer application not recommended today.</Text>
        ) : (
          <Text style={styles.text}>Conditions suitable for fertilizer application.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginHorizontal: 16, marginVertical: 8 },
  warning: { backgroundColor: '#FFF8E1', borderLeftWidth: 4, borderLeftColor: '#F9A825' },
  safe: { backgroundColor: '#E8F5E9', borderLeftWidth: 4, borderLeftColor: '#2E7D32' },
  neutral: { backgroundColor: '#E3F2FD', borderLeftWidth: 4, borderLeftColor: '#1565C0' },
  icon: { fontSize: 28, marginRight: 12 },
  textBlock: { flex: 1 },
  category: { fontWeight: '700', fontSize: 14, color: '#212121' },
  text: { fontSize: 12, color: '#424242', marginTop: 2 },
});
