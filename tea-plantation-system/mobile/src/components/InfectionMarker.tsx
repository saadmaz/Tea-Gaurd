import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import type { MapMarker } from '../types';

interface InfectionMarkerProps {
  marker: MapMarker;
  onPress?: (marker: MapMarker) => void;
}

const COLORS: Record<string, string> = { red: '#C62828', orange: '#E65100', green: '#2E7D32' };

export const InfectionMarker: React.FC<InfectionMarkerProps> = ({ marker, onPress }) => {
  const color = COLORS[marker.marker_color] ?? '#2E7D32';
  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      onPress={() => onPress?.(marker)}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Callout>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{marker.label}</Text>
          <Text style={styles.calloutSub}>{marker.detection_type}</Text>
          {marker.damage_pct !== undefined && (
            <Text style={styles.calloutDmg}>Damage: {marker.damage_pct.toFixed(1)}%</Text>
          )}
          <Text style={styles.calloutDate}>{new Date(marker.created_at).toLocaleDateString()}</Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#fff', elevation: 3 },
  callout: { padding: 8, minWidth: 140 },
  calloutTitle: { fontWeight: '700', fontSize: 14, color: '#212121' },
  calloutSub: { fontSize: 12, color: '#757575', marginTop: 2, textTransform: 'capitalize' },
  calloutDmg: { fontSize: 12, color: '#C62828', marginTop: 2 },
  calloutDate: { fontSize: 11, color: '#9E9E9E', marginTop: 4 },
});
