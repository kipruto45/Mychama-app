import { RN_GLOBAL_OBJ } from './worldwide';
/**
 * Returns the Expo Constants module if present
 */
export function getExpoConstants() {
    var _a, _b, _c;
    return (_c = (_b = (_a = RN_GLOBAL_OBJ.expo) === null || _a === void 0 ? void 0 : _a.modules) === null || _b === void 0 ? void 0 : _b.ExponentConstants) !== null && _c !== void 0 ? _c : undefined;
}
/**
 * Returns the Expo Device module if present
 */
export function getExpoDevice() {
    var _a, _b, _c;
    return (_c = (_b = (_a = RN_GLOBAL_OBJ.expo) === null || _a === void 0 ? void 0 : _a.modules) === null || _b === void 0 ? void 0 : _b.ExpoDevice) !== null && _c !== void 0 ? _c : undefined;
}
/**
 * Returns the Expo Updates module if present
 */
export function getExpoUpdates() {
    var _a, _b, _c;
    return (_c = (_b = (_a = RN_GLOBAL_OBJ.expo) === null || _a === void 0 ? void 0 : _a.modules) === null || _b === void 0 ? void 0 : _b.ExpoUpdates) !== null && _c !== void 0 ? _c : undefined;
}
/**
 * Returns the Expo Go module if present
 */
export function getExpoGo() {
    var _a, _b, _c;
    return (_c = (_b = (_a = RN_GLOBAL_OBJ.expo) === null || _a === void 0 ? void 0 : _a.modules) === null || _b === void 0 ? void 0 : _b.ExpoGo) !== null && _c !== void 0 ? _c : undefined;
}
//# sourceMappingURL=expomodules.js.map