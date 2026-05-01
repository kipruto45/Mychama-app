var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NATIVE } from '../wrapper';
const INTEGRATION_NAME = 'Screenshot';
/** Adds screenshots to error events */
export const screenshotIntegration = () => {
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => {
            // noop
        },
        processEvent,
    };
};
function processEvent(event, hint, client) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const hasException = ((_a = event.exception) === null || _a === void 0 ? void 0 : _a.values) && event.exception.values.length > 0;
        if (!hasException || ((_c = (_b = client.getOptions()).beforeScreenshot) === null || _c === void 0 ? void 0 : _c.call(_b, event, hint)) === false) {
            return event;
        }
        const screenshots = yield NATIVE.captureScreenshot();
        if (screenshots && screenshots.length > 0) {
            hint.attachments = [...screenshots, ...((hint === null || hint === void 0 ? void 0 : hint.attachments) || [])];
        }
        return event;
    });
}
//# sourceMappingURL=screenshot.js.map