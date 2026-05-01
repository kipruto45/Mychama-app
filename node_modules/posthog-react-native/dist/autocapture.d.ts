import { PostHog } from './posthog-rn';
import { PostHogAutocaptureOptions } from './types';
export declare const defaultPostHogLabelProp = "ph-label";
export declare const autocaptureFromTouchEvent: (e: any, posthog: PostHog, options?: PostHogAutocaptureOptions) => void;
