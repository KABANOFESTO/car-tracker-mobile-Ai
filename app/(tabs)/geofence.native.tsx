import { FLEET_COLORS } from "@/constants/theme";
import { useGeofenceConfig } from "@/hooks/useGeofenceConfig";
import { GeofencePreview } from "@/components/geofence/GeofencePreview";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function GeofenceScreen() {
  const { config, loading, saving, error, syncStatus, save } = useGeofenceConfig();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("");
  const [moveThreshold, setMoveThreshold] = useState("");
  const [speedThreshold, setSpeedThreshold] = useState("");
  const [uploadInterval, setUploadInterval] = useState("");
  const [dirty, setDirty] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<any>(null);

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to use this feature.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 0
      });
      setLat(pos.coords.latitude.toFixed(6));
      setLng(pos.coords.longitude.toFixed(6));
      setDirty(true);
    } catch {
      Alert.alert("Location Error", "Could not retrieve your current location. Please try again.");
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    if (config) {
      setLat(String(config.geofenceLat));
      setLng(String(config.geofenceLng));
      setRadius(String(config.radius));
      setMoveThreshold(String(config.moveThreshold));
      setSpeedThreshold(String(config.speedThreshold));
      setUploadInterval(String(config.uploadInterval));
      setDirty(false);
    }
  }, [config]);

  function mark() {
    setDirty(true);
  }

  function validate(): string | null {
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    const radiusN = parseFloat(radius);
    const moveN = parseFloat(moveThreshold);
    const speedN = parseFloat(speedThreshold);
    const intervalN = parseFloat(uploadInterval);
    if (isNaN(latN) || latN < -90 || latN > 90) return "Latitude must be between -90 and 90";
    if (isNaN(lngN) || lngN < -180 || lngN > 180) return "Longitude must be between -180 and 180";
    if (isNaN(radiusN) || radiusN < 10) return "Radius must be at least 10 metres";
    if (isNaN(moveN) || moveN < 0) return "Move threshold must be >= 0";
    if (isNaN(speedN) || speedN < 0) return "Speed threshold must be >= 0";
    if (isNaN(intervalN) || intervalN < 1000) return "Upload interval must be at least 1000 ms";
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      Alert.alert("Validation Error", err);
      return;
    }
    try {
      await save({
        geofenceLat: parseFloat(lat),
        geofenceLng: parseFloat(lng),
        radius: parseFloat(radius),
        moveThreshold: parseFloat(moveThreshold),
        speedThreshold: parseFloat(speedThreshold),
        uploadInterval: parseFloat(uploadInterval)
      });
      setDirty(false);
      Alert.alert("Saved", "Geofence configuration sent to ThingSpeak.");
    } catch {
      Alert.alert("Save Failed", error ?? "Could not update config. Check your ThingSpeak write API key.");
    }
  }

  const syncColor =
    syncStatus === "synced"
      ? FLEET_COLORS.green
      : syncStatus === "error"
        ? FLEET_COLORS.orange
        : FLEET_COLORS.textSecondary;
  const syncLabel = syncStatus === "synced" ? "Synced" : syncStatus === "error" ? "Sync Error" : "Loading...";

  const mapLat = parseFloat(lat) || 0;
  const mapLng = parseFloat(lng) || 0;
  const mapRadius = parseFloat(radius) || 50;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Geofence Config</Text>
          <View style={[styles.syncPill, { backgroundColor: syncColor + "22", borderColor: syncColor + "55" }]}>
            <View style={[styles.syncDot, { backgroundColor: syncColor }]} />
            <Text style={[styles.syncLabel, { color: syncColor }]}>{syncLabel}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={FLEET_COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Loading config from ThingSpeak...</Text>
          </View>
        ) : (
          <>
            <GeofencePreview mapRef={mapRef} latitude={mapLat} longitude={mapLng} radius={mapRadius} />

            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>GEOFENCE CENTER</Text>
              <TouchableOpacity
                style={[styles.locationBtn, locating && styles.locationBtnDisabled]}
                onPress={useCurrentLocation}
                disabled={locating}
                activeOpacity={0.8}>
                {locating ? (
                  <ActivityIndicator size="small" color={FLEET_COLORS.primary} />
                ) : (
                  <Ionicons name="navigate-circle-outline" size={16} color={FLEET_COLORS.primary} />
                )}
                <Text style={styles.locationBtnText}>{locating ? "Locating..." : "Use my location"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.section}>
              <ConfigField label="Latitude" value={lat} onChangeText={(t) => { setLat(t); mark(); }} placeholder="-1.9441" icon="locate-outline" keyboardType="decimal-pad" />
              <ConfigField label="Longitude" value={lng} onChangeText={(t) => { setLng(t); mark(); }} placeholder="30.0619" icon="locate-outline" keyboardType="decimal-pad" />
              <ConfigField label="Radius (m)" value={radius} onChangeText={(t) => { setRadius(t); mark(); }} placeholder="50" icon="radio-outline" keyboardType="number-pad" />
            </View>

            <Text style={styles.sectionLabel}>DEVICE THRESHOLDS</Text>
            <View style={styles.section}>
              <ConfigField label="Speed Threshold (km/h)" value={speedThreshold} onChangeText={(t) => { setSpeedThreshold(t); mark(); }} placeholder="5" icon="speedometer-outline" keyboardType="decimal-pad" hint="Above this speed the vehicle is 'moving'" />
              <ConfigField label="Move Threshold (m)" value={moveThreshold} onChangeText={(t) => { setMoveThreshold(t); mark(); }} placeholder="10" icon="walk-outline" keyboardType="number-pad" hint="Minimum displacement to trigger a new upload" />
              <ConfigField label="Upload Interval (ms)" value={uploadInterval} onChangeText={(t) => { setUploadInterval(t); mark(); }} placeholder="30000" icon="timer-outline" keyboardType="number-pad" hint="How often the device sends data (min 1000)" />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!dirty || saving}
              activeOpacity={0.85}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>{dirty ? "Save to ThingSpeak" : "No Changes"}</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ConfigField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  hint
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: string;
  keyboardType?: any;
  hint?: string;
}) {
  return (
    <View style={fieldStyles.container}>
      <View style={fieldStyles.row}>
        <Ionicons name={icon as any} size={16} color={FLEET_COLORS.textSecondary} style={fieldStyles.icon} />
        <Text style={fieldStyles.label}>{label}</Text>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={FLEET_COLORS.textSecondary + "66"}
          keyboardType={keyboardType ?? "default"}
          textAlign="right"
        />
      </View>
      {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  safe: { backgroundColor: FLEET_COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 16 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border
  },
  title: { color: FLEET_COLORS.textPrimary, fontSize: 22, fontWeight: "700" },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1
  },
  syncDot: { width: 6, height: 6, borderRadius: 3 },
  syncLabel: { fontSize: 12, fontWeight: "600" },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  loadingBox: { alignItems: "center", gap: 12, marginTop: 60 },
  loadingText: { color: FLEET_COLORS.textSecondary, fontSize: 14 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4
  },
  sectionLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginLeft: 4
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: FLEET_COLORS.primary + "1A",
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + "55",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  locationBtnDisabled: { opacity: 0.5 },
  locationBtnText: {
    color: FLEET_COLORS.primary,
    fontSize: 12,
    fontWeight: "600"
  },
  section: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    overflow: "hidden"
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: FLEET_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: FLEET_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});

const fieldStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border
  },
  row: { flexDirection: "row", alignItems: "center" },
  icon: { marginRight: 10 },
  label: { flex: 1, color: FLEET_COLORS.textPrimary, fontSize: 14 },
  input: { color: FLEET_COLORS.textPrimary, fontSize: 14, minWidth: 100, paddingVertical: 0 },
  hint: { color: FLEET_COLORS.textSecondary, fontSize: 11, marginTop: 4, marginLeft: 26 }
});
