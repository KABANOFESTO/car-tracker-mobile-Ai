import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { FLEET_COLORS } from "@/constants/theme";
import { GeofenceZoneType, VehicleType } from "@/constants/types";
import { useVehicleSecurity } from "@/hooks/useVehicleSecurity";
import { useVehicles } from "@/hooks/useVehicles";
import { removeVehicle, updateVehicle } from "@/services/vehicleService";

const VEHICLE_TYPES: VehicleType[] = ["Car", "Truck", "Van", "Motorcycle", "Bus", "Other"];
const ZONE_TYPES: GeofenceZoneType[] = ["home", "parking", "work", "restricted"];

function statusColor(status: string) {
  if (status === "moving") return FLEET_COLORS.green;
  if (status === "idle") return FLEET_COLORS.orange;
  return FLEET_COLORS.textSecondary;
}

function hdopLabel(hdop: number) {
  if (hdop < 2) return "Excellent";
  if (hdop < 5) return "Good";
  return "Poor";
}

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vehicles } = useVehicles();
  const { zones, protectionState, loading: securityLoading, saveZone, removeZone, setProtection } = useVehicleSecurity(id ?? null);
  const vehicle = vehicles.find((v) => v.id === id);

  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState("");
  const [readApiKey, setReadApiKey] = useState("");
  const [type, setType] = useState<VehicleType | "">("");
  const [licensePlate, setLicensePlate] = useState("");
  const [driver, setDriver] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [zoneType, setZoneType] = useState<GeofenceZoneType>("parking");
  const [zoneLat, setZoneLat] = useState("");
  const [zoneLng, setZoneLng] = useState("");
  const [zoneRadius, setZoneRadius] = useState("20");

  useEffect(() => {
    if (vehicle) {
      setName(vehicle.name);
      setChannelId(String(vehicle.channelId));
      setReadApiKey(vehicle.readApiKey);
      setType(vehicle.type);
      setLicensePlate(vehicle.licensePlate);
      setDriver(vehicle.driver ?? "");
    }
  }, [vehicle?.id]);

  function mark() {
    setDirty(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!channelId.trim() || isNaN(Number(channelId)) || Number(channelId) <= 0) e.channelId = "Enter a valid Channel ID";
    if (!readApiKey.trim() || readApiKey.trim().length !== 16) e.readApiKey = "Read API Key must be 16 characters";
    if (!type) e.type = "Select a vehicle type";
    if (!licensePlate.trim()) e.licensePlate = "License plate is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateVehicle(id!, {
        name: name.trim(),
        channelId: Number(channelId.trim()),
        readApiKey: readApiKey.trim(),
        type: type as VehicleType,
        licensePlate: licensePlate.trim().toUpperCase(),
        driver: driver.trim() || undefined
      });
      setDirty(false);
      Alert.alert("Saved", "Vehicle details updated.");
    } catch {
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveZone() {
    const latitude = parseFloat(zoneLat);
    const longitude = parseFloat(zoneLng);
    const radius = parseFloat(zoneRadius);

    if (!zoneName.trim() || Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(radius) || radius < 5) {
      Alert.alert("Invalid zone", "Provide a zone name, valid coordinates, and a radius of at least 5 m.");
      return;
    }

    try {
      await saveZone({
        vehicleId: id!,
        name: zoneName.trim(),
        type: zoneType,
        latitude,
        longitude,
        radius,
        activeFromHour: zoneType === "home" || zoneType === "parking" ? 21 : null,
        activeToHour: zoneType === "home" || zoneType === "parking" ? 6 : null,
      });
      setShowZoneModal(false);
      setZoneName("");
      setZoneType("parking");
      setZoneLat("");
      setZoneLng("");
      setZoneRadius("20");
    } catch {
      Alert.alert("Error", "Failed to save zone.");
    }
  }

  function handleDelete() {
    Alert.alert("Remove Vehicle", `Remove "${vehicle?.name}" from your fleet? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeVehicle(id!);
          router.back();
        }
      }
    ]);
  }

  if (!vehicle) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={FLEET_COLORS.primary} />
        <Text style={styles.loadingText}>Loading vehicle...</Text>
      </View>
    );
  }

  const color = statusColor(vehicle.status);
  const isLive = vehicle.status !== "offline";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.telemetryCard}>
        <View style={styles.telemetryHeader}>
          <View style={[styles.statusBadge, { backgroundColor: color + "22" }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>
              {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
            </Text>
          </View>
          {vehicle.isOutsideFence && (
            <View style={styles.fenceBadge}>
              <Ionicons name="warning-outline" size={12} color="#fff" />
              <Text style={styles.fenceBadgeText}>OUTSIDE FENCE</Text>
            </View>
          )}
          <Text style={styles.lastSeen}>
            Last seen {vehicle.lastSeen === new Date(0).toISOString() ? "never" : new Date(vehicle.lastSeen).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.telemetryGrid}>
          <TelemetryItem icon="speedometer-outline" label="Speed" value={`${Math.round(vehicle.speed)} km/h`} />
          <TelemetryItem icon="compass-outline" label="Direction" value={`${Math.round(vehicle.direction)}°`} />
          <TelemetryItem icon="trending-up-outline" label="Altitude" value={isLive ? `${Math.round(vehicle.altitude)} m` : "—"} />
          <TelemetryItem icon="radio-outline" label="Satellites" value={isLive ? String(vehicle.satellites) : "—"} />
          <TelemetryItem icon="wifi-outline" label="HDOP" value={isLive ? hdopLabel(vehicle.hdop) : "—"} highlight={isLive && vehicle.hdop < 5} />
          <TelemetryItem
            icon="location-outline"
            label="Location"
            value={vehicle.location.latitude !== 0 ? `${vehicle.location.latitude.toFixed(5)}, ${vehicle.location.longitude.toFixed(5)}` : "—"}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>VEHICLE DETAILS</Text>
      <View style={styles.section}>
        <InlineField label="Name" value={name} onChangeText={(value) => { setName(value); mark(); }} placeholder="e.g. Truck Alpha" error={errors.name} />
        <InlineField label="Channel ID" value={channelId} onChangeText={(value) => { setChannelId(value.replace(/[^0-9]/g, "")); mark(); }} placeholder="e.g. 3316972" error={errors.channelId} keyboardType="number-pad" />
        <InlineField label="Read API Key" value={readApiKey} onChangeText={(value) => { setReadApiKey(value.toUpperCase().slice(0, 16)); mark(); }} placeholder="16 characters" error={errors.readApiKey} monospace hint={`${readApiKey.length}/16`} />
        <InlineField label="License Plate" value={licensePlate} onChangeText={(value) => { setLicensePlate(value); mark(); }} placeholder="e.g. RAC 123A" error={errors.licensePlate} autoCapitalize="characters" />
        <InlineField label="Driver" value={driver} onChangeText={(value) => { setDriver(value); mark(); }} placeholder="Optional" />

        <View style={fieldStyles.container}>
          <TouchableOpacity style={fieldStyles.row} onPress={() => setShowTypePicker(true)} activeOpacity={0.7}>
            <Text style={fieldStyles.label}>Type</Text>
            <Text style={[fieldStyles.value, !type && fieldStyles.placeholder]}>{type || "Select..."}</Text>
            <Ionicons name="chevron-forward" size={14} color={FLEET_COLORS.border} />
          </TouchableOpacity>
          {errors.type && <Text style={fieldStyles.error}>{errors.type}</Text>}
        </View>
      </View>

      <Text style={styles.sectionLabel}>PROTECTION MODE</Text>
      <View style={styles.securityCard}>
        <View style={styles.securityRow}>
          <View style={styles.securityTextWrap}>
            <Text style={styles.securityTitle}>Anti-theft protection</Text>
            <Text style={styles.securitySubtitle}>
              Arm this vehicle when it should remain parked. Any movement will escalate into a critical alert.
            </Text>
          </View>
          <Switch
            value={protectionState?.armed ?? false}
            onValueChange={(value) => setProtection(value)}
            trackColor={{ false: FLEET_COLORS.border, true: FLEET_COLORS.primary + "88" }}
            thumbColor={protectionState?.armed ? FLEET_COLORS.primary : "#FFFFFF"}
          />
        </View>
        <Text style={styles.securityMeta}>
          {securityLoading
            ? "Loading protection state..."
            : protectionState?.armed
              ? `Armed ${protectionState.armedAt ? new Date(protectionState.armedAt).toLocaleString() : ""}`
              : "Protection mode is currently disarmed"}
        </Text>
      </View>

      <View style={styles.zoneHeader}>
        <Text style={styles.sectionLabel}>ASSIGNED ZONES</Text>
        <TouchableOpacity style={styles.zoneAddBtn} onPress={() => setShowZoneModal(true)}>
          <Ionicons name="add" size={16} color={FLEET_COLORS.primary} />
          <Text style={styles.zoneAddText}>Add zone</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.zoneList}>
        {zones.length === 0 ? (
          <Text style={styles.emptyZones}>No per-vehicle zones yet. Add home, parking, work, or restricted zones.</Text>
        ) : (
          zones.map((zone) => (
            <View key={zone.id} style={styles.zoneCard}>
              <View style={styles.zoneCardHeader}>
                <View>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <Text style={styles.zoneMeta}>
                    {zone.type} • {zone.radius} m • {zone.latitude.toFixed(5)}, {zone.longitude.toFixed(5)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeZone(zone.id)}>
                  <Ionicons name="trash-outline" size={16} color={FLEET_COLORS.orange} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {dirty && (
        <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <>
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </>}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
        <Ionicons name="trash-outline" size={18} color={FLEET_COLORS.orange} />
        <Text style={styles.deleteBtnText}>Remove Vehicle</Text>
      </TouchableOpacity>

      <Modal visible={showTypePicker} transparent animationType="fade" onRequestClose={() => setShowTypePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTypePicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Vehicle Type</Text>
            {VEHICLE_TYPES.map((entry) => (
              <TouchableOpacity
                key={entry}
                style={[styles.typeOption, type === entry && styles.typeOptionSelected]}
                onPress={() => {
                  setType(entry);
                  setShowTypePicker(false);
                  mark();
                }}
              >
                <Text style={[styles.typeOptionText, type === entry && styles.typeOptionTextSelected]}>{entry}</Text>
                {type === entry && <Ionicons name="checkmark" size={16} color={FLEET_COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showZoneModal} transparent animationType="slide" onRequestClose={() => setShowZoneModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add vehicle zone</Text>
            <InlineField label="Zone name" value={zoneName} onChangeText={setZoneName} placeholder="e.g. Night Parking" />
            <InlineField label="Latitude" value={zoneLat} onChangeText={setZoneLat} placeholder="-1.9441" keyboardType="decimal-pad" />
            <InlineField label="Longitude" value={zoneLng} onChangeText={setZoneLng} placeholder="30.0619" keyboardType="decimal-pad" />
            <InlineField label="Radius (m)" value={zoneRadius} onChangeText={setZoneRadius} placeholder="20" keyboardType="number-pad" />

            <Text style={styles.zoneTypeTitle}>Zone type</Text>
            <View style={styles.zoneTypeRow}>
              {ZONE_TYPES.map((entry) => (
                <TouchableOpacity
                  key={entry}
                  style={[styles.zoneTypeChip, zoneType === entry && styles.zoneTypeChipActive]}
                  onPress={() => setZoneType(entry)}
                >
                  <Text style={[styles.zoneTypeChipText, zoneType === entry && styles.zoneTypeChipTextActive]}>{entry}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowZoneModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveZone}>
                <Text style={styles.modalSaveText}>Save Zone</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function TelemetryItem({
  icon,
  label,
  value,
  highlight
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={telemStyles.item}>
      <Ionicons name={icon as any} size={16} color={highlight ? FLEET_COLORS.green : FLEET_COLORS.textSecondary} />
      <Text style={telemStyles.label}>{label}</Text>
      <Text style={[telemStyles.value, highlight && { color: FLEET_COLORS.green }]}>{value}</Text>
    </View>
  );
}

function InlineField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  monospace,
  hint,
  keyboardType,
  autoCapitalize
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  monospace?: boolean;
  hint?: string;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={fieldStyles.container}>
      <View style={[fieldStyles.row, error ? fieldStyles.rowError : undefined]}>
        <Text style={fieldStyles.label}>{label}</Text>
        <TextInput
          style={[fieldStyles.input, monospace && fieldStyles.mono]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={FLEET_COLORS.textSecondary + "66"}
          keyboardType={keyboardType ?? "default"}
          autoCapitalize={autoCapitalize ?? "words"}
          textAlign="right"
        />
        {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
      </View>
      {error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: FLEET_COLORS.textSecondary, fontSize: 14 },
  telemetryCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 12
  },
  telemetryHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },
  fenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: FLEET_COLORS.orange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20
  },
  fenceBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  lastSeen: { color: FLEET_COLORS.textSecondary, fontSize: 11, marginLeft: "auto" },
  telemetryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sectionLabel: { color: FLEET_COLORS.textSecondary, fontSize: 11, fontWeight: "600", letterSpacing: 1, marginLeft: 4 },
  section: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    overflow: "hidden"
  },
  securityCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 8
  },
  securityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  securityTextWrap: { flex: 1, gap: 4 },
  securityTitle: { color: FLEET_COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  securitySubtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  securityMeta: { color: FLEET_COLORS.textSecondary, fontSize: 12 },
  zoneHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  zoneAddBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  zoneAddText: { color: FLEET_COLORS.primary, fontSize: 12, fontWeight: "700" },
  zoneList: { gap: 10 },
  emptyZones: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14
  },
  zoneCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14
  },
  zoneCardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  zoneName: { color: FLEET_COLORS.textPrimary, fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
  zoneMeta: { color: FLEET_COLORS.textSecondary, fontSize: 12, marginTop: 3, textTransform: "capitalize" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: FLEET_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    shadowColor: FLEET_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.55 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.orange + "55"
  },
  deleteBtnText: { color: FLEET_COLORS.orange, fontSize: 15, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "#000000AA", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: FLEET_COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: FLEET_COLORS.border
  },
  modalTitle: { color: FLEET_COLORS.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  typeOptionSelected: { backgroundColor: FLEET_COLORS.primary + "22" },
  typeOptionText: { color: FLEET_COLORS.textPrimary, fontSize: 15 },
  typeOptionTextSelected: { color: FLEET_COLORS.primary, fontWeight: "600" },
  zoneTypeTitle: { color: FLEET_COLORS.textSecondary, fontSize: 11, fontWeight: "600", letterSpacing: 1, marginTop: 12, marginBottom: 8 },
  zoneTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  zoneTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.background
  },
  zoneTypeChipActive: { borderColor: FLEET_COLORS.primary, backgroundColor: FLEET_COLORS.primary + "22" },
  zoneTypeChipText: { color: FLEET_COLORS.textSecondary, fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  zoneTypeChipTextActive: { color: FLEET_COLORS.primary },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center"
  },
  modalCancelText: { color: FLEET_COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: FLEET_COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center"
  },
  modalSaveText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" }
});

const telemStyles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: "47%",
    flexShrink: 1
  },
  label: { color: FLEET_COLORS.textSecondary, fontSize: 11, flex: 1 },
  value: { color: FLEET_COLORS.textPrimary, fontSize: 12, fontWeight: "600" }
});

const fieldStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowError: {},
  label: { color: FLEET_COLORS.textPrimary, fontSize: 14, flex: 1 },
  value: { color: FLEET_COLORS.textSecondary, fontSize: 14 },
  placeholder: { color: FLEET_COLORS.textSecondary + "77" },
  input: { color: FLEET_COLORS.textPrimary, fontSize: 14, padding: 0, minWidth: 120 },
  mono: { fontFamily: "monospace", letterSpacing: 1, fontSize: 13 },
  hint: { color: FLEET_COLORS.textSecondary, fontSize: 11 },
  error: { color: FLEET_COLORS.orange, fontSize: 11, marginTop: 3 }
});
