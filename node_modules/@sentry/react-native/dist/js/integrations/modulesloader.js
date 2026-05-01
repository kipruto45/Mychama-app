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
const INTEGRATION_NAME = 'ModulesLoader';
/** Loads runtime JS modules from prepared file. */
export const modulesLoaderIntegration = () => {
    return {
        name: INTEGRATION_NAME,
        setupOnce: () => {
            // noop
        },
        processEvent: createProcessEvent(),
    };
};
function createProcessEvent() {
    let isSetup = false;
    let modules = null;
    return (event) => __awaiter(this, void 0, void 0, function* () {
        if (!isSetup) {
            try {
                modules = yield NATIVE.fetchModules();
            }
            catch (e) {
                debug.log(`Failed to get modules from native: ${e}`);
            }
            isSetup = true;
        }
        if (modules) {
            event.modules = Object.assign(Object.assign({}, modules), event.modules);
        }
        return event;
    });
}
//# sourceMappingURL=modulesloader.js.map