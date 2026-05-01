type WaitConfig = {
    delay?: number;
    advanceTimers: (delay: number) => Promise<void> | void;
};
export declare function wait(config: WaitConfig, durationInMs?: number): Promise<[void, void]> | undefined;
export {};
