/**
 * Environment Detection & Setup Verification Utility
 * 
 * Use this to quickly verify your setup and environment in development
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getPushRuntimeEnvironment, type PushRuntimeEnvironment } from '@/services/pushNotificationService';

/**
 * Comprehensive environment check
 * Call this from your app to verify everything is set up correctly
 */
export function checkPushNotificationEnvironment(): {
  environment: PushRuntimeEnvironment;
  isSetupCorrect: boolean;
  warnings: string[];
  info: string[];
  recommendations: string[];
} {
  const env = getPushRuntimeEnvironment();
  const warnings: string[] = [];
  const info: string[] = [];
  const recommendations: string[] = [];

  // Check platform
  if (env.platform === 'web') {
    warnings.push('Platform is web - push notifications not supported');
    recommendations.push('Push notifications only work on iOS and Android');
  }

  // Check Expo Go
  if (env.isExpoGo) {
    info.push('Running in Expo Go - push notifications not available');
    recommendations.push('To test push: eas build --platform android --profile development --local');
    recommendations.push('Or: expo run:android / expo run:ios');
  }

  // Check development build
  if (env.isDevelopmentBuild) {
    info.push('Running in development build - push notifications available');
    recommendations.push('Install expo-notifications if not already installed: npm install expo-notifications');
  }

  // Check production build
  if (env.isProductionBuild) {
    info.push('Running in production build - push notifications available');
  }

  // Check project ID
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    warnings.push('Missing Expo project ID in app.json extra.eas.projectId');
    recommendations.push('Add to app.json: "extra": { "eas": { "projectId": "YOUR_PROJECT_ID" } }');
  } else {
    info.push(`Expo project ID: ${projectId}`);
  }

  // Check environment variable
  const envProjectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;
  if (envProjectId && envProjectId !== projectId) {
    warnings.push('EXPO_PUBLIC_EXPO_PROJECT_ID env var differs from app.json');
  }

  // Determine if setup is correct
  const isSetupCorrect =
    env.canUseRemotePush ||
    (env.isExpoGo && warnings.length === 0) ||
    (env.platform === 'web');

  return {
    environment: env,
    isSetupCorrect,
    warnings,
    info,
    recommendations,
  };
}

/**
 * Print environment check results to console
 */
export function printEnvironmentCheck(): void {
  const check = checkPushNotificationEnvironment();

  console.log('\n========== PUSH NOTIFICATION ENVIRONMENT CHECK ==========');
  console.log(`Environment: ${check.environment.displayName}`);
  console.log(`Push Supported: ${check.environment.canUseRemotePush ? 'yes' : 'no'}`);
  console.log(`Setup Correct: ${check.isSetupCorrect ? 'yes' : 'no'}`);

  if (check.info.length > 0) {
    console.log('\nInfo:');
    check.info.forEach((msg) => console.log(`  - ${msg}`));
  }

  if (check.warnings.length > 0) {
    console.log('\nWarnings:');
    check.warnings.forEach((msg) => console.log(`  - ${msg}`));
  }

  if (check.recommendations.length > 0) {
    console.log('\nRecommendations:');
    check.recommendations.forEach((msg) => console.log(`  - ${msg}`));
  }

  console.log('=========================================================\n');
}

/**
 * Get debug information for reporting issues
 */
export function getPushNotificationDebugInfo() {
  const env = getPushRuntimeEnvironment();

  return {
    environment: env.displayName,
    isExpoGo: env.isExpoGo,
    isDevelopmentBuild: env.isDevelopmentBuild,
    isProductionBuild: env.isProductionBuild,
    platform: env.platform,
    canUseRemotePush: env.canUseRemotePush,
    appOwnership: Constants.appOwnership,
    executionEnvironment: Constants.executionEnvironment,
    expoVersion: Constants.expoVersion,
    projectId: Constants.expoConfig?.extra?.eas?.projectId || 'NOT SET',
    enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS || 'NOT SET',
    timestamp: new Date().toISOString(),
  };
}
