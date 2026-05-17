import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  onPress?: () => void;
  accentColor?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  loading = false,
  error,
  onPress,
  accentColor = '#2E7D32',
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {loading ? (
          <ActivityIndicator color={accentColor} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  accent: { width: 6 },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 12, color: '#757575', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  subtitle: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  error: { fontSize: 13, color: '#C62828', marginTop: 4 },
});
