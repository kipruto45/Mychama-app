export default class CircularBuffer<T> {
    private capacity;
    private buffer;
    private index;
    private _size;
    constructor(size: number);
    push(element: T): void;
    get(at: number): T;
    clear(): void;
    get size(): number;
}
//# sourceMappingURL=CircularBuffer.d.ts.map