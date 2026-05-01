"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
const process_1 = require("process");
const ModulesCollector_1 = require("./ModulesCollector");
const sourceMapPath = process_1.argv[2];
const outputModulesPath = process_1.argv[3];
const modulesPaths = process_1.argv[4] ? process_1.argv[4].split(',') : [];
ModulesCollector_1.default.run({ sourceMapPath, outputModulesPath, modulesPaths });
//# sourceMappingURL=collectModules.js.map