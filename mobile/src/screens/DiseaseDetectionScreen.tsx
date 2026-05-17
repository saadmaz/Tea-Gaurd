import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, Image, Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import { uploadFile, apiClient } from '../api/client';
import { DamageImage } from '../components/DamageImage';
import { ConfidenceBadge } from '../components/ResultOverlay';
import type { DiseaseResult } from '../types';

type Props = { navigation: any };

export default function DiseaseDetectionScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);

  const pickFromCamera = () => {
    launchCamera({ mediaType: 'photo', quality: 0.85, saveToPhotos: false }, res => {
      if (res.assets?.[0]?.uri) {
        setImageUri(res.assets[0].uri);
        setResult(null);
      }
    });
  };

  const pickFromGallery = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.85 }, res => {
      if (res.assets?.[0]?.uri) {
        setImageUri(res.assets[0].uri);
        setResult(null);
      }
    });
  };

  const getCoords = (): Promise<{ latitude: number; longitude: number }> =>
    new Promise((resolve, reject) =>
      Geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => reject(err),
        { enableHighAccuracy: false, timeout: 8000 },
      ),
    );

  const handleSubmit = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      let coords = { latitude: 0, longitude: 0 };
      try { coords = await getCoords(); } catch { /* use 0,0 fallback */ }

      const res = await uploadFile('/disease/detect', imageUri, coords);
      setResult(res.data.data);
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'INVALID_FILE_TYPE') {
        Alert.alert('Error', 'Only JPEG/PNG images are supported.');
      } else if (code === 'IMAGE_TOO_SMALL') {
        Alert.alert('Error', 'Image is too small (min 100×100px).');
      } else {
        Alert.alert('Error', err.response?.data?.error?.message ?? 'Analysis failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setImageUri(null); setResult(null); };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Disease Detection</Text>
      <Text style={styles.subtitle}>Capture or upload a leaf/stem image</Text>

      {!result ? (
        <>
          {imageUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
              <TouchableOpacity onPress={reset} style={styles.clearBtn}>
                <Text style={styles.clearText}>✕ Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={pickFromCamera}>
              <Text style={styles.btnSecondaryText}>📷 Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={pickFromGallery}>
              <Text style={styles.btnSecondaryText}>🖼 Gallery</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={[styles.btnText, { marginLeft: 10 }]}>Analyzing image...</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>Analyze</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>{result.label.replace(/_/g, ' ')}</Text>
          <ConfidenceBadge confidence={result.confidence} />

          {result.is_diseased && result.damage_pct !== undefined && (
            <View style={styles.damageRow}>
              <Text style={styles.damageLabel}>Damage Area</Text>
              <Text style={styles.damageValue}>{result.damage_pct.toFixed(1)}%</Text>
            </View>
          )}

          <DamageImage
            originalUri={imageUri ?? undefined}
            annotatedUri={result.annotated_image_url ?? undefined}
            damagePct={result.damage_pct}
          />

          {result.label === 'nutrient_deficiency' && (
            <View style={styles.advisory}>
              <Text style={styles.advisoryText}>
                ⚠️ This may be a nutrient deficiency, not a disease. Compare with fertilizer recommendations.
              </Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, { flex: 1, marginRight: 6 }]} onPress={() => navigation.navigate('Map')}>
              <Text style={styles.btnText}>🗺 Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary, { flex: 1, marginLeft: 6 }]} onPress={reset}>
              <Text style={styles.btnSecondaryText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F8E9' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  subtitle: { fontSize: 13, color: '#558B2F', marginTop: 4, marginBottom: 16 },
  placeholder: { width: '100%', aspectRatio: 1, backgroundColor: '#E8F5E9', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  placeholderIcon: { fontSize: 64 },
  placeholderText: { color: '#9E9E9E', fontSize: 15, marginTop: 8 },
  previewWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  preview: { width: '100%', aspectRatio: 1, borderRadius: 16 },
  clearBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  clearText: { color: '#fff', fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btn: { flex: 1, backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#2E7D32' },
  btnSecondaryText: { color: '#2E7D32', fontWeight: '700', fontSize: 15 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  resultCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 3 },
  resultLabel: { fontSize: 20, fontWeight: '800', color: '#212121', textTransform: 'capitalize' },
  damageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, backgroundColor: '#FFEBEE', padding: 12, borderRadius: 10 },
  damageLabel: { fontSize: 14, color: '#C62828' },
  damageValue: { fontSize: 22, fontWeight: '800', color: '#C62828' },
  advisory: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginTop: 12 },
  advisoryText: { color: '#E65100', fontSize: 13 },
});
