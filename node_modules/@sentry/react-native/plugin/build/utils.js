"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDK_PACKAGE_NAME = exports.sdkPackage = exports.bold = exports.yellow = exports.logPrefix = exports.warnOnce = exports.writeSentryPropertiesTo = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function writeSentryPropertiesTo(filepath, sentryProperties) {
    if (!fs.existsSync(filepath)) {
        throw new Error(`Directory '${filepath}' does not exist.`);
    }
    fs.writeFileSync(path.resolve(filepath, 'sentry.properties'), sentryProperties);
}
exports.writeSentryPropertiesTo = writeSentryPropertiesTo;
const sdkPackage = require('../../package.json');
exports.sdkPackage = sdkPackage;
const SDK_PACKAGE_NAME = `${sdkPackage.name}/expo`;
exports.SDK_PACKAGE_NAME = SDK_PACKAGE_NAME;
const warningMap = new Map();
function warnOnce(message) {
    if (!warningMap.has(message)) {
        warningMap.set(message, true);
        // eslint-disable-next-line no-console
        console.warn(yellow(`${logPrefix()} ${message}`));
    }
}
exports.warnOnce = warnOnce;
function logPrefix() {
    return `› ${bold('[@sentry/react-native/expo]')}`;
}
exports.logPrefix = logPrefix;
/**
 * The same as `chalk.yellow`
 * This code is part of the SDK, we don't want to introduce a dependency on `chalk` just for this.
 */
function yellow(message) {
    return `\x1b[33m${message}\x1b[0m`;
}
exports.yellow = yellow;
/**
 * The same as `chalk.bold`
 * This code is part of the SDK, we don't want to introduce a dependency on `chalk` just for this.
 */
function bold(message) {
    return `\x1b[1m${message}\x1b[22m`;
}
exports.bold = bold;
