import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Geolocation from '@react-native-community/geolocation';
import { uploadFile } from '../api/client';
import { ConfidenceBadge } from '../components/ResultOverlay';
import type { PestResult } from '../types';

type Props = { navigation: any };

const audioRecorderPlayer = new AudioRecorderPlayer();

export default function PestDetectionScreen({ navigation }: Props) {
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PestResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const path = await audioRecorderPlayer.startRecorder(undefined, { AVFormatIDKeyIOS: 'lpcm', AVSampleRateKeyIOS: 16000, AVNumberOfChannelsKeyIOS: 1 });
      setAudioPath(path);
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 0.1), 100);
    } catch (e) {
      Alert.alert('Error', 'Could not start recording. Check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await audioRecorderPlayer.stopRecorder();
    setRecording(false);
    if (duration < 1) {
      Alert.alert('Too Short', 'Recording must be at least 1 second.');
      setDuration(0);
      setAudioPath(null);
      return;
    }
    setRecorded(true);
  };

  const playAudio = async () => {
    if (!audioPath) return;
    setPlaying(true);
    await audioRecorderPlayer.startPlayer(audioPath);
    audioRecorderPlayer.addPlayBackListener(e => {
      if (e.currentPosition >= e.duration) {
        audioRecorderPlayer.stopPlayer();
        setPlaying(false);
      }
    });
  };

  const stopPlayback = async () => {
    await audioRecorderPlayer.stopPlayer();
    setPlaying(false);
  };

  const getCoords = (): Promise<{ latitude: number; longitude: number }> =>
    new Promise((res, rej) =>
      Geolocation.getCurrentPosition(p => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }), rej, { timeout: 8000 }),
    );

  const handleSubmit = async () => {
    if (!audioPath) return;
    setLoading(true);
    try {
      let coords = { latitude: 0, longitude: 0 };
      try { coords = await getCoords(); } catch { }
      const res = await uploadFile('/pest/detect', audioPath, coords, 'audio');
      setResult(res.data.data);
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'INVALID_AUDIO_FORMAT') Alert.alert('Error', 'Only WAV audio files are supported.');
      else if (code === 'AUDIO_TOO_SHORT') Alert.alert('Error', 'Audio too short (minimum 1 second).');
      else Alert.alert('Error', err.response?.data?.error?.message ?? 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setRecorded(false); setAudioPath(null); setDuration(0); setResult(null); };

  if (result) {
    const isInfested = result.label === 'infested';
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Pest Analysis Result</Text>
        <View style={[styles.resultCard, { borderLeftColor: isInfested ? '#C62828' : '#2E7D32' }]}>
          <Text style={[styles.resultLabel, { color: isInfested ? '#C62828' : '#2E7D32' }]}>
            {isInfested ? '⚠️ Infested' : '✓ Not Infested'}
          </Text>
          <ConfidenceBadge confidence={result.confidence} />
          {isInfested && (
            <View style={styles.recommendation}>
              <Text style={styles.recTitle}>TRI Protocol Recommendation</Text>
              <Text style={styles.recText}>{result.recommendation}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.btn} onPress={reset}>
            <Text style={styles.btnText}>Test Another Sample</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary, { marginTop: 8 }]} onPress={() => navigation.navigate('Map')}>
            <Text style={styles.btnSecondaryText}>View on Map</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pest Detection</Text>
      <Text style={styles.subtitle}>Record ambient sound near affected plants</Text>

      <View style={styles.waveContainer}>
        <Text style={styles.waveIcon}>{recording ? '🎙️' : recorded ? '✅' : '🎤'}</Text>
        <Text style={styles.durationText}>{duration.toFixed(1)}s</Text>
        {recording && (
          <View style={styles.waveform}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={[styles.bar, { height: Math.random() * 30 + 10 }]} />
            ))}
          </View>
        )}
      </View>

      {!recorded ? (
        <TouchableOpacity
          style={[styles.recordBtn, recording && styles.recordBtnActive]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Text style={styles.recordBtnText}>{recording ? 'Release to Stop' : 'Hold to Record'}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary, { flex: 1, marginRight: 6 }]} onPress={playing ? stopPlayback : playAudio}>
              <Text style={styles.btnSecondaryText}>{playing ? '⏹ Stop' : '▶ Play'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary, { flex: 1, marginLeft: 6 }]} onPress={reset}>
              <Text style={styles.btnSecondaryText}>🔄 Re-record</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator color="#fff" />
                <Text style={[styles.btnText, { marginLeft: 10 }]}>Analyzing audio...</Text>
              </View>
            ) : (
              <Text style={styles.btnText}>Submit for Analysis</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF3E0' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#BF360C' },
  subtitle: { fontSize: 13, color: '#E65100', marginTop: 4, marginBottom: 20 },
  waveContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, elevation: 2 },
  waveIcon: { fontSize: 64 },
  durationText: { fontSize: 32, fontWeight: '800', color: '#BF360C', marginTop: 8 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 12 },
  bar: { width: 4, backgroundColor: '#E65100', borderRadius: 2 },
  recordBtn: { backgroundColor: '#E65100', borderRadius: 50, paddingVertical: 20, alignItems: 'center', marginBottom: 12 },
  recordBtnActive: { backgroundColor: '#C62828' },
  recordBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnRow: { flexDirection: 'row', marginBottom: 12 },
  btn: { backgroundColor: '#E65100', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E65100' },
  btnSecondaryText: { color: '#E65100', fontWeight: '700', fontSize: 15 },
  resultCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderLeftWidth: 6, elevation: 3 },
  resultLabel: { fontSize: 24, fontWeight: '800' },
  recommendation: { backgroundColor: '#FFEBEE', borderRadius: 10, padding: 14, marginTop: 14 },
  recTitle: { fontSize: 13, fontWeight: '700', color: '#C62828', marginBottom: 6 },
  recText: { fontSize: 13, color: '#424242', lineHeight: 20 },
});
