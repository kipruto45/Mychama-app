import type { Integration, Span } from '@sentry/core';
export declare const userInteractionIntegration: () => Integration;
/**
 * Starts a new transaction for a user interaction.
 * @param userInteractionId Consists of `op` representation UI Event and `elementId` unique element identifier on current screen.
 */
export declare const startUserInteractionSpan: (userInteractionId: {
    elementId: string | undefined;
    op: string;
}) => Span | undefined;
//# sourceMappingURL=userInteraction.d.ts.map