var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AsyncExpiringMap } from '../utils/AsyncExpiringMap';
const TIME_TO_DISPLAY_FALLBACK_TTL_MS = 60000;
const spanIdToTimeToInitialDisplayFallback = new AsyncExpiringMap({
    ttl: TIME_TO_DISPLAY_FALLBACK_TTL_MS,
});
export const addTimeToInitialDisplayFallback = (spanId, timestampSeconds) => {
    spanIdToTimeToInitialDisplayFallback.set(spanId, timestampSeconds);
};
export const getTimeToInitialDisplayFallback = (spanId) => __awaiter(void 0, void 0, void 0, function* () {
    return spanIdToTimeToInitialDisplayFallback.get(spanId);
});
//# sourceMappingURL=timeToDisplayFallback.js.map