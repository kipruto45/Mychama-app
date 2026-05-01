/**
 * Checks if the provided Sentry client has hooks implemented.
 * @param client The Sentry client object to check.
 * @returns True if the client has hooks, false otherwise.
 */
export function hasHooks(client) {
    return client.on !== undefined;
}
//# sourceMappingURL=clientutils.js.map