import React from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { FLEET_COLORS } from '@/constants/theme';
import { TripPoint } from '@/constants/types';

interface Props {
  points: TripPoint[];
  activePoint: TripPoint | null;
}

export function TripReplayMap({ points, activePoint }: Props) {
  const coordinates = points.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));

  if (coordinates.length === 0) {
    return null;
  }

  return (
    <View style={styles.mapCard}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: coordinates[0].latitude,
          longitude: coordinates[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={darkMapStyle}
      >
        <Polyline coordinates={coordinates} strokeColor={FLEET_COLORS.primary} strokeWidth={4} />
        {activePoint ? (
          <Marker coordinate={{ latitude: activePoint.latitude, longitude: activePoint.longitude }} />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    height: 280,
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
  },
  map: { flex: 1 },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0B0E27' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8892B0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A1F3C' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D1B4B' }] },
];
