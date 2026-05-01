import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { env } from '@/config/env';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error context interface
interface ErrorContext {
  userId?: string;
  screen?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

// Performance metric interface
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Breadcrumb interface
interface Breadcrumb {
  message: string;
  category: string;
  level: ErrorSeverity;
  timestamp: number;
  data?: Record<string, unknown>;
}

class MonitoringService {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private isInitialized = false;
  private sentry: any = null;

  // Initialize monitoring service
  initialize() {
    if (this.isInitialized) return;

    const isExpoGo =
      Constants.appOwnership === 'expo' ||
      Constants.executionEnvironment === 'storeClient';

    if (isExpoGo) {
      this.isInitialized = true;
      this.addBreadcrumb('Monitoring disabled in Expo Go', 'system', ErrorSeverity.LOW);
      return;
    }

    try {
      this.sentry = this.loadSentry();

      // Set up global error handler
      if (typeof ErrorUtils !== 'undefined') {
        const originalHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
          this.captureError(error, {
            metadata: { isFatal, source: 'globalHandler' },
          });
          originalHandler?.(error, isFatal);
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[Monitoring] Initialization failed:', error);
      }
    }

    this.isInitialized = true;
    this.addBreadcrumb('Monitoring service initialized', 'system', ErrorSeverity.LOW);
  }

  // Capture error
  captureError(error: Error, context?: ErrorContext) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version || 'unknown',
      ...context,
    };

    // Log to console in development
    if (__DEV__) {
      console.error('[Monitoring] Error captured:', errorData);
    }

    // Add breadcrumb
    this.addBreadcrumb(
      `Error: ${error.message}`,
      'error',
      ErrorSeverity.HIGH,
      { errorName: error.name }
    );

    // In production, send to external service (Sentry, Bugsnag, etc.)
    try {
      this.sentry?.captureException?.(error, { extra: errorData });
    } catch (sentryError) {
      if (__DEV__) {
        console.warn('[Monitoring] Failed to report error to Sentry:', sentryError);
      }
    }
  }

  // Capture message
  captureMessage(message: string, severity: ErrorSeverity = ErrorSeverity.LOW, context?: ErrorContext) {
    const messageData = {
      message,
      severity,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      ...context,
    };

    if (__DEV__) {
      console.log('[Monitoring] Message captured:', messageData);
    }

    try {
      this.sentry?.captureMessage?.(message, severity);
    } catch (error) {
      if (__DEV__) {
        console.warn('[Monitoring] Failed to report message to Sentry:', error);
      }
    }

    this.addBreadcrumb(message, 'message', severity);
  }

  // Add breadcrumb
  addBreadcrumb(
    message: string,
    category: string,
    level: ErrorSeverity = ErrorSeverity.LOW,
    data?: Record<string, unknown>
  ) {
    const breadcrumb: Breadcrumb = {
      message,
      category,
      level,
      timestamp: Date.now(),
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  // Get breadcrumbs
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  // Track performance metric
  trackPerformance(metric: PerformanceMetric) {
    if (__DEV__) {
      console.log('[Monitoring] Performance metric:', metric);
    }

    this.addBreadcrumb(
      `Performance: ${metric.name} took ${metric.duration}ms`,
      'performance',
      ErrorSeverity.LOW,
      { duration: metric.duration, ...metric.metadata }
    );
  }

  // Start performance measurement
  startPerformanceMeasure(name: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.trackPerformance({ name, duration, timestamp: startTime });
    };
  }

  // Set user context
  setUser(userId: string, email?: string, metadata?: Record<string, unknown>) {
    if (__DEV__) {
      console.log('[Monitoring] User context set:', { userId, email });
    }

    this.addBreadcrumb(
      `User context set: ${userId}`,
      'user',
      ErrorSeverity.LOW,
      { userId, email, ...metadata }
    );
  }

  // Clear user context
  clearUser() {
    this.addBreadcrumb('User context cleared', 'user', ErrorSeverity.LOW);
  }

  // Track screen view
  trackScreenView(screenName: string, params?: Record<string, unknown>) {
    try {
      this.sentry?.addBreadcrumb?.({
        category: 'navigation',
        message: screenName,
        data: params,
        level: 'info',
      });
    } catch {
      // Optional integration
    }

    this.addBreadcrumb(
      `Screen view: ${screenName}`,
      'navigation',
      ErrorSeverity.LOW,
      { screenName, ...params }
    );
  }

  // Track user action
  trackAction(action: string, category: string, metadata?: Record<string, unknown>) {
    this.addBreadcrumb(
      `Action: ${action}`,
      category,
      ErrorSeverity.LOW,
      metadata
    );
  }

  private loadSentry() {
    if (!env.sentryDsn) {
      return null;
    }

    try {
      // Optional dependency: install @sentry/react-native to enable this path.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sentry = require('@sentry/react-native');
      sentry.init({
        dsn: env.sentryDsn,
        enableAutoSessionTracking: true,
      });
      return sentry;
    } catch (error) {
      if (__DEV__) {
        console.warn('[Monitoring] @sentry/react-native is not installed:', error);
      }
      return null;
    }
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// Export convenience functions
export const captureError = (error: Error, context?: ErrorContext) =>
  monitoring.captureError(error, context);

export const captureMessage = (message: string, severity?: ErrorSeverity, context?: ErrorContext) =>
  monitoring.captureMessage(message, severity, context);

export const addBreadcrumb = (
  message: string,
  category: string,
  level?: ErrorSeverity,
  data?: Record<string, unknown>
) => monitoring.addBreadcrumb(message, category, level, data);

export const trackPerformance = (metric: PerformanceMetric) =>
  monitoring.trackPerformance(metric);

export const startPerformanceMeasure = (name: string) =>
  monitoring.startPerformanceMeasure(name);

export const setUser = (userId: string, email?: string, metadata?: Record<string, unknown>) =>
  monitoring.setUser(userId, email, metadata);

export const clearUser = () => monitoring.clearUser();

export const trackScreenView = (screenName: string, params?: Record<string, unknown>) =>
  monitoring.trackScreenView(screenName, params);

export const trackAction = (action: string, category: string, metadata?: Record<string, unknown>) =>
  monitoring.trackAction(action, category, metadata);
