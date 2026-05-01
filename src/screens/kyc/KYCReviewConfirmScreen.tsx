import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, Switch, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { KYCFlowStackParamList } from './KYCFlowNavigator';
import { useKYCFlow } from './KYCFlowContext';
import { kycService } from '@/services/kycService';
import { getUserMessage } from '@/utils/userMessages';

type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'KYCReviewConfirm'>;

function buildUploadFile(asset: ImagePicker.ImagePickerAsset, namePrefix: string) {
  const uri = asset.uri;
  const type = (asset as any).mimeType || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : 'jpg';
  return { uri, type, name: `${namePrefix}-${Date.now()}.${ext}` };
}

export function KYCReviewConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const { colors: themeColors } = useTheme();
  const { draft, setDraft, setLastRecord } = useKYCFlow();

  const [capturingLocation, setCapturingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const docLabel = useMemo(() => {
    const map: Record<string, string> = {
      national_id: 'National ID',
      passport: 'Passport',
      alien_id: 'Alien ID',
      military_id: 'Military ID',
    };
    return map[draft.documentType] || 'ID';
  }, [draft.documentType]);

  const captureLocation = async (): Promise<{ latitude: number; longitude: number; label?: string } | null> => {
    setCapturingLocation(true);
    try {
      const existingPermission = await Location.getForegroundPermissionsAsync();
      if (!existingPermission.granted) {
        const requested = await Location.requestForegroundPermissionsAsync();
        if (!requested.granted) {
          Alert.alert(
            'Location permission',
            'Location permission was denied. You can continue without sharing location, or enable it in Settings.',
            [
              { text: 'Continue', style: 'cancel' },
              { text: 'Open Settings', onPress: () => void Linking.openSettings() },
            ]
          );
          setDraft((prev) => ({ ...prev, shareLocation: false, location: null }));
          return null;
        }
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location services off',
          'Please turn on location services to share your location, or continue without it.',
          [
            { text: 'Continue', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ]
        );
        setDraft((prev) => ({ ...prev, shareLocation: false, location: null }));
        return null;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      let label: string | undefined;
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place = places?.[0];
        const city = place?.city || place?.subregion || place?.region;
        const country = place?.country;
        const parts = [city, country].filter((item): item is string => Boolean(item && String(item).trim()));
        label = parts.length ? parts.join(', ') : undefined;
      } catch {}

      setDraft((prev) => ({
        ...prev,
        location: { latitude, longitude, label },
      }));
      return { latitude, longitude, label };
    } catch {
      Alert.alert('Location error', 'Unable to capture location right now. You can continue without it.');
      setDraft((prev) => ({ ...prev, shareLocation: false, location: null }));
      return null;
    } finally {
      setCapturingLocation(false);
    }
  };

  const onToggleShareLocation = (enabled: boolean) => {
    setDraft((prev) => ({ ...prev, shareLocation: enabled }));
    if (enabled) {
      void captureLocation();
    } else {
      setDraft((prev) => ({ ...prev, location: null }));
    }
  };

  const attachProofOfAddress = async () => {
    if (!draft.kycId) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    try {
      const res = await kycService.uploadDocument({
        kyc_id: draft.kycId,
        document_role: 'proof_of_address_image',
        file: buildUploadFile(asset, 'proof-of-address'),
      });
      setLastRecord(res.data?.record || null);
      Alert.alert('Added', 'Proof of address uploaded.');
    } catch (error) {
      const userMessage = getUserMessage(error, 'kyc.upload.proof');
      Alert.alert('Upload failed', userMessage.message || 'Please try again.');
    }
  };

  const submit = async () => {
    if (!draft.kycId) {
      Alert.alert('Session missing', 'Please restart KYC verification.');
      navigation.navigate('KYCLanding');
      return;
    }
    if (!draft.idFrontUri || !draft.selfieUri || (draft.documentType !== 'passport' && !draft.idBackUri)) {
      Alert.alert('Missing documents', 'Please upload the required documents before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      if (draft.shareLocation) {
        const location = draft.location || (await captureLocation());
        if (location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
          await kycService.submitLocation({
            kyc_id: draft.kycId,
            share_location: true,
            latitude: location.latitude,
            longitude: location.longitude,
            location_label: location.label,
          });
        }
      }

      await kycService.submit({ kyc_id: draft.kycId });
      navigation.navigate('KYCProcessing', { kycId: draft.kycId });
    } catch (error) {
      const userMessage = getUserMessage(error, 'kyc.submit');
      Alert.alert('Submission failed', userMessage.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>Review & confirm</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Confirm the details below before submitting. We’ll verify your information automatically.
        </Text>

        <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Details</Text>
          <Text style={[styles.row, { color: themeColors.textSecondary }]}>Name: {draft.legalName}</Text>
          <Text style={[styles.row, { color: themeColors.textSecondary }]}>DOB: {draft.dateOfBirth}</Text>
          <Text style={[styles.row, { color: themeColors.textSecondary }]}>Gender: {draft.gender}</Text>
          <Text style={[styles.row, { color: themeColors.textSecondary }]}>Nationality: {draft.nationality}</Text>
          <Text style={[styles.row, { color: themeColors.textSecondary }]}>
            {docLabel}: {draft.idNumber}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('KYCPersonalDetails')} style={styles.editLink}>
            <Text style={[styles.editText, { color: colors.primary[700] }]}>Edit details</Text>
          </TouchableOpacity>
        </Card>

        <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Documents</Text>
          <View style={styles.previewRow}>
            {draft.idFrontUri ? <Image source={{ uri: draft.idFrontUri }} style={styles.thumb} /> : null}
            {draft.documentType !== 'passport' && draft.idBackUri ? (
              <Image source={{ uri: draft.idBackUri }} style={styles.thumb} />
            ) : null}
            {draft.selfieUri ? <Image source={{ uri: draft.selfieUri }} style={styles.thumb} /> : null}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('KYCCaptureIDFront')} style={styles.editLink}>
            <Text style={[styles.editText, { color: colors.primary[700] }]}>Retake photos</Text>
          </TouchableOpacity>
        </Card>

        <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Location (optional)</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.row, { color: themeColors.textSecondary }]}>Share device location</Text>
            <Switch
              testID="kyc-share-location-switch"
              value={draft.shareLocation}
              onValueChange={onToggleShareLocation}
              disabled={capturingLocation || submitting}
            />
          </View>
          {draft.shareLocation ? (
            <Text style={[styles.row, { color: themeColors.textSecondary }]}>
              {draft.location?.label ||
                (draft.location ? `${draft.location.latitude.toFixed(4)}, ${draft.location.longitude.toFixed(4)}` : 'Capturing…')}
            </Text>
          ) : null}
        </Card>

        <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Proof of address (optional)</Text>
          <Text style={[styles.row, { color: themeColors.textSecondary }]}>
            You can add a utility bill or similar document for enhanced verification.
          </Text>
          <TouchableOpacity onPress={() => void attachProofOfAddress()} style={styles.editLink}>
            <Text style={[styles.editText, { color: colors.primary[700] }]}>Upload proof of address</Text>
          </TouchableOpacity>
        </Card>

        <Button title={submitting ? 'Submitting…' : 'Submit for verification'} onPress={() => void submit()} disabled={submitting} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { ...typography.h2 },
  subtitle: { ...typography.body },
  card: { padding: spacing.lg, borderWidth: 1 },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  row: { ...typography.body, marginBottom: spacing.xs },
  editLink: { marginTop: spacing.md },
  editText: { ...typography.bodySemiBold },
  previewRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  thumb: { width: 76, height: 76, borderRadius: borderRadius.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
