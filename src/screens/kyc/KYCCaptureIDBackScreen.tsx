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

type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'KYCCaptureIDBack'>;

function buildUploadFile(asset: ImagePicker.ImagePickerAsset, namePrefix: string) {
  const uri = asset.uri;
  const type = (asset as any).mimeType || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : 'jpg';
  return { uri, type, name: `${namePrefix}-${Date.now()}.${ext}` };
}

export function KYCCaptureIDBackScreen() {
  const navigation = useNavigation<Nav>();
  const { colors: themeColors } = useTheme();
  const { draft, setDraft, setLastRecord } = useKYCFlow();

  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(draft.idBackUri || null);

  const pick = async (source: 'camera' | 'gallery') => {
    if (!draft.kycId) {
      Alert.alert('Session missing', 'Please restart KYC verification.');
      navigation.navigate('KYCLanding');
      return;
    }

    if (source === 'camera') {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        Alert.alert('Camera permission', 'Please allow camera access to take a photo of your ID.');
        return;
      }
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.9,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.9,
          });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    const uploadFile = buildUploadFile(asset, 'id-back');
    setLoading(true);
    try {
      const res = await kycService.uploadDocument({
        kyc_id: draft.kycId,
        document_role: 'id_back_image',
        file: uploadFile,
      });
      setLastRecord(res.data?.record || null);
      setPreviewUri(asset.uri);
      setDraft((prev) => ({ ...prev, idBackUri: asset.uri }));
      navigation.navigate('KYCLivenessSelfie');
    } catch (error) {
      const userMessage = getUserMessage(error, 'kyc.upload.id_back');
      Alert.alert('Retake required', userMessage.message || 'Please retake the photo and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>Capture ID (Back)</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Capture the back of your document clearly. Avoid glare and blur.
        </Text>

        <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.preview} />
          ) : (
            <View style={[styles.previewPlaceholder, { borderColor: themeColors.border }]}>
              <Text style={[styles.placeholderText, { color: themeColors.textSecondary }]}>No photo selected</Text>
            </View>
          )}
        </Card>

        <View style={styles.actions}>
          <Button title="Use camera" onPress={() => void pick('camera')} disabled={loading} />
          <TouchableOpacity onPress={() => void pick('gallery')} disabled={loading} style={styles.secondaryLink}>
            <Text style={[styles.secondaryText, { color: colors.primary[700] }]}>Choose from gallery</Text>
          </TouchableOpacity>
        </View>
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
  preview: { width: '100%', height: 220, borderRadius: borderRadius.md },
  previewPlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { ...typography.caption },
  actions: { gap: spacing.sm },
  secondaryLink: { paddingVertical: spacing.sm, alignItems: 'center' },
  secondaryText: { ...typography.bodySemiBold },
});
