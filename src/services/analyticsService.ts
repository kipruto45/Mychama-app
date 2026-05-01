import { env } from '@/config/env';
import Constants from 'expo-constants';

type AnalyticsProperties = Record<string, unknown>;
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

class AnalyticsService {
  private initialized = false;
  private posthog: any = null;
  private firebaseAnalytics: any = null;

  initialize() {
    if (this.initialized) {
      return;
    }

    if (isExpoGo) {
      this.initialized = true;
      return;
    }

    try {
      this.posthog = this.tryCreatePostHogClient();
      this.firebaseAnalytics = this.tryLoadFirebaseAnalytics();
    } catch (error) {
      console.warn('Analytics service initialization failed:', error);
      this.posthog = null;
      this.firebaseAnalytics = null;
    }
    this.initialized = true;
  }

  async identify(userId: string, properties?: AnalyticsProperties) {
    this.initialize();

    try {
      if (this.posthog?.identify) {
        await this.posthog.identify(userId, properties || {});
      }
    } catch (error) {
      console.warn('PostHog identify failed:', error);
    }
  }

  async track(event: string, properties?: AnalyticsProperties) {
    this.initialize();

    try {
      if (this.posthog?.capture) {
        await this.posthog.capture(event, properties || {});
      }
    } catch (error) {
      console.warn('PostHog capture failed:', error);
    }

    try {
      if (this.firebaseAnalytics?.logEvent) {
        await this.firebaseAnalytics.logEvent(event, this.sanitizeProperties(properties));
      }
    } catch (error) {
      console.warn('Firebase analytics event failed:', error);
    }
  }

  async screen(screenName: string, properties?: AnalyticsProperties) {
    this.initialize();
    await this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });

    try {
      if (this.firebaseAnalytics?.logScreenView) {
        await this.firebaseAnalytics.logScreenView({
          screen_name: screenName,
          screen_class: screenName,
        });
      }
    } catch (error) {
      console.warn('Firebase screen tracking failed:', error);
    }
  }

  private tryCreatePostHogClient() {
    if (!env.posthogKey) {
      return null;
    }

    try {
      // Optional dependency: install posthog-react-native to enable this path.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PostHog } = require('posthog-react-native');
      return new PostHog(env.posthogKey, {
        host: env.posthogHost,
      });
    } catch (error) {
      console.warn('posthog-react-native is not installed:', error);
      return null;
    }
  }

  private tryLoadFirebaseAnalytics() {
    if (!env.firebaseAnalyticsEnabled) {
      return null;
    }

    try {
      // Optional dependency: install @react-native-firebase/analytics to enable this path.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const analyticsModule = require('@react-native-firebase/analytics');
      const factory =
        analyticsModule?.default || analyticsModule?.firebase?.analytics || analyticsModule;
      return typeof factory === 'function' ? factory() : factory;
    } catch (error) {
      console.warn('@react-native-firebase/analytics is not installed:', error);
      return null;
    }
  }

  private sanitizeProperties(properties?: AnalyticsProperties) {
    if (!properties) {
      return undefined;
    }

    return Object.fromEntries(
      Object.entries(properties).filter(([, value]) =>
        ['string', 'number', 'boolean'].includes(typeof value)
      )
    );
  }
}

export const analyticsService = new AnalyticsService();
