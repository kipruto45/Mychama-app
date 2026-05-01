/**
 * A Map that automatically removes entries after their TTL has expired.
 *
 * The map is Promise-aware, meaning it will start TTL countdown only after the promise has resolved.
 */
export declare class AsyncExpiringMap<K, V> {
    private _ttl;
    private _cleanupIntervalMs;
    private _map;
    private _cleanupInterval;
    constructor({ cleanupInterval, ttl, }?: {
        cleanupInterval?: number;
        ttl?: number;
    });
    /**
     * Set a key-value pair.
     */
    set(key: K, promise: PromiseLike<V> | V): void;
    /**
     * Pops a key-value pair.
     */
    pop(key: K): PromiseLike<V> | V | undefined;
    /**
     * Get a value by key.
     *
     * If the values is expired it will be returned and removed from the map.
     */
    get(key: K): PromiseLike<V> | V | undefined;
    /**
     * Check if a key exists in the map.
     *
     * If the key is expired it's not present in the map.
     */
    has(key: K): boolean;
    /**
     * Get the remaining time to live of a key.
     */
    ttl(key: K): number | undefined;
    /**
     * Remove expired entries.
     */
    cleanup(): void;
    /**
     * Clear all entries.
     */
    clear(): void;
    /**
     * Stop the cleanup interval.
     */
    stopCleanup(): void;
    /**
     * Start the cleanup interval.
     */
    startCleanup(): void;
}
//# sourceMappingURL=AsyncExpiringMap.d.ts.map