import type { SingleCSSTransitionConfig, TimeUnit } from '../types';
export declare function splitByComma(str: string): string[];
export declare function splitByWhitespace(str: string): string[];
type ParsedShorthandSingleTransitionConfig = Omit<SingleCSSTransitionConfig, 'transitionProperty' | 'transitionTimingFunction'> & {
    transitionProperty?: string;
    transitionTimingFunction?: string;
};
export declare function parseSingleTransitionShorthand(value: string): ParsedShorthandSingleTransitionConfig;
export declare function normalizeTimeUnit(timeUnit: TimeUnit): number | null;
export {};
//# sourceMappingURL=parsers.d.ts.map