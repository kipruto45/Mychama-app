"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@sentry/core");
const fs_1 = require("fs");
const path_1 = require("path");
core_1.debug.enable();
// eslint-disable-next-line @typescript-eslint/unbound-method
const { dirname, join, resolve, sep: posixSep } = path_1.posix;
/**
 * Collects JS modules from source paths.
 */
class ModulesCollector {
    /** Collect method */
    static collect(sources, modulesPaths) {
        const normalizedModulesPaths = modulesPaths.map(modulesPath => resolve(modulesPath.split(path_1.sep).join(posixSep)));
        const infos = {};
        const seen = {};
        sources.forEach((path) => {
            if (typeof path !== 'string') {
                return;
            }
            let dir = path; // included source file path
            let candidate = null;
            /** Traverse directories upward in the search of all package.json files */
            const upDirSearch = () => {
                const parentDir = dir;
                dir = dirname(parentDir);
                if (normalizedModulesPaths.includes(resolve(dir))) {
                    if ((candidate === null || candidate === void 0 ? void 0 : candidate.name) && (candidate === null || candidate === void 0 ? void 0 : candidate.version)) {
                        infos[candidate.name] = candidate.version;
                    }
                    else if (candidate === null || candidate === void 0 ? void 0 : candidate.name) {
                        infos[candidate.name] = 'unknown';
                    }
                    return;
                }
                if (!dir || parentDir === dir || seen[dir]) {
                    return;
                }
                seen[dir] = true;
                const pkgPath = join(dir, 'package.json');
                if (!(0, fs_1.existsSync)(pkgPath)) {
                    // fast-forward if the package.json doesn't exist
                    return upDirSearch();
                }
                try {
                    const info = JSON.parse((0, fs_1.readFileSync)(pkgPath, 'utf8'));
                    candidate = {
                        name: info.name,
                        version: info.version,
                    };
                }
                catch (error) {
                    core_1.debug.error(`Failed to read ${pkgPath}`);
                }
                return upDirSearch(); // processed package.json file, continue up search
            };
            upDirSearch();
        });
        return infos;
    }
    /**
     * Runs collection of modules.
     */
    static run({ sourceMapPath, outputModulesPath, modulesPaths, collect, }) {
        if (!sourceMapPath) {
            core_1.debug.error('First argument `source-map-path` is missing!');
            return;
        }
        if (!outputModulesPath) {
            core_1.debug.error('Second argument `modules-output-path` is missing!');
            return;
        }
        if (!modulesPaths || modulesPaths.length === 0) {
            core_1.debug.error('Third argument `modules-paths` is missing!');
            return;
        }
        core_1.debug.log('Reading source map from', sourceMapPath);
        core_1.debug.log('Saving modules to', outputModulesPath);
        core_1.debug.log('Resolving modules from paths', modulesPaths.join(', '));
        if (!(0, fs_1.existsSync)(sourceMapPath)) {
            core_1.debug.error(`Source map file does not exist at ${sourceMapPath}`);
            return;
        }
        for (const modulesPath of modulesPaths) {
            if (!(0, fs_1.existsSync)(modulesPath)) {
                core_1.debug.error(`Modules path does not exist at ${modulesPath}`);
                return;
            }
        }
        const map = JSON.parse((0, fs_1.readFileSync)(sourceMapPath, 'utf8'));
        if (!map.sources || !Array.isArray(map.sources)) {
            core_1.debug.error(`Modules not collected. No sources found in the source map (${sourceMapPath})!`);
            return;
        }
        const sources = map.sources;
        const modules = collect ? collect(sources, modulesPaths) : ModulesCollector.collect(sources, modulesPaths);
        const outputModulesDirPath = dirname(outputModulesPath);
        if (!(0, fs_1.existsSync)(outputModulesDirPath)) {
            (0, fs_1.mkdirSync)(outputModulesDirPath, { recursive: true });
        }
        (0, fs_1.writeFileSync)(outputModulesPath, JSON.stringify(modules, null, 2));
        core_1.debug.log(`Modules collected and saved to: ${outputModulesPath}`);
    }
}
exports.default = ModulesCollector;
//# sourceMappingURL=ModulesCollector.js.map