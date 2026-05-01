const INTEGRATION_NAME = 'EventOrigin';
/** Default EventOrigin instrumentation */
export const eventOriginIntegration = () => {
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => {
            // noop
        },
        processEvent: (event) => {
            var _a;
            event.tags = (_a = event.tags) !== null && _a !== void 0 ? _a : {};
            event.tags['event.origin'] = 'javascript';
            event.tags['event.environment'] = 'javascript';
            return event;
        },
    };
};
//# sourceMappingURL=eventorigin.js.map