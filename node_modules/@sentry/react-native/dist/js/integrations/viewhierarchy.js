var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { debug } from '@sentry/core';
import { NATIVE } from '../wrapper';
const filename = 'view-hierarchy.json';
const contentType = 'application/json';
const attachmentType = 'event.view_hierarchy';
const INTEGRATION_NAME = 'ViewHierarchy';
/** Adds ViewHierarchy to error events */
export const viewHierarchyIntegration = () => {
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => {
            // noop
        },
        processEvent,
    };
};
function processEvent(event, hint) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const hasException = ((_a = event.exception) === null || _a === void 0 ? void 0 : _a.values) && event.exception.values.length > 0;
        if (!hasException) {
            return event;
        }
        let viewHierarchy = null;
        try {
            viewHierarchy = yield NATIVE.fetchViewHierarchy();
        }
        catch (e) {
            debug.error('Failed to get view hierarchy from native.', e);
        }
        if (viewHierarchy) {
            hint.attachments = [
                {
                    filename,
                    contentType,
                    attachmentType,
                    data: viewHierarchy,
                },
                ...((hint === null || hint === void 0 ? void 0 : hint.attachments) || []),
            ];
        }
        return event;
    });
}
//# sourceMappingURL=viewhierarchy.js.map