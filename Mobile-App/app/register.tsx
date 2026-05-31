import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FLEET_COLORS } from '@/constants/theme';
import { DEFAULT_THINGSPEAK_CHANNEL_ID, DEFAULT_THINGSPEAK_READ_API_KEY } from '@/constants/thingspeak';
import { VehicleType } from '@/constants/types';
import { addVehicle } from '@/services/vehicleService';

const VEHICLE_TYPES: VehicleType[] = ['Car', 'Truck', 'Van', 'Motorcycle', 'Bus', 'Other'];

export default function RegisterScreen() {
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [licensePlate, setLicensePlate] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!vehicleName.trim()) nextErrors.vehicleName = 'Vehicle name is required';
    if (!vehicleType) nextErrors.vehicleType = 'Please select a vehicle type';
    if (!licensePlate.trim()) nextErrors.licensePlate = 'License plate is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await addVehicle({
        name: vehicleName.trim(),
        channelId: DEFAULT_THINGSPEAK_CHANNEL_ID,
        readApiKey: DEFAULT_THINGSPEAK_READ_API_KEY,
        type: vehicleType as VehicleType,
        licensePlate: licensePlate.trim().toUpperCase(),
      });
      Alert.alert('Vehicle Registered', `${vehicleName} has been added to your fleet.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to register vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="sparkles-outline" size={20} color={FLEET_COLORS.primary} />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>ThingSpeak credentials are handled automatically</Text>
          <Text style={styles.infoDesc}>
            The fleet uses the built-in ThingSpeak channel behind the scenes, so the owner only fills in the vehicle details.
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        <FormField
          label="Vehicle Name"
          placeholder="e.g. Truck Alpha"
          value={vehicleName}
          onChangeText={setVehicleName}
          error={errors.vehicleName}
          icon="car-outline"
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Vehicle Type</Text>
          <TouchableOpacity
            style={[styles.selectInput, errors.vehicleType && styles.inputError]}
            onPress={() => setShowTypePicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="bus-outline" size={18} color={FLEET_COLORS.textSecondary} />
            <Text style={[styles.selectText, !vehicleType && styles.placeholder]}>
              {vehicleType || 'Select vehicle type'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={FLEET_COLORS.textSecondary} />
          </TouchableOpacity>
          {errors.vehicleType && <Text style={styles.errorText}>{errors.vehicleType}</Text>}
        </View>

        <FormField
          label="License Plate"
          placeholder="e.g. RAC 123A"
          value={licensePlate}
          onChangeText={setLicensePlate}
          error={errors.licensePlate}
          icon="card-outline"
          autoCapitalize="characters"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.submitLabel}>Register Vehicle</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={showTypePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypePicker(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Vehicle Type</Text>
            {VEHICLE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeOption, vehicleType === type && styles.typeOptionSelected]}
                onPress={() => {
                  setVehicleType(type);
                  setShowTypePicker(false);
                }}
              >
                <Text style={[styles.typeOptionText, vehicleType === type && styles.typeOptionTextSelected]}>
                  {type}
                </Text>
                {vehicleType === type && <Ionicons name="checkmark" size={16} color={FLEET_COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon: string;
  hint?: string;
  monospace?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'number-pad' | 'email-address';
}

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon,
  hint,
  monospace,
  autoCapitalize,
  keyboardType,
}: FieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, error && styles.inputError]}>
        <Ionicons name={icon as any} size={18} color={FLEET_COLORS.textSecondary} />
        <TextInput
          style={[styles.textInput, monospace && styles.monoInput]}
          placeholder={placeholder}
          placeholderTextColor={FLEET_COLORS.textSecondary + '88'}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize ?? 'words'}
          keyboardType={keyboardType ?? 'default'}
        />
      </View>
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: FLEET_COLORS.primary + '22',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '44',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: FLEET_COLORS.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, gap: 4 },
  infoTitle: { color: FLEET_COLORS.primary, fontSize: 13, fontWeight: '700' },
  infoDesc: { color: FLEET_COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  form: { gap: 16 },
  fieldContainer: { gap: 6 },
  label: { color: FLEET_COLORS.textPrimary, fontSize: 13, fontWeight: '600', marginLeft: 2 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: { borderColor: FLEET_COLORS.orange },
  selectText: { flex: 1, color: FLEET_COLORS.textPrimary, fontSize: 14 },
  placeholder: { color: FLEET_COLORS.textSecondary + '88' },
  textInput: { flex: 1, color: FLEET_COLORS.textPrimary, fontSize: 14, padding: 0 },
  monoInput: { fontFamily: 'monospace', letterSpacing: 1 },
  hintText: { color: FLEET_COLORS.textSecondary, fontSize: 11, marginLeft: 2 },
  errorText: { color: FLEET_COLORS.orange, fontSize: 11, marginLeft: 2 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: FLEET_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: FLEET_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: FLEET_COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: FLEET_COLORS.border,
  },
  modalTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  typeOptionSelected: { backgroundColor: FLEET_COLORS.primary + '22' },
  typeOptionText: { color: FLEET_COLORS.textPrimary, fontSize: 15 },
  typeOptionTextSelected: { color: FLEET_COLORS.primary, fontWeight: '600' },
});
