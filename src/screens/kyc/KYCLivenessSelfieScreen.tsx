import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { KYCFlowStackParamList } from './KYCFlowNavigator';
import { useKYCFlow } from './KYCFlowContext';
import { kycService } from '@/services/kycService';
import { getUserMessage } from '@/utils/userMessages';

type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'KYCLivenessSelfie'>;

function buildUploadFile(asset: ImagePicker.ImagePickerAsset, namePrefix: string) {
  const uri = asset.uri;
  const type = (asset as any).mimeType || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : 'jpg';
  return { uri, type, name: `${namePrefix}-${Date.now()}.${ext}` };
}

function ChecklistRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const { colors: themeColors } = useTheme();
  return (
    <TouchableOpacity onPress={onToggle} style={styles.checkRow}>
      <View
        style={[
          styles.checkBox,
          {
            borderColor: checked ? colors.primary[600] : themeColors.border,
            backgroundColor: checked ? colors.primary[600] : 'transparent',
          },
        ]}
      />
      <Text style={[styles.checkLabel, { color: themeColors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function KYCLivenessSelfieScreen() {
  const navigation = useNavigation<Nav>();
  const { colors: themeColors } = useTheme();
  const { draft, setDraft, setLastRecord } = useKYCFlow();

  const [blinkDone, setBlinkDone] = useState(false);
  const [turnDone, setTurnDone] = useState(false);
  const [smileDone, setSmileDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(draft.selfieUri || null);

  const capture = async () => {
    if (!draft.kycId) {
      Alert.alert('Session missing', 'Please restart KYC verification.');
      navigation.navigate('KYCLanding');
      return;
    }
    if (!(blinkDone && turnDone && smileDone)) {
      Alert.alert('Quick check', 'Please complete the liveness checklist before capturing your selfie.');
      return;
    }

    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) {
      Alert.alert('Camera permission', 'Please allow camera access to capture a live selfie.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    setLoading(true);
    try {
      const res = await kycService.uploadSelfie({
        kyc_id: draft.kycId,
        file: buildUploadFile(asset, 'selfie'),
        blink_completed: true,
        head_turn_completed: true,
        smile_completed: true,
        captured_at: new Date().toISOString(),
      });
      setLastRecord(res.data?.record || null);
      setPreviewUri(asset.uri);
      setDraft((prev) => ({ ...prev, selfieUri: asset.uri }));
      navigation.navigate('KYCReviewConfirm');
    } catch (error) {
      const userMessage = getUserMessage(error, 'kyc.upload.selfie');
      Alert.alert('Try again', userMessage.message || 'Unable to upload your selfie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>Liveness selfie</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Use a live camera selfie in good lighting. We’ll automatically verify liveness during processing.
        </Text>

        <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.ovalFrame, { borderColor: themeColors.border }]}>
            <View style={[styles.ovalGuide, { borderColor: colors.primary[600] }]} />
            {previewUri ? <Image source={{ uri: previewUri }} style={styles.selfiePreview} /> : null}
          </View>
          <Text style={[styles.hint, { color: themeColors.textSecondary }]}>
            Center your face in the oval, remove hats/glasses, and avoid backlight.
          </Text>
        </Card>

        <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Liveness checklist</Text>
          <ChecklistRow label="Blink once" checked={blinkDone} onToggle={() => setBlinkDone((v) => !v)} />
          <ChecklistRow label="Turn your head slightly" checked={turnDone} onToggle={() => setTurnDone((v) => !v)} />
          <ChecklistRow label="Smile" checked={smileDone} onToggle={() => setSmileDone((v) => !v)} />
        </Card>

        <Button title={loading ? 'Uploading…' : 'Capture selfie'} onPress={() => void capture()} disabled={loading} />
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
  ovalFrame: { height: 260, borderWidth: 1, borderRadius: borderRadius.lg, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  ovalGuide: { position: 'absolute', width: 170, height: 220, borderWidth: 2, borderRadius: 110, opacity: 0.7 },
  selfiePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  hint: { ...typography.caption, marginTop: spacing.md },
  cardTitle: { ...typography.h3, marginBottom: spacing.md },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  checkBox: { width: 18, height: 18, borderWidth: 2, borderRadius: 4 },
  checkLabel: { ...typography.body },
});
