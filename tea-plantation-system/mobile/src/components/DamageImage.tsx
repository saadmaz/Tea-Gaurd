import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface DamageImageProps {
  originalUri?: string;
  annotatedUri?: string;
  damagePct?: number;
}

export const DamageImage: React.FC<DamageImageProps> = ({ originalUri, annotatedUri, damagePct }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const uri = annotatedUri || originalUri;

  if (!uri) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No image available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator style={StyleSheet.absoluteFill} color="#2E7D32" />}
      <Image
        source={{ uri }}
        style={styles.image}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        resizeMode="contain"
      />
      {error && (
        <View style={[StyleSheet.absoluteFill, styles.errorOverlay]}>
          <Text style={styles.errorText}>Image unavailable</Text>
        </View>
      )}
      {annotatedUri && damagePct !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Damage: {damagePct.toFixed(1)}%</Text>
        </View>
      )}
      {annotatedUri && (
        <View style={styles.annotatedBadge}>
          <Text style={styles.annotatedText}>🔴 Annotated</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 1, backgroundColor: '#F5F5F5', borderRadius: 12, overflow: 'hidden', marginVertical: 8 },
  image: { width: '100%', height: '100%' },
  placeholder: { width: '100%', aspectRatio: 1, backgroundColor: '#EEEEEE', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#9E9E9E', fontSize: 14 },
  errorOverlay: { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 14 },
  badge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(198,40,40,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  annotatedBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  annotatedText: { color: '#fff', fontSize: 11 },
});
