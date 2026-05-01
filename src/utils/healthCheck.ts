import { Platform } from 'react-native';
import Constants from 'expo-constants';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/api/client';
import { checkSupabaseHealth, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { env } from '@/config/env';

// Health status enum
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

// Health check result interface
interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  checks: {
    [key: string]: {
      status: HealthStatus;
      message: string;
      duration?: number;
      details?: Record<string, unknown>;
    };
  };
  device: {
    platform: string;
    version: string;
    model: string;
    brand: string;
  };
  app: {
    version: string;
    buildNumber: string;
    environment: string;
  };
}

class HealthCheckService {
  // Run all health checks
  async runHealthChecks(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};

    // Run checks in parallel
    const [
      apiCheck,
      networkCheck,
      storageCheck,
      authCheck,
      supabaseCheck,
    ] = await Promise.all([
      this.checkApiHealth(),
      this.checkNetworkConnectivity(),
      this.checkStorageHealth(),
      this.checkAuthStatus(),
      this.checkSupabaseHealth(),
    ]);

    checks.api = apiCheck;
    checks.network = networkCheck;
    checks.storage = storageCheck;
    checks.auth = authCheck;
    checks.supabase = supabaseCheck;

    // Determine overall status
    const statuses = Object.values(checks).map(c => c.status);
    let overallStatus: HealthStatus;

    if (statuses.every(s => s === HealthStatus.HEALTHY)) {
      overallStatus = HealthStatus.HEALTHY;
    } else if (statuses.some(s => s === HealthStatus.UNHEALTHY)) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else {
      overallStatus = HealthStatus.DEGRADED;
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      device: await this.getDeviceInfo(),
      app: this.getAppInfo(),
    };
  }

  // Check API health
  private async checkApiHealth(): Promise<HealthCheckResult['checks']['api']> {
    const startTime = Date.now();
    const healthEndpoint = env.healthEndpoint;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(healthEndpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      let data: Record<string, unknown> = {};
      
      try {
        data = await response.json();
      } catch {
        data = { status: response.ok ? 'ok' : 'error', statusCode: response.status };
      }

      return {
        status: response.ok ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        message: response.ok ? 'API is responsive' : `API returned status ${response.status}`,
        duration,
        details: data,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        status: HealthStatus.UNHEALTHY,
        message: `API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
      };
    }
  }

  // Check network connectivity
  private async checkNetworkConnectivity(): Promise<HealthCheckResult['checks']['network']> {
    try {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: 'No network connection',
          details: { isConnected: false },
        };
      }

      if (!netInfo.isInternetReachable) {
        return {
          status: HealthStatus.DEGRADED,
          message: 'Network connected but internet unreachable',
          details: {
            isConnected: true,
            isInternetReachable: false,
            type: netInfo.type,
          },
        };
      }

      return {
        status: HealthStatus.HEALTHY,
        message: 'Network connectivity OK',
        details: {
          isConnected: true,
          isInternetReachable: true,
          type: netInfo.type,
          isWifi: netInfo.type === 'wifi',
        },
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Network check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Check storage health
  private async checkStorageHealth(): Promise<HealthCheckResult['checks']['storage']> {
    try {
      // Try to write and read from AsyncStorage
      const testKey = '__health_check__';
      const testValue = Date.now().toString();

      await AsyncStorage.setItem(testKey, testValue);
      const readValue = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);

      if (readValue !== testValue) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: 'Storage read/write mismatch',
        };
      }

      return {
        status: HealthStatus.HEALTHY,
        message: 'Storage is working correctly',
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Check auth status
  private async checkAuthStatus(): Promise<HealthCheckResult['checks']['auth']> {
    try {
      const isAuthenticated = await apiClient.isAuthenticated();

      if (!isAuthenticated) {
        return {
          status: HealthStatus.DEGRADED,
          message: 'User not authenticated',
          details: { isAuthenticated: false },
        };
      }

      // Try to get user profile to verify token is valid
      try {
        await apiClient.get('/auth/profile');
        return {
          status: HealthStatus.HEALTHY,
          message: 'Authentication valid',
          details: { isAuthenticated: true, tokenValid: true },
        };
      } catch {
        return {
          status: HealthStatus.DEGRADED,
          message: 'Token may be expired',
          details: { isAuthenticated: true, tokenValid: false },
        };
      }
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Auth check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async checkSupabaseHealth(): Promise<HealthCheckResult['checks']['supabase']> {
    const health = await checkSupabaseHealth();

    if (!isSupabaseConfigured) {
      return {
        status: HealthStatus.DEGRADED,
        message: 'Supabase is not configured for the app.',
        details: { configured: false },
      };
    }

    const mappedStatus =
      health.status === 'healthy'
        ? HealthStatus.HEALTHY
        : health.status === 'degraded' || health.status === 'unconfigured'
          ? HealthStatus.DEGRADED
          : HealthStatus.UNHEALTHY;

    return {
      status: mappedStatus,
      message: health.message,
      details: {
        ...health.details,
        restUrl: supabase.restUrl || undefined,
        storageUrl: supabase.storageUrl || undefined,
      },
    };
  }

  // Get device info
  private async getDeviceInfo(): Promise<HealthCheckResult['device']> {
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: Device.modelName || 'Unknown',
      brand: Device.brand || 'Unknown',
    };
  }

  // Get app info
  private getAppInfo(): HealthCheckResult['app'] {
    return {
      version: Constants.expoConfig?.version || '1.0.0',
      buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || '1',
      environment: __DEV__ ? 'development' : 'production',
    };
  }
}

// Export singleton instance
export const healthCheck = new HealthCheckService();

// Export convenience function
export const runHealthChecks = () => healthCheck.runHealthChecks();
