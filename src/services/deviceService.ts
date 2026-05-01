/**
 * Device Management Service
 * 
 * Handles device fingerprinting, trusted device management,
 * and security notifications for the frontend.
 */

import { apiClient } from '@/api/client';
import { Platform } from 'react-native';
import { storage } from '@/utils/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface DeviceInfo {
  fingerprint: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  userAgent: string;
  isTrusted: boolean;
  trustedAt?: string;
  expiresAt?: string;
  lastUsedAt: string;
}

export interface LoginAttempt {
  id: string;
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ============================================================================
// DEVICE SERVICE CLASS
// ============================================================================

class DeviceService {
  private deviceFingerprint: string | null = null;

  // ==========================================================================
  // DEVICE FINGERPRINTING
  // ==========================================================================

  /**
   * Generate device fingerprint from device characteristics
   */
  async generateFingerprint(): Promise<string> {
    if (this.deviceFingerprint) {
      return this.deviceFingerprint;
    }

    try {
      // Get device info
      const deviceInfo = await this.getDeviceInfo();
      
      // Create fingerprint from device characteristics
      const components = [
        deviceInfo.userAgent,
        Platform.OS,
        Platform.Version,
        deviceInfo.deviceType,
      ].filter(Boolean);

      const fingerprintData = components.join('|');
      
      // Simple hash function (in production, use a proper hash)
      let hash = 0;
      for (let i = 0; i < fingerprintData.length; i++) {
        const char = fingerprintData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }

      this.deviceFingerprint = `device_${Math.abs(hash).toString(16)}`;
      
      // Store fingerprint for future use
      await storage.setItem('device_fingerprint', this.deviceFingerprint);
      
      return this.deviceFingerprint;
    } catch (error) {
      console.error('Failed to generate device fingerprint:', error);
      // Fallback to random fingerprint
      const randomFingerprint = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.deviceFingerprint = randomFingerprint;
      return randomFingerprint;
    }
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<{
    userAgent: string;
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    deviceName: string;
  }> {
    const userAgent = Platform.select({
      ios: 'iOS',
      android: 'Android',
      default: 'Unknown',
    });

    const deviceType = Platform.select({
      ios: 'mobile',
      android: 'mobile',
      default: 'unknown',
    }) as 'mobile' | 'tablet' | 'desktop' | 'unknown';

    const deviceName = Platform.select({
      ios: 'iPhone',
      android: 'Android Device',
      default: 'Unknown Device',
    });

    return {
      userAgent: `${userAgent} ${Platform.Version}`,
      deviceType,
      deviceName,
    };
  }

  /**
   * Get stored device fingerprint
   */
  async getStoredFingerprint(): Promise<string | null> {
    try {
      return await storage.getItem('device_fingerprint');
    } catch (error) {
      console.error('Failed to get stored fingerprint:', error);
      return null;
    }
  }

  // ==========================================================================
  // TRUSTED DEVICE MANAGEMENT
  // ==========================================================================

  /**
   * Get all trusted devices for current user
   */
  async getTrustedDevices(): Promise<DeviceInfo[]> {
    try {
      const response = await apiClient.get<DeviceInfo[]>('/v1/security/trusted-devices');
      return response;
    } catch (error) {
      console.error('Failed to get trusted devices:', error);
      return [];
    }
  }

  /**
   * Trust current device
   */
  async trustDevice(deviceName?: string): Promise<boolean> {
    try {
      const fingerprint = await this.generateFingerprint();
      const deviceInfo = await this.getDeviceInfo();

      await apiClient.post('/v1/security/trusted-devices', {
        fingerprint,
        device_name: deviceName || deviceInfo.deviceName,
        device_type: deviceInfo.deviceType,
        user_agent: deviceInfo.userAgent,
      });

      return true;
    } catch (error) {
      console.error('Failed to trust device:', error);
      return false;
    }
  }

  /**
   * Revoke trust for a device
   */
  async revokeDeviceTrust(deviceId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/v1/security/trusted-devices/${deviceId}`);
      return true;
    } catch (error) {
      console.error('Failed to revoke device trust:', error);
      return false;
    }
  }

  /**
   * Revoke trust for all devices except current
   */
  async revokeAllTrustedDevices(): Promise<boolean> {
    try {
      await apiClient.post('/v1/security/trusted-devices/revoke-all');
      return true;
    } catch (error) {
      console.error('Failed to revoke all trusted devices:', error);
      return false;
    }
  }

  /**
   * Check if current device is trusted
   */
  async isCurrentDeviceTrusted(): Promise<boolean> {
    try {
      const fingerprint = await this.generateFingerprint();
      const response = await apiClient.get<{ is_trusted: boolean }>(
        `/v1/security/trusted-devices/check?fingerprint=${fingerprint}`
      );
      return response.is_trusted;
    } catch (error) {
      console.error('Failed to check device trust:', error);
      return false;
    }
  }

  // ==========================================================================
  // LOGIN HISTORY
  // ==========================================================================

  /**
   * Get login history for current user
   */
  async getLoginHistory(limit: number = 20): Promise<LoginAttempt[]> {
    try {
      const response = await apiClient.get<LoginAttempt[]>(
        `/v1/security/login-history?limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get login history:', error);
      return [];
    }
  }

  /**
   * Get security events for current user
   */
  async getSecurityEvents(limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const response = await apiClient.get<SecurityEvent[]>(
        `/v1/security/events?limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }

  // ==========================================================================
  // SECURITY NOTIFICATIONS
  // ==========================================================================

  /**
   * Mark security notification as read
   */
  async markNotificationRead(notificationId: string): Promise<boolean> {
    try {
      await apiClient.post(`/v1/security/notifications/${notificationId}/read`);
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Get unread security notification count
   */
  async getUnreadNotificationCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ count: number }>(
        '/v1/security/notifications/unread-count'
      );
      return response.count;
    } catch (error) {
      console.error('Failed to get unread notification count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const deviceService = new DeviceService();
