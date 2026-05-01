'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var app = require('@firebase/app');
var component = require('@firebase/component');
var util = require('@firebase/util');
var logger$1 = require('@firebase/logger');

const name = "@firebase/data-connect";
const version = "0.6.0";

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** The semver (www.semver.org) version of the SDK. */
let SDK_VERSION = '';
/**
 * SDK_VERSION should be set before any database instance is created
 * @internal
 */
function setSDKVersion(version) {
    SDK_VERSION = version;
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Code = {
    OTHER: 'other',
    ALREADY_INITIALIZED: 'already-initialized',
    NOT_INITIALIZED: 'not-initialized',
    NOT_SUPPORTED: 'not-supported',
    INVALID_ARGUMENT: 'invalid-argument',
    PARTIAL_ERROR: 'partial-error',
    UNAUTHORIZED: 'unauthorized'
};
/** An error returned by a DataConnect operation. */
class DataConnectError extends util.FirebaseError {
    constructor(code, message) {
        super(code, message);
        /** @internal */
        this.name = 'DataConnectError';
        // Ensure the instanceof operator works as expected on subclasses of Error.
        // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types
        // and https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
        Object.setPrototypeOf(this, DataConnectError.prototype);
    }
    /** @internal */
    toString() {
        return `${this.name}[code=${this.code}]: ${this.message}`;
    }
}
/** An error returned by a DataConnect operation. */
class DataConnectOperationError extends DataConnectError {
    /** @hideconstructor */
    constructor(message, response) {
        super(Code.PARTIAL_ERROR, message);
        /** @internal */
        this.name = 'DataConnectOperationError';
        this.response = response;
    }
}

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class EntityDataObject {
    getServerValue(key) {
        return this.serverValues[key];
    }
    constructor(globalID) {
        this.globalID = globalID;
        this.serverValues = {};
        this.referencedFrom = new Set();
    }
    getServerValues() {
        return this.serverValues;
    }
    toJSON() {
        return {
            globalID: this.globalID,
            map: this.serverValues,
            referencedFrom: Array.from(this.referencedFrom)
        };
    }
    static fromJSON(json) {
        const edo = new EntityDataObject(json.globalID);
        edo.serverValues = json.map;
        edo.referencedFrom = new Set(json.referencedFrom);
        return edo;
    }
    updateServerValue(key, value, requestedFrom) {
        this.serverValues[key] = value;
        this.referencedFrom.add(requestedFrom);
        return Array.from(this.referencedFrom);
    }
}

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class InMemoryCacheProvider {
    constructor(_keyId) {
        this._keyId = _keyId;
        this.edos = new Map();
        this.resultTrees = new Map();
    }
    async setResultTree(queryId, rt) {
        this.resultTrees.set(queryId, rt);
    }
    async getResultTree(queryId) {
        return this.resultTrees.get(queryId);
    }
    async updateEntityData(entityData) {
        this.edos.set(entityData.globalID, entityData);
    }
    async getEntityData(globalId) {
        if (!this.edos.has(globalId)) {
            this.edos.set(globalId, new EntityDataObject(globalId));
        }
        // Because of the above, we can guarantee that there will be an EDO at the globalId.
        return this.edos.get(globalId);
    }
    close() {
        // No-op
        return Promise.resolve();
    }
}

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const GLOBAL_ID_KEY = '_id';
const OBJECT_LISTS_KEY = '_objectLists';
const REFERENCES_KEY = '_references';
const SCALARS_KEY = '_scalars';
const ENTITY_DATA_KEYS_KEY = '_entity_data_keys';
class EntityNode {
    constructor() {
        this.scalars = {};
        this.references = {};
        this.objectLists = {};
        this.entityDataKeys = new Set();
    }
    async loadData(queryId, values, entityIds, acc, cacheProvider) {
        if (values === undefined) {
            return;
        }
        if (typeof values !== 'object' || Array.isArray(values)) {
            throw new DataConnectError(Code.INVALID_ARGUMENT, 'EntityNode initialized with non-object value');
        }
        if (values === null) {
            return;
        }
        if (typeof values === 'object' &&
            entityIds &&
            entityIds[GLOBAL_ID_KEY] &&
            typeof entityIds[GLOBAL_ID_KEY] === 'string') {
            this.globalId = entityIds[GLOBAL_ID_KEY];
            this.entityData = await cacheProvider.getEntityData(this.globalId);
        }
        for (const key in values) {
            if (values.hasOwnProperty(key)) {
                if (typeof values[key] === 'object') {
                    if (Array.isArray(values[key])) {
                        const ids = entityIds && entityIds[key];
                        const objArray = [];
                        const scalarArray = [];
                        for (const [index, value] of values[key].entries()) {
                            if (typeof value === 'object') {
                                if (Array.isArray(value)) ;
                                else {
                                    const entityNode = new EntityNode();
                                    await entityNode.loadData(queryId, value, ids && ids[index], acc, cacheProvider);
                                    objArray.push(entityNode);
                                }
                            }
                            else {
                                scalarArray.push(value);
                            }
                        }
                        if (scalarArray.length > 0 && objArray.length > 0) {
                            this.scalars[key] = values[key];
                        }
                        else if (scalarArray.length > 0) {
                            if (this.entityData) {
                                const impactedRefs = this.entityData.updateServerValue(key, scalarArray, queryId);
                                this.entityDataKeys.add(key);
                                acc.add(impactedRefs);
                            }
                            else {
                                this.scalars[key] = scalarArray;
                            }
                        }
                        else if (objArray.length > 0) {
                            this.objectLists[key] = objArray;
                        }
                        else {
                            this.scalars[key] = [];
                        }
                    }
                    else {
                        if (values[key] === null) {
                            this.scalars[key] = null;
                            continue;
                        }
                        const entityNode = new EntityNode();
                        // TODO: Load Data might need to be pushed into ResultTreeProcessor instead.
                        await entityNode.loadData(queryId, values[key], entityIds && entityIds[key], acc, cacheProvider);
                        this.references[key] = entityNode;
                    }
                }
                else {
                    if (this.entityData) {
                        const impactedRefs = this.entityData.updateServerValue(key, values[key], queryId);
                        this.entityDataKeys.add(key);
                        acc.add(impactedRefs);
                    }
                    else {
                        this.scalars[key] = values[key];
                    }
                }
            }
        }
        if (this.entityData) {
            await cacheProvider.updateEntityData(this.entityData);
        }
    }
    toJSON(mode) {
        const resultObject = {};
        if (mode === EncodingMode.hydrated) {
            if (this.entityData) {
                for (const key of this.entityDataKeys) {
                    resultObject[key] = this.entityData.getServerValue(key);
                }
            }
            if (this.scalars) {
                Object.assign(resultObject, this.scalars);
            }
            if (this.references) {
                for (const key in this.references) {
                    if (this.references.hasOwnProperty(key)) {
                        resultObject[key] = this.references[key].toJSON(mode);
                    }
                }
            }
            if (this.objectLists) {
                for (const key in this.objectLists) {
                    if (this.objectLists.hasOwnProperty(key)) {
                        resultObject[key] = this.objectLists[key].map(obj => obj.toJSON(mode));
                    }
                }
            }
            return resultObject;
        }
        else {
            // Get JSON representation of dehydrated list
            if (this.entityData) {
                resultObject[GLOBAL_ID_KEY] = this.entityData.globalID;
            }
            resultObject[ENTITY_DATA_KEYS_KEY] = Array.from(this.entityDataKeys);
            if (this.scalars) {
                resultObject[SCALARS_KEY] = this.scalars;
            }
            if (this.references) {
                const references = {};
                for (const key in this.references) {
                    if (this.references.hasOwnProperty(key)) {
                        references[key] = this.references[key].toJSON(mode);
                    }
                }
                resultObject[REFERENCES_KEY] = references;
            }
            if (this.objectLists) {
                const objectLists = {};
                for (const key in this.objectLists) {
                    if (this.objectLists.hasOwnProperty(key)) {
                        objectLists[key] = this.objectLists[key].map(obj => obj.toJSON(mode));
                    }
                }
                resultObject[OBJECT_LISTS_KEY] = objectLists;
            }
        }
        return resultObject;
    }
    static fromJson(obj) {
        const sdo = new EntityNode();
        if (obj.backingData) {
            sdo.entityData = EntityDataObject.fromJSON(obj.backingData);
        }
        sdo.globalId = obj.globalID;
        sdo.scalars = obj.scalars;
        if (obj.references) {
            const references = {};
            for (const key in obj.references) {
                if (obj.references.hasOwnProperty(key)) {
                    references[key] = EntityNode.fromJson(obj.references[key]);
                }
            }
            sdo.references = references;
        }
        if (obj.objectLists) {
            const objectLists = {};
            for (const key in obj.objectLists) {
                if (obj.objectLists.hasOwnProperty(key)) {
                    objectLists[key] = obj.objectLists[key].map(obj => EntityNode.fromJson(obj));
                }
            }
            sdo.objectLists = objectLists;
        }
        return sdo;
    }
}
// Helpful for storing in persistent cache, which is not available yet.
var EncodingMode;
(function (EncodingMode) {
    EncodingMode[EncodingMode["hydrated"] = 0] = "hydrated";
    EncodingMode[EncodingMode["dehydrated"] = 1] = "dehydrated";
})(EncodingMode || (EncodingMode = {}));

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ResultTree {
    /**
     * Create a {@link ResultTree} from a dehydrated JSON object.
     * @param value The dehydrated JSON object.
     * @returns The {@link ResultTree}.
     */
    static fromJson(value) {
        return new ResultTree(EntityNode.fromJson(value.rootStub), value.maxAge, value.cachedAt, value.lastAccessed);
    }
    constructor(rootStub, maxAge = 0, cachedAt, _lastAccessed) {
        this.rootStub = rootStub;
        this.maxAge = maxAge;
        this.cachedAt = cachedAt;
        this._lastAccessed = _lastAccessed;
    }
    isStale() {
        return (Date.now() - new Date(this.cachedAt.getTime()).getTime() >
            this.maxAge * 1000);
    }
    updateMaxAge(maxAgeInSeconds) {
        this.maxAge = maxAgeInSeconds;
    }
    updateAccessed() {
        this._lastAccessed = new Date();
    }
    get lastAccessed() {
        return this._lastAccessed;
    }
    getRootStub() {
        return this.rootStub;
    }
}

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ImpactedQueryRefsAccumulator {
    constructor(queryId) {
        this.queryId = queryId;
        this.impacted = new Set();
    }
    add(impacted) {
        impacted
            .filter(ref => ref !== this.queryId)
            .forEach(ref => this.impacted.add(ref));
    }
    consumeEvents() {
        const events = Array.from(this.impacted);
        this.impacted.clear();
        return events;
    }
}

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ResultTreeProcessor {
    /**
     * Hydrate the EntityNode into a JSON object so that it can be returned to the user.
     * @param rootStubObject
     * @returns {string}
     */
    hydrateResults(rootStubObject) {
        return rootStubObject.toJSON(EncodingMode.hydrated);
    }
    /**
     * Dehydrate results so that they can be stored in the cache.
     * @param json
     * @param entityIds
     * @param cacheProvider
     * @param queryId
     * @returns {Promise<DehydratedResults>}
     */
    async dehydrateResults(json, entityIds, cacheProvider, queryId) {
        const acc = new ImpactedQueryRefsAccumulator(queryId);
        const entityNode = new EntityNode();
        await entityNode.loadData(queryId, json, entityIds, acc, cacheProvider);
        return {
            entityNode,
            impacted: acc.consumeEvents()
        };
    }
}

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class DataConnectCache {
    constructor(authProvider, projectId, connectorConfig, host, cacheSettings) {
        this.authProvider = authProvider;
        this.projectId = projectId;
        this.connectorConfig = connectorConfig;
        this.host = host;
        this.cacheSettings = cacheSettings;
        this.cacheProvider = null;
        this.uid = null;
        this.authProvider.addTokenChangeListener(async (_) => {
            const newUid = this.authProvider.getAuth().getUid();
            // We should only close if the token changes and so does the new UID
            if (this.uid !== newUid) {
                this.cacheProvider?.close();
                this.uid = newUid;
                const identifier = await this.getIdentifier(this.uid);
                this.cacheProvider = this.initializeNewProviders(identifier);
            }
        });
    }
    async initialize() {
        if (!this.cacheProvider) {
            const identifier = await this.getIdentifier(this.uid);
            this.cacheProvider = this.initializeNewProviders(identifier);
        }
    }
    async getIdentifier(uid) {
        const identifier = `${'memory' // TODO: replace this with indexeddb when persistence is available.
        }-${this.projectId}-${this.connectorConfig.service}-${this.connectorConfig.connector}-${this.connectorConfig.location}-${uid}-${this.host}`;
        const sha256 = await util.generateSHA256Hash(identifier);
        return sha256;
    }
    initializeNewProviders(identifier) {
        return this.cacheSettings.cacheProvider.initialize(identifier);
    }
    async containsResultTree(queryId) {
        await this.initialize();
        const resultTree = await this.cacheProvider.getResultTree(queryId);
        return resultTree !== undefined;
    }
    async getResultTree(queryId) {
        await this.initialize();
        return this.cacheProvider.getResultTree(queryId);
    }
    async getResultJSON(queryId) {
        await this.initialize();
        const processor = new ResultTreeProcessor();
        const cacheProvider = this.cacheProvider;
        const resultTree = await cacheProvider.getResultTree(queryId);
        if (!resultTree) {
            throw new DataConnectError(Code.INVALID_ARGUMENT, `${queryId} not found in cache. Call "update()" first.`);
        }
        return processor.hydrateResults(resultTree.getRootStub());
    }
    async update(queryId, serverValues, entityIds) {
        await this.initialize();
        const processor = new ResultTreeProcessor();
        const cacheProvider = this.cacheProvider;
        const { entityNode: stubDataObject, impacted } = await processor.dehydrateResults(serverValues, entityIds, cacheProvider, queryId);
        const now = new Date();
        await cacheProvider.setResultTree(queryId, new ResultTree(stubDataObject, serverValues.maxAge || this.cacheSettings.maxAgeSeconds, now, now));
        return impacted;
    }
}
class MemoryStub {
    constructor() {
        this.type = 'MEMORY';
    }
    /**
     * @internal
     */
    initialize(cacheId) {
        return new InMemoryCacheProvider(cacheId);
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @internal
 * Abstraction around AppCheck's token fetching capabilities.
 */
class AppCheckTokenProvider {
    constructor(app$1, appCheckProvider) {
        this.appCheckProvider = appCheckProvider;
        if (app._isFirebaseServerApp(app$1) && app$1.settings.appCheckToken) {
            this.serverAppAppCheckToken = app$1.settings.appCheckToken;
        }
        this.appCheck = appCheckProvider?.getImmediate({ optional: true });
        if (!this.appCheck) {
            void appCheckProvider
                ?.get()
                .then(appCheck => (this.appCheck = appCheck))
                .catch();
        }
    }
    getToken() {
        if (this.serverAppAppCheckToken) {
            return Promise.resolve({ token: this.serverAppAppCheckToken });
        }
        if (!this.appCheck) {
            return new Promise((resolve, reject) => {
                // Support delayed initialization of FirebaseAppCheck. This allows our
                // customers to initialize the RTDB SDK before initializing Firebase
                // AppCheck and ensures that all requests are authenticated if a token
                // becomes available before the timoeout below expires.
                setTimeout(() => {
                    if (this.appCheck) {
                        this.getToken().then(resolve, reject);
                    }
                    else {
                        resolve(null);
                    }
                }, 0);
            });
        }
        return this.appCheck.getToken();
    }
    addTokenChangeListener(listener) {
        void this.appCheckProvider
            ?.get()
            .then(appCheck => appCheck.addTokenListener(listener));
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const logger = new logger$1.Logger('@firebase/data-connect');
function setLogLevel(logLevel) {
    logger.setLogLevel(logLevel);
}
function logDebug(msg) {
    logger.debug(`DataConnect (${SDK_VERSION}): ${msg}`);
}
function logError(msg) {
    logger.error(`DataConnect (${SDK_VERSION}): ${msg}`);
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// @internal
class FirebaseAuthProvider {
    constructor(_appName, _options, _authProvider) {
        this._appName = _appName;
        this._options = _options;
        this._authProvider = _authProvider;
        this._auth = _authProvider.getImmediate({ optional: true });
        if (!this._auth) {
            _authProvider.onInit(auth => (this._auth = auth));
        }
    }
    getAuth() {
        return this._auth;
    }
    getToken(forceRefresh) {
        if (!this._auth) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (this._auth) {
                        this.getToken(forceRefresh).then(resolve, reject);
                    }
                    else {
                        resolve(null);
                    }
                }, 0);
            });
        }
        return this._auth.getToken(forceRefresh).catch(error => {
            if (error && error.code === 'auth/token-not-initialized') {
                logDebug('Got auth/token-not-initialized error.  Treating as null token.');
                return null;
            }
            else {
                logError('Error received when attempting to retrieve token: ' +
                    JSON.stringify(error));
                return Promise.reject(error);
            }
        });
    }
    addTokenChangeListener(listener) {
        this._auth?.addAuthTokenListener(listener);
    }
    removeTokenChangeListener(listener) {
        this._authProvider
            .get()
            .then(auth => auth.removeAuthTokenListener(listener))
            .catch(err => logError(err));
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const QUERY_STR = 'query';
const MUTATION_STR = 'mutation';
const SOURCE_SERVER = 'SERVER';
const SOURCE_CACHE = 'CACHE';

/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function parseEntityIds(result) {
    // Iterate through extensions.dataConnect
    const dataConnectExtensions = result.extensions?.dataConnect;
    const dataCopy = Object.assign(result);
    if (!dataConnectExtensions) {
        return dataCopy;
    }
    const ret = {};
    for (const extension of dataConnectExtensions) {
        const { path } = extension;
        populatePath(path, ret, extension);
    }
    return ret;
}
// mutates the object to update the path
function populatePath(path, toUpdate, extension) {
    let curObj = toUpdate;
    for (const slice of path) {
        if (typeof curObj[slice] !== 'object') {
            curObj[slice] = {};
        }
        curObj = curObj[slice];
    }
    if ('entityId' in extension && extension.entityId) {
        curObj['_id'] = extension.entityId;
    }
    else if ('entityIds' in extension) {
        const entityArr = extension.entityIds;
        for (let i = 0; i < entityArr.length; i++) {
            const entityId = entityArr[i];
            if (typeof curObj[i] === 'undefined') {
                curObj[i] = {};
            }
            curObj[i]._id = entityId;
        }
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let encoderImpl;
let decoderImpl;
function setEncoder(encoder) {
    encoderImpl = encoder;
}
function setDecoder(decoder) {
    decoderImpl = decoder;
}
function sortKeysForObj(o) {
    return Object.keys(o)
        .sort()
        .reduce((accumulator, currentKey) => {
        accumulator[currentKey] = o[currentKey];
        return accumulator;
    }, {});
}
setEncoder((o) => JSON.stringify(sortKeysForObj(o)));
setDecoder(s => sortKeysForObj(JSON.parse(s)));

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function getRefSerializer(queryRef, data, source, fetchTime) {
    return function toJSON() {
        return {
            data,
            refInfo: {
                name: queryRef.name,
                variables: queryRef.variables,
                connectorConfig: {
                    projectId: queryRef.dataConnect.app.options.projectId,
                    ...queryRef.dataConnect.getSettings()
                }
            },
            fetchTime,
            source
        };
    };
}
class QueryManager {
    async preferCacheResults(queryRef, allowStale = false) {
        let cacheResult;
        try {
            cacheResult = await this.fetchCacheResults(queryRef, allowStale);
        }
        catch (e) {
            // Ignore the error and try to fetch from the server.
        }
        if (cacheResult) {
            return cacheResult;
        }
        return this.fetchServerResults(queryRef);
    }
    constructor(transport, dc, cache) {
        this.transport = transport;
        this.dc = dc;
        this.cache = cache;
        this.callbacks = new Map();
        /**
         * Map of serialized query keys to most recent Query Result. Used as a simple fallback cache
         * for subsciptions if caching is not enabled.
         */
        this.subscriptionCache = new Map();
        this.queue = [];
    }
    async waitForQueuedWrites() {
        for (const promise of this.queue) {
            await promise;
        }
        this.queue = [];
    }
    updateSSR(updatedData) {
        this.queue.push(this.updateCache(updatedData).then(async (result) => this.publishCacheResultsToSubscribers(result, updatedData.fetchTime)));
    }
    async updateCache(result, extensions) {
        await this.waitForQueuedWrites();
        if (this.cache) {
            const entityIds = parseEntityIds(result);
            const updatedMaxAge = getMaxAgeFromExtensions(extensions);
            if (updatedMaxAge !== undefined) {
                this.cache.cacheSettings.maxAgeSeconds = updatedMaxAge;
            }
            return this.cache.update(encoderImpl({
                name: result.ref.name,
                variables: result.ref.variables,
                refType: QUERY_STR
            }), result.data, entityIds);
        }
        else {
            const key = encoderImpl({
                name: result.ref.name,
                variables: result.ref.variables,
                refType: QUERY_STR
            });
            this.subscriptionCache.set(key, result);
            return [key];
        }
    }
    addSubscription(queryRef, onResultCallback, onCompleteCallback, onErrorCallback, initialCache) {
        const key = encoderImpl({
            name: queryRef.name,
            variables: queryRef.variables,
            refType: QUERY_STR
        });
        const unsubscribe = () => {
            if (this.callbacks.has(key)) {
                const callbackList = this.callbacks.get(key);
                const newList = callbackList.filter(callback => callback !== subscription);
                this.callbacks.set(key, newList);
                if (newList.length === 0) {
                    this.callbacks.delete(key);
                    this.transport.invokeUnsubscribe(queryRef.name, queryRef.variables);
                }
                onCompleteCallback?.();
            }
        };
        const subscription = {
            userCallback: onResultCallback,
            errCallback: onErrorCallback,
            unsubscribe
        };
        if (initialCache) {
            this.updateSSR(initialCache);
        }
        const promise = this.preferCacheResults(queryRef, /*allowStale=*/ true);
        // We want to ignore the error and let subscriptions handle it
        promise.then(undefined, err => { });
        if (this.callbacks.has(key)) {
            this.callbacks
                .get(key)
                .push(subscription);
        }
        else {
            this.callbacks.set(key, [
                subscription
            ]);
            // only invoke subscription if we don't already have an active subscription
            this.transport.invokeSubscribe(this.makeSubscribeObserver(queryRef), queryRef.name, queryRef.variables);
        }
        return unsubscribe;
    }
    async fetchServerResults(queryRef) {
        await this.waitForQueuedWrites();
        const key = encoderImpl({
            name: queryRef.name,
            variables: queryRef.variables,
            refType: QUERY_STR
        });
        try {
            const result = await this.transport.invokeQuery(queryRef.name, queryRef.variables);
            const fetchTime = Date.now().toString();
            const originalExtensions = result.extensions;
            const queryResult = {
                ...result,
                ref: queryRef,
                source: SOURCE_SERVER,
                fetchTime,
                data: result.data,
                extensions: getDataConnectExtensionsWithoutMaxAge(originalExtensions),
                toJSON: getRefSerializer(queryRef, result.data, SOURCE_SERVER, fetchTime)
            };
            const updatedKeys = await this.updateCache(queryResult, originalExtensions?.dataConnect);
            this.publishDataToSubscribers(key, queryResult);
            if (this.cache) {
                await this.publishCacheResultsToSubscribers(updatedKeys, fetchTime);
            }
            else {
                this.subscriptionCache.set(key, queryResult);
            }
            return queryResult;
        }
        catch (e) {
            this.publishErrorToSubscribers(key, e);
            throw e;
        }
    }
    async fetchCacheResults(queryRef, allowStale = false) {
        await this.waitForQueuedWrites();
        let result;
        if (!this.cache) {
            result = await this.getFromSubscriberCache(queryRef);
        }
        else {
            result = await this.getFromResultTreeCache(queryRef, allowStale);
        }
        if (!result) {
            throw new DataConnectError(Code.OTHER, 'No cache entry found for query: ' + queryRef.name);
        }
        const fetchTime = Date.now().toString();
        const queryResult = {
            ...result,
            ref: queryRef,
            source: SOURCE_CACHE,
            fetchTime,
            data: result.data,
            extensions: result.extensions,
            toJSON: getRefSerializer(queryRef, result.data, SOURCE_CACHE, fetchTime)
        };
        if (this.cache) {
            const key = encoderImpl({
                name: queryRef.name,
                variables: queryRef.variables,
                refType: QUERY_STR
            });
            await this.publishCacheResultsToSubscribers([key], fetchTime);
        }
        else {
            const key = encoderImpl({
                name: queryRef.name,
                variables: queryRef.variables,
                refType: QUERY_STR
            });
            this.subscriptionCache.set(key, queryResult);
            this.publishDataToSubscribers(key, queryResult);
        }
        return queryResult;
    }
    publishErrorToSubscribers(key, err) {
        this.callbacks.get(key)?.forEach(subscription => {
            if (subscription.errCallback) {
                subscription.errCallback(err);
            }
        });
    }
    async getFromResultTreeCache(queryRef, allowStale = false) {
        const key = encoderImpl({
            name: queryRef.name,
            variables: queryRef.variables,
            refType: QUERY_STR
        });
        if (!this.cache || !(await this.cache.containsResultTree(key))) {
            return null;
        }
        const cacheResult = (await this.cache.getResultJSON(key));
        const resultTree = await this.cache.getResultTree(key);
        if (!allowStale && resultTree.isStale()) {
            return null;
        }
        const result = {
            source: SOURCE_CACHE,
            ref: queryRef,
            data: cacheResult,
            toJSON: getRefSerializer(queryRef, cacheResult, SOURCE_CACHE, resultTree.cachedAt.toString()),
            fetchTime: resultTree.cachedAt.toString()
        };
        (await this.cache.getResultTree(key)).updateAccessed();
        return result;
    }
    async getFromSubscriberCache(queryRef) {
        const key = encoderImpl({
            name: queryRef.name,
            variables: queryRef.variables,
            refType: QUERY_STR
        });
        if (!this.subscriptionCache.has(key)) {
            return;
        }
        const result = this.subscriptionCache.get(key);
        result.source = SOURCE_CACHE;
        result.toJSON = getRefSerializer(result.ref, result.data, SOURCE_CACHE, result.fetchTime);
        return result;
    }
    /** Call the registered onNext callbacks for the given key */
    publishDataToSubscribers(key, queryResult) {
        if (!this.callbacks.has(key)) {
            return;
        }
        const subscribers = this.callbacks.get(key);
        subscribers.forEach(callback => {
            callback.userCallback(queryResult);
        });
    }
    async publishCacheResultsToSubscribers(impactedQueries, fetchTime) {
        if (!this.cache) {
            return;
        }
        for (const query of impactedQueries) {
            const callbacks = this.callbacks.get(query);
            if (!callbacks) {
                continue;
            }
            const newJson = (await this.cache.getResultTree(query))
                .getRootStub()
                .toJSON(EncodingMode.hydrated);
            const { name, variables } = decoderImpl(query);
            const queryRef = {
                dataConnect: this.dc,
                refType: QUERY_STR,
                name,
                variables
            };
            this.publishDataToSubscribers(query, {
                data: newJson,
                fetchTime,
                ref: queryRef,
                source: SOURCE_CACHE,
                toJSON: getRefSerializer(queryRef, newJson, SOURCE_CACHE, fetchTime)
            });
        }
    }
    enableEmulator(host, port) {
        this.transport.useEmulator(host, port);
    }
    /**
     * Create a new {@link SubscribeObserver} for the given QueryRef. This will be passed to
     * {@link DataConnectTransportInterface.invokeSubscribe | invokeSubscribe()} to notify the query
     * layer of data update notifications or if the stream disconnected.
     */
    makeSubscribeObserver(queryRef) {
        const key = encoderImpl({
            name: queryRef.name,
            variables: queryRef.variables,
            refType: QUERY_STR
        });
        return {
            onData: async (response) => {
                await this.handleStreamNotification(key, response, queryRef);
            },
            onDisconnect: (code, reason) => {
                this.handleStreamDisconnect(key, code, reason);
            },
            onError: error => {
                this.publishErrorToSubscribers(key, error);
            }
        };
    }
    /**
     * Handle a data update notification from the stream. Notify subscribers of results/errors, and
     * update the cache.
     */
    async handleStreamNotification(key, response, queryRef) {
        if (response.errors && response.errors.length > 0) {
            const stringified = JSON.stringify(response.errors.map(e => {
                if (e && typeof e === 'object') {
                    return {
                        message: e.message,
                        code: e.code
                    };
                }
                return e;
            }));
            const failureResponse = {
                errors: response.errors,
                data: response.data
            };
            const error = new DataConnectOperationError('DataConnect error received from subscribe notification: ' +
                stringified, failureResponse);
            this.publishErrorToSubscribers(key, error);
            return;
        }
        const fetchTime = Date.now().toString();
        const queryResult = {
            ref: queryRef,
            source: SOURCE_SERVER,
            fetchTime,
            data: response.data,
            extensions: getDataConnectExtensionsWithoutMaxAge(response.extensions),
            toJSON: getRefSerializer(queryRef, response.data, SOURCE_SERVER, fetchTime)
        };
        const updatedKeys = await this.updateCache(queryResult, response.extensions?.dataConnect);
        this.publishDataToSubscribers(key, queryResult);
        if (this.cache) {
            await this.publishCacheResultsToSubscribers(updatedKeys, fetchTime);
        }
    }
    /**
     * Handle a disconnect from the stream. Unsubscribe all callbacks for the given key.
     */
    handleStreamDisconnect(key, code, reason) {
        const error = new DataConnectError(code, reason);
        this.publishErrorToSubscribers(key, error);
        const callbacks = this.callbacks.get(key);
        if (callbacks) {
            [...callbacks].forEach(cb => cb.unsubscribe());
        }
        return;
    }
}
function getMaxAgeFromExtensions(extensions) {
    if (!extensions) {
        return;
    }
    for (const extension of extensions) {
        if ('maxAge' in extension &&
            extension.maxAge !== undefined &&
            extension.maxAge !== null) {
            if (extension.maxAge.endsWith('s')) {
                return Number(extension.maxAge.substring(0, extension.maxAge.length - 1));
            }
        }
    }
}
function getDataConnectExtensionsWithoutMaxAge(extensions) {
    return {
        dataConnect: extensions.dataConnect?.filter(extension => 'entityId' in extension || 'entityIds' in extension)
    };
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const CallerSdkTypeEnum = {
    Base: 'Base', // Core JS SDK
    Generated: 'Generated', // Generated JS SDK
    TanstackReactCore: 'TanstackReactCore', // Tanstack non-generated React SDK
    GeneratedReact: 'GeneratedReact', // Tanstack non-generated Angular SDK
    TanstackAngularCore: 'TanstackAngularCore', // Tanstack non-generated Angular SDK
    GeneratedAngular: 'GeneratedAngular' // Generated Angular SDK
};
/**
 * Constructs the value for the X-Goog-Api-Client header
 * @internal
 */
function getGoogApiClientValue$1(isUsingGen, callerSdkType) {
    let str = 'gl-js/ fire/' + SDK_VERSION;
    if (callerSdkType !== CallerSdkTypeEnum.Base &&
        callerSdkType !== CallerSdkTypeEnum.Generated) {
        str += ' js/' + callerSdkType.toLowerCase();
    }
    else if (isUsingGen || callerSdkType === CallerSdkTypeEnum.Generated) {
        str += ' js/gen';
    }
    return str;
}
/**
 * The base class for all DataConnectTransportInterface implementations. Handles common logic such as
 * URL construction, auth token management, and emulator usage. Concrete transport implementations
 * should extend this class and implement the abstract {@link DataConnectTransportInterface} methods.
 * @internal
 */
class AbstractDataConnectTransport {
    constructor(options, apiKey, appId, authProvider, appCheckProvider, transportOptions, _isUsingGen = false, _callerSdkType = CallerSdkTypeEnum.Base) {
        this.apiKey = apiKey;
        this.appId = appId;
        this.authProvider = authProvider;
        this.appCheckProvider = appCheckProvider;
        this._isUsingGen = _isUsingGen;
        this._callerSdkType = _callerSdkType;
        this._host = '';
        this._location = 'l';
        this._connectorName = '';
        this._secure = true;
        this._project = 'p';
        this._authToken = null;
        this._appCheckToken = null;
        this._lastToken = null;
        this._isUsingEmulator = false;
        if (transportOptions) {
            if (typeof transportOptions.port === 'number') {
                this._port = transportOptions.port;
            }
            if (typeof transportOptions.sslEnabled !== 'undefined') {
                this._secure = transportOptions.sslEnabled;
            }
            this._host = transportOptions.host;
        }
        const { location, projectId: project, connector, service } = options;
        if (location) {
            this._location = location;
        }
        if (project) {
            this._project = project;
        }
        this._serviceName = service;
        if (!connector) {
            throw new DataConnectError(Code.INVALID_ARGUMENT, 'Connector Name required!');
        }
        this._connectorName = connector;
        this._connectorResourcePath = `projects/${this._project}/locations/${this._location}/services/${this._serviceName}/connectors/${this._connectorName}`;
        this.authProvider?.addTokenChangeListener(token => {
            logDebug(`New Token Available: ${token}`);
            this.onAuthTokenChanged(token);
        });
        this.appCheckProvider?.addTokenChangeListener(result => {
            const { token } = result;
            logDebug(`New App Check Token Available: ${token}`);
            this._appCheckToken = token;
        });
    }
    useEmulator(host, port, isSecure) {
        this._host = host;
        this._isUsingEmulator = true;
        if (typeof port === 'number') {
            this._port = port;
        }
        if (typeof isSecure !== 'undefined') {
            this._secure = isSecure;
        }
    }
    async getWithAuth(forceToken = false) {
        let starterPromise = new Promise(resolve => resolve(this._authToken));
        if (this.appCheckProvider) {
            const appCheckToken = await this.appCheckProvider.getToken();
            if (appCheckToken) {
                this._appCheckToken = appCheckToken.token;
            }
        }
        if (this.authProvider) {
            starterPromise = this.authProvider
                .getToken(/*forceToken=*/ forceToken)
                .then(data => {
                if (!data) {
                    return null;
                }
                this._authToken = data.accessToken;
                return this._authToken;
            });
        }
        else {
            starterPromise = new Promise(resolve => resolve(''));
        }
        return starterPromise;
    }
    async withRetry(promiseFactory, retry = false) {
        let isNewToken = false;
        return this.getWithAuth(retry)
            .then(res => {
            isNewToken = this._lastToken !== res;
            this._lastToken = res;
            return res;
        })
            .then(promiseFactory)
            .catch(err => {
            // Only retry if the result is unauthorized and the last token isn't the same as the new one.
            if ('code' in err &&
                err.code === Code.UNAUTHORIZED &&
                !retry &&
                isNewToken) {
                logDebug('Retrying due to unauthorized');
                return this.withRetry(promiseFactory, true);
            }
            throw err;
        });
    }
    _setLastToken(lastToken) {
        this._lastToken = lastToken;
    }
    _setCallerSdkType(callerSdkType) {
        this._callerSdkType = callerSdkType;
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** The fetch implementation to be used by the {@link RESTTransport}. */
let connectFetch = globalThis.fetch;
function getGoogApiClientValue(_isUsingGen, _callerSdkType) {
    let str = 'gl-js/ fire/' + SDK_VERSION;
    if (_callerSdkType !== CallerSdkTypeEnum.Base &&
        _callerSdkType !== CallerSdkTypeEnum.Generated) {
        str += ' js/' + _callerSdkType.toLowerCase();
    }
    else if (_isUsingGen || _callerSdkType === CallerSdkTypeEnum.Generated) {
        str += ' js/gen';
    }
    return str;
}
async function dcFetch(url, body, { signal }, appId, accessToken, appCheckToken, _isUsingGen, _callerSdkType, _isUsingEmulator) {
    if (!connectFetch) {
        throw new DataConnectError(Code.OTHER, 'No Fetch Implementation detected!');
    }
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Client': getGoogApiClientValue(_isUsingGen, _callerSdkType)
    };
    if (accessToken) {
        headers['X-Firebase-Auth-Token'] = accessToken;
    }
    if (appId) {
        headers['x-firebase-gmpid'] = appId;
    }
    if (appCheckToken) {
        headers['X-Firebase-AppCheck'] = appCheckToken;
    }
    const bodyStr = JSON.stringify(body);
    const fetchOptions = {
        body: bodyStr,
        method: 'POST',
        headers,
        signal
    };
    if (util.isCloudWorkstation(url) && _isUsingEmulator) {
        fetchOptions.credentials = 'include';
    }
    let response;
    try {
        response = await connectFetch(url, fetchOptions);
    }
    catch (err) {
        const message = err && typeof err === 'object' && 'message' in err
            ? err['message']
            : String(err);
        throw new DataConnectError(Code.OTHER, 'Failed to fetch: ' + message);
    }
    let jsonResponse;
    try {
        jsonResponse = await response.json();
    }
    catch (e) {
        const message = e && typeof e === 'object' && 'message' in e
            ? e['message']
            : String(e);
        throw new DataConnectError(Code.OTHER, 'Failed to parse JSON response: ' + message);
    }
    const message = getErrorMessage(jsonResponse);
    if (response.status >= 400) {
        logError('Error while performing request: ' + JSON.stringify(jsonResponse));
        if (response.status === 401) {
            throw new DataConnectError(Code.UNAUTHORIZED, message);
        }
        throw new DataConnectError(Code.OTHER, message);
    }
    if (jsonResponse.errors && jsonResponse.errors.length) {
        const stringified = JSON.stringify(jsonResponse.errors);
        const failureResponse = {
            errors: jsonResponse.errors,
            data: jsonResponse.data
        };
        throw new DataConnectOperationError('DataConnect error while performing request: ' + stringified, failureResponse);
    }
    if (!jsonResponse.extensions) {
        jsonResponse.extensions = {
            dataConnect: []
        };
    }
    return jsonResponse;
}
function getErrorMessage(obj) {
    if ('message' in obj && obj.message) {
        return obj.message;
    }
    return JSON.stringify(obj);
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const PROD_HOST = 'firebasedataconnect.googleapis.com';
const WEBSOCKET_PATH = 'ws/google.firebase.dataconnect.v1.ConnectorStreamService';
function restUrlBuilder(projectConfig, transportOptions) {
    const { connector, location, projectId: project, service } = projectConfig;
    const { host, sslEnabled, port } = transportOptions;
    const protocol = sslEnabled ? 'https' : 'http';
    const realHost = host || PROD_HOST;
    let baseUrl = `${protocol}://${realHost}`;
    if (typeof port === 'number') {
        baseUrl += `:${port}`;
    }
    else if (typeof port !== 'undefined') {
        logError('Port type is of an invalid type');
        throw new DataConnectError(Code.INVALID_ARGUMENT, 'Incorrect type for port passed in!');
    }
    return `${baseUrl}/v1/projects/${project}/locations/${location}/services/${service}/connectors/${connector}`;
}
function websocketUrlBuilder(projectConfig, transportOptions) {
    const { location } = projectConfig;
    const { host, sslEnabled, port } = transportOptions;
    const protocol = sslEnabled ? 'wss' : 'ws';
    const realHost = host || PROD_HOST;
    let baseUrl = `${protocol}://${realHost}`;
    if (typeof port === 'number') {
        baseUrl += `:${port}`;
    }
    else if (typeof port !== 'undefined') {
        logError('Port type is of an invalid type');
        throw new DataConnectError(Code.INVALID_ARGUMENT, 'Incorrect type for port passed in!');
    }
    return `${baseUrl}/${WEBSOCKET_PATH}/Connect/locations/${location}`;
}
function addToken(url, apiKey) {
    if (!apiKey) {
        return url;
    }
    const newUrl = new URL(url);
    newUrl.searchParams.append('key', apiKey);
    return newUrl.toString();
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Fetch-based REST implementation of {@link AbstractDataConnectTransport}.
 * @internal
 */
class RESTTransport extends AbstractDataConnectTransport {
    constructor(options, apiKey, appId, authProvider, appCheckProvider, transportOptions, _isUsingGen = false, _callerSdkType = CallerSdkTypeEnum.Base) {
        super(options, apiKey, appId, authProvider, appCheckProvider, transportOptions, _isUsingGen, _callerSdkType);
        this.invokeQuery = (queryName, body) => {
            const abortController = new AbortController();
            // TODO(mtewani): Update to proper value
            const withAuth = this.withRetry(() => dcFetch(addToken(`${this.endpointUrl}:executeQuery`, this.apiKey), {
                name: this._connectorResourcePath,
                operationName: queryName,
                variables: body
            }, abortController, this.appId, this._authToken, this._appCheckToken, this._isUsingGen, this._callerSdkType, this._isUsingEmulator));
            return withAuth;
        };
        this.invokeMutation = (mutationName, body) => {
            const abortController = new AbortController();
            const taskResult = this.withRetry(() => {
                return dcFetch(addToken(`${this.endpointUrl}:executeMutation`, this.apiKey), {
                    name: this._connectorResourcePath,
                    operationName: mutationName,
                    variables: body
                }, abortController, this.appId, this._authToken, this._appCheckToken, this._isUsingGen, this._callerSdkType, this._isUsingEmulator);
            });
            return taskResult;
        };
    }
    get endpointUrl() {
        return restUrlBuilder({
            connector: this._connectorName,
            location: this._location,
            projectId: this._project,
            service: this._serviceName
        }, {
            host: this._host,
            sslEnabled: this._secure,
            port: this._port
        });
    }
    invokeSubscribe(observer, queryName, body) {
        throw new DataConnectError(Code.NOT_SUPPORTED, 'Subscriptions are not supported using REST!');
    }
    invokeUnsubscribe(queryName, body) {
        throw new DataConnectError(Code.NOT_SUPPORTED, 'Unsubscriptions are not supported using REST!');
    }
    onAuthTokenChanged(newToken) {
        this._authToken = newToken;
    }
}

/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** The request id of the first request over the stream */
const FIRST_REQUEST_ID = 1;
/** Time to wait before closing an idle connection (no active subscriptions) */
const IDLE_CONNECTION_TIMEOUT_MS = 60 * 1000; // 1 minute
/**
 * The base class for all {@link DataConnectStreamTransport | Stream Transport} implementations.
 * Handles management of logical streams (requests), authentication, data routing to query layer, etc.
 * @internal
 */
class AbstractDataConnectStreamTransport extends AbstractDataConnectTransport {
    constructor() {
        super(...arguments);
        this.pendingClose = false;
        /** True if the transport is unable to connect to the server */
        this.isUnableToConnect = false;
        /** The request ID of the next message to be sent. Monotonically increasing sequence number. */
        this.requestNumber = FIRST_REQUEST_ID;
        /**
         * Map of query/variables to their active execute/resume request bodies.
         */
        this.activeQueryExecuteRequests = new Map();
        /**
         * Map of mutation/variables to their active execute request bodies.
         */
        this.activeMutationExecuteRequests = new Map();
        /**
         * Map of query/variables to their active subscribe request bodies.
         */
        this.activeSubscribeRequests = new Map();
        /**
         * Map of active execution RequestIds and their corresponding Promises and resolvers.
         */
        this.executeRequestPromises = new Map();
        /**
         * Map of active subscription RequestIds and their corresponding observers.
         */
        this.subscribeObservers = new Map();
        /** current close timeout from setTimeout(), if any */
        this.closeTimeout = null;
        /** has the close timeout finished? */
        this.closeTimeoutFinished = false;
        /** Flag to ensure we wait for the initial auth state once per connection attempt. */
        this.hasWaitedForInitialAuth = false;
        /**
         * Tracks if the next message to be sent is the first message of the stream.
         */
        this.isFirstStreamMessage = true;
        /**
         * Tracks the last auth token sent to the server.
         * Used to detect if the token has changed and needs to be resent.
         */
        this.lastSentAuthToken = null;
    }
    /** Is the stream currently waiting to close connection? */
    get isPendingClose() {
        return this.pendingClose;
    }
    /** True if there are active subscriptions on the stream */
    get hasActiveSubscriptions() {
        return this.activeSubscribeRequests.size > 0;
    }
    /** True if there are active execute or mutation requests on the stream */
    get hasActiveExecuteRequests() {
        return (this.activeQueryExecuteRequests.size > 0 ||
            this.activeMutationExecuteRequests.size > 0);
    }
    /**
     * Generates and returns the next request ID.
     */
    nextRequestId() {
        return (this.requestNumber++).toString();
    }
    /**
     * Tracks a query execution request, storing the request body and creating and storing a promise that
     * will be resolved when the response is received.
     * @returns The reject function and the response promise.
     *
     * @remarks
     * This method returns a promise, but is synchronous.
     */
    trackQueryExecuteRequest(requestId, mapKey, executeBody) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let resolveFn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let rejectFn;
        const responsePromise = new Promise((resolve, reject) => {
            resolveFn = resolve;
            rejectFn = reject;
        });
        const executeRequestPromise = {
            responsePromise,
            resolveFn: resolveFn,
            rejectFn: rejectFn
        };
        this.activeQueryExecuteRequests.set(mapKey, executeBody);
        this.executeRequestPromises.set(requestId, executeRequestPromise);
        return executeRequestPromise;
    }
    /**
     * Tracks a mutation execution request, storing the request body and creating and storing a promise
     * that will be resolved when the response is received.
     * @returns The reject function and the response promise.
     *
     * @remarks
     * This method returns a promise, but is synchronous.
     */
    trackMutationExecuteRequest(requestId, mapKey, executeBody) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let resolveFn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let rejectFn;
        const responsePromise = new Promise((resolve, reject) => {
            resolveFn = resolve;
            rejectFn = reject;
        });
        const executeRequestPromise = {
            responsePromise,
            resolveFn: resolveFn,
            rejectFn: rejectFn
        };
        const activeRequests = this.activeMutationExecuteRequests.get(mapKey) || [];
        activeRequests.push(executeBody);
        this.activeMutationExecuteRequests.set(mapKey, activeRequests);
        this.executeRequestPromises.set(requestId, executeRequestPromise);
        return executeRequestPromise;
    }
    /**
     * Tracks a subscribe request, storing the request body and the notification observer.
     * @remarks
     * This method is synchronous.
     */
    trackSubscribeRequest(requestId, mapKey, subscribeBody, observer) {
        this.activeSubscribeRequests.set(mapKey, subscribeBody);
        this.subscribeObservers.set(requestId, observer);
    }
    /**
     * Cleans up the query execute request tracking data structures, deleting the tracked request and
     * it's associated promise.
     */
    cleanupQueryExecuteRequest(requestId, mapKey) {
        this.activeQueryExecuteRequests.delete(mapKey);
        this.executeRequestPromises.delete(requestId);
    }
    /**
     * Cleans up the mutation execute request tracking data structures, deleting the tracked request and
     * it's associated promise.
     */
    cleanupMutationExecuteRequest(requestId, mapKey) {
        const executeRequests = this.activeMutationExecuteRequests.get(mapKey);
        if (executeRequests) {
            const updatedRequests = executeRequests.filter(req => req.requestId !== requestId);
            if (updatedRequests.length > 0) {
                this.activeMutationExecuteRequests.set(mapKey, updatedRequests);
            }
            else {
                this.activeMutationExecuteRequests.delete(mapKey);
            }
        }
        this.executeRequestPromises.delete(requestId);
    }
    /**
     * Cleans up the subscribe request tracking data structures, deleting the tracked request and
     * it's associated promise.
     */
    cleanupSubscribeRequest(requestId, mapKey) {
        this.activeSubscribeRequests.delete(mapKey);
        this.subscribeObservers.delete(requestId);
    }
    /**
     * Indicates whether we should include the auth token in the next message.
     * Only true if there is an auth token and it is different from the last sent auth token, or this
     * is the first message.
     */
    get shouldIncludeAuth() {
        return (this.isFirstStreamMessage ||
            (!!this._authToken && this._authToken !== this.lastSentAuthToken));
    }
    /**
     * Called by the concrete transport implementation when the physical connection is ready.
     */
    onConnectionReady() {
        this.isFirstStreamMessage = true;
        this.lastSentAuthToken = null;
        this.hasWaitedForInitialAuth = false;
    }
    /**
     * Attempt to close the connection. Will only close if there are no active requests preventing it
     * from doing so.
     */
    async attemptClose() {
        if (this.hasActiveSubscriptions || this.hasActiveExecuteRequests) {
            return;
        }
        this.cancelClose();
        await this.closeConnection();
        this.onGracefulStreamClose?.();
    }
    /**
     * Begin closing the connection. Waits for and cleans up all active requests, and waits for
     * {@link IDLE_CONNECTION_TIMEOUT_MS}. This is a graceful close - it will be called when there are
     * no more active subscriptions, so there's no need to cleanup.
     */
    prepareToCloseGracefully() {
        if (this.pendingClose) {
            return;
        }
        this.pendingClose = true;
        this.closeTimeoutFinished = false;
        this.closeTimeout = setTimeout(() => {
            this.closeTimeoutFinished = true;
            void this.attemptClose();
        }, IDLE_CONNECTION_TIMEOUT_MS);
    }
    /**
     * Cancel closing the connection.
     */
    cancelClose() {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
        }
        this.pendingClose = false;
        this.closeTimeoutFinished = false;
    }
    /**
     * Reject all active execute promises and notify all subscribe observers with the given error.
     * Clear active request tracking maps without cancelling or re-invoking any requests.
     */
    rejectAllActiveRequests(code, reason) {
        this.activeQueryExecuteRequests.clear();
        this.activeMutationExecuteRequests.clear();
        this.activeSubscribeRequests.clear();
        const error = new DataConnectError(code, reason);
        for (const [requestId, { rejectFn }] of this.executeRequestPromises) {
            this.executeRequestPromises.delete(requestId);
            rejectFn(error);
        }
        for (const [requestId, observer] of this.subscribeObservers) {
            this.subscribeObservers.delete(requestId);
            observer.onDisconnect(code, reason);
        }
    }
    /**
     * Called by concrete implementations when the stream is successfully closed, gracefully or otherwise.
     */
    onStreamClose(code, reason) {
        this.rejectAllActiveRequests(Code.OTHER, `Stream disconnected with code ${code}: ${reason}`);
    }
    /**
     * Prepares a stream request message by adding necessary headers and metadata.
     * If this is the first message on the stream, it includes the resource name, auth token, and App Check token.
     * If the auth token has refreshed since the last message, it includes the new auth token.
     *
     * This method is called by the concrete transport implementation before sending a message.
     *
     * @returns the requestBody, with attached headers and initial request fields
     */
    prepareMessage(requestBody) {
        const preparedRequestBody = { ...requestBody };
        const headers = {};
        if (this.appId) {
            headers['x-firebase-gmpid'] = this.appId;
        }
        headers['X-Goog-Api-Client'] = getGoogApiClientValue$1(this._isUsingGen, this._callerSdkType);
        if (this.shouldIncludeAuth && this._authToken) {
            headers['X-Firebase-Auth-Token'] = this._authToken;
            this.lastSentAuthToken = this._authToken;
        }
        if (this.isFirstStreamMessage) {
            if (this._appCheckToken) {
                headers['X-Firebase-App-Check'] = this._appCheckToken;
            }
            preparedRequestBody.name = this._connectorResourcePath;
        }
        preparedRequestBody.headers = headers;
        this.isFirstStreamMessage = false;
        return preparedRequestBody;
    }
    // TODO(stephenarosaj): just make this async
    /**
     * Sends a request message to the server via the concrete implementation.
     * Ensures the connection is ready and prepares the message before sending.
     * @returns A promise that resolves when the request message has been sent.
     */
    async sendRequestMessage(requestBody) {
        if (!this.hasWaitedForInitialAuth && this.authProvider) {
            await this.getWithAuth();
            this.hasWaitedForInitialAuth = true;
        }
        if (this.streamIsReady) {
            const prepared = this.prepareMessage(requestBody);
            return this.sendMessage(prepared);
        }
        return this.ensureConnection().then(() => {
            const prepared = this.prepareMessage(requestBody);
            return this.sendMessage(prepared);
        });
    }
    /**
     * Helper to generate a consistent string key for the tracking maps.
     */
    getMapKey(operationName, variables) {
        const sortedVariables = this.sortObjectKeys(variables);
        return JSON.stringify({ operationName, variables: sortedVariables });
    }
    /**
     * Recursively sorts the keys of an object.
     */
    sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
            return obj;
        }
        const sortedObj = {};
        Object.keys(obj)
            .sort()
            .forEach(key => {
            sortedObj[key] = this.sortObjectKeys(obj[key]);
        });
        return sortedObj;
    }
    /**
     * @inheritdoc
     * @remarks
     * This method synchronously updates the request tracking data structures before sending any message.
     * If any asynchronous functionality is added to this function, it MUST be done in a way that
     * preserves the synchronous update of the tracking data structures before the method returns.
     */
    invokeQuery(queryName, variables) {
        const requestId = this.nextRequestId();
        const activeRequestKey = { operationName: queryName, variables };
        const mapKey = this.getMapKey(queryName, variables);
        const executeBody = {
            requestId,
            execute: activeRequestKey
        };
        let { responsePromise, rejectFn } = this.trackQueryExecuteRequest(requestId, mapKey, executeBody);
        responsePromise = responsePromise.finally(() => {
            this.cleanupQueryExecuteRequest(requestId, mapKey);
            if (!this.hasActiveSubscriptions &&
                !this.hasActiveExecuteRequests &&
                this.closeTimeoutFinished) {
                void this.attemptClose();
            }
        });
        // asynchronous, fire and forget
        this.sendRequestMessage(executeBody).catch(err => {
            rejectFn(err);
        });
        return responsePromise;
    }
    /**
     * @inheritdoc
     * @remarks
     * This method synchronously updates the request tracking data structures before sending any message.
     * If any asynchronous functionality is added to this function, it MUST be done in a way that
     * preserves the synchronous update of the tracking data structures before the method returns.
     */
    invokeMutation(mutationName, variables) {
        const requestId = this.nextRequestId();
        const activeRequestKey = { operationName: mutationName, variables };
        const mapKey = this.getMapKey(mutationName, variables);
        const executeBody = {
            requestId,
            execute: activeRequestKey
        };
        let { responsePromise, rejectFn } = this.trackMutationExecuteRequest(requestId, mapKey, executeBody);
        responsePromise = responsePromise.finally(() => {
            this.cleanupMutationExecuteRequest(requestId, mapKey);
            if (!this.hasActiveSubscriptions &&
                !this.hasActiveExecuteRequests &&
                this.closeTimeoutFinished) {
                void this.attemptClose();
            }
        });
        // asynchronous, fire and forget
        this.sendRequestMessage(executeBody).catch(err => {
            rejectFn(err);
        });
        return responsePromise;
    }
    /**
     * @inheritdoc
     * @remarks
     * This method synchronously updates the request tracking data structures before sending any message
     * or cancelling the closing of the stream. If any asynchronous functionality is added to this function,
     * it MUST be done in a way that preserves the synchronous update of the tracking data structures
     * before the method returns.
     */
    invokeSubscribe(observer, queryName, variables) {
        // if we are waiting to close the stream, cancel closing!
        this.cancelClose();
        const requestId = this.nextRequestId();
        const activeRequestKey = { operationName: queryName, variables };
        const mapKey = this.getMapKey(queryName, variables);
        const subscribeBody = {
            requestId,
            subscribe: activeRequestKey
        };
        this.trackSubscribeRequest(requestId, mapKey, subscribeBody, observer);
        // asynchronous, fire and forget
        this.sendRequestMessage(subscribeBody).catch(err => {
            observer.onError(err instanceof Error ? err : new Error(String(err)));
            this.cleanupSubscribeRequest(requestId, mapKey);
            if (!this.hasActiveSubscriptions) {
                this.prepareToCloseGracefully();
            }
        });
    }
    /**
     * @inheritdoc
     * @remarks
     * This method synchronously updates the request tracking data structures before sending any message.
     * If any asynchronous functionality is added to this function, it MUST be done in a way that
     * preserves the synchronous update of the tracking data structures before the method returns.
     */
    invokeUnsubscribe(queryName, variables) {
        const mapKey = this.getMapKey(queryName, variables);
        const subscribeRequest = this.activeSubscribeRequests.get(mapKey);
        if (!subscribeRequest) {
            return;
        }
        const requestId = subscribeRequest.requestId;
        const cancelBody = {
            requestId,
            cancel: {}
        };
        this.cleanupSubscribeRequest(requestId, mapKey);
        // asynchronous, fire and forget
        this.sendRequestMessage(cancelBody).catch(err => {
            logError(`Stream Transport failed to send unsubscribe message: ${err}`);
        });
        if (!this.hasActiveSubscriptions) {
            this.prepareToCloseGracefully();
        }
    }
    onAuthTokenChanged(newToken) {
        const oldAuthToken = this._authToken;
        this._authToken = newToken;
        const oldAuthUid = this.authUid;
        const newAuthUid = this.authProvider?.getAuth()?.getUid();
        this.authUid = newAuthUid;
        // onAuthTokenChanged gets called by the auth provider once it initializes, so we must make sure
        // we don't prematurely disconnect the stream if this is the initial call.
        const isInitialAuth = oldAuthUid === undefined;
        if (isInitialAuth) {
            return;
        }
        if ((oldAuthToken && newToken === null) || // user logged out
            (!oldAuthUid && newAuthUid) || // user logged in
            (oldAuthUid && newAuthUid !== oldAuthUid) // logged in user changed
        ) {
            this.rejectAllActiveRequests(Code.UNAUTHORIZED, 'Stream disconnected due to auth change.');
            void this.attemptClose();
        }
    }
    /**
     * Handle a response message from the server. Called by the connection-specific implementation after
     * it's transformed a message from the server into a {@link DataConnectResponse}.
     * @param requestId the requestId associated with this response.
     * @param response the response from the server.
     */
    async handleResponse(requestId, response) {
        if (this.executeRequestPromises.has(requestId)) {
            // don't clean up the tracking maps here, they're handled automatically when the execute promise settles
            const { resolveFn, rejectFn } = this.executeRequestPromises.get(requestId);
            if (response.errors && response.errors.length) {
                const failureResponse = {
                    errors: response.errors,
                    data: response.data
                };
                const stringified = JSON.stringify(response.errors);
                rejectFn(new DataConnectOperationError('DataConnect error while performing request: ' + stringified, failureResponse));
            }
            else {
                resolveFn(response);
            }
        }
        else if (this.subscribeObservers.has(requestId)) {
            const observer = this.subscribeObservers.get(requestId);
            await observer.onData(response);
        }
        else {
            throw new DataConnectError(Code.OTHER, `Stream response contained unrecognized requestId '${requestId}'`);
        }
    }
}

/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** The WebSocket implementation to be used by the {@link WebSocketTransport}. */
let connectWebSocket = globalThis.WebSocket;
/**
 * The code used to close the WebSocket connection.
 * This is a protocol-level code, and is not the same as the {@link Code | DataConnect error code}.
 * @internal
 */
const WEBSOCKET_CLOSE_CODE = 1000;
/**
 * An {@link AbstractDataConnectStreamTransport | Stream Transport} implementation that uses {@link WebSocket | WebSockets} to stream requests and responses.
 * This class handles the lifecycle of the WebSocket connection, including automatic
 * reconnection and request correlation.
 * @internal
 */
class WebSocketTransport extends AbstractDataConnectStreamTransport {
    get endpointUrl() {
        return websocketUrlBuilder({
            connector: this._connectorName,
            location: this._location,
            projectId: this._project,
            service: this._serviceName
        }, {
            host: this._host,
            sslEnabled: this._secure,
            port: this._port
        });
    }
    /**
     * Decodes a WebSocket response from a Uint8Array to a JSON object.
     * Emulator does not send messages as Uint8Arrays, but prod does.
     */
    decodeBinaryResponse(data) {
        if (!this.decoder) {
            this.decoder = new TextDecoder('utf-8');
        }
        return this.decoder.decode(data);
    }
    get streamIsReady() {
        return this.connection?.readyState === WebSocket.OPEN;
    }
    constructor(options, apiKey, appId, authProvider, appCheckProvider, transportOptions, _isUsingGen = false, _callerSdkType = CallerSdkTypeEnum.Base) {
        super(options, apiKey, appId, authProvider, appCheckProvider, transportOptions, _isUsingGen, _callerSdkType);
        this.apiKey = apiKey;
        this.appId = appId;
        this.authProvider = authProvider;
        this.appCheckProvider = appCheckProvider;
        this._isUsingGen = _isUsingGen;
        this._callerSdkType = _callerSdkType;
        /** Decodes binary WebSocket responses to strings */
        this.decoder = undefined;
        /** The current connection to the server. Undefined if disconnected. */
        this.connection = undefined;
        /**
         * Current connection attempt. If null, we are not currently attemping to connect (not connected,
         * or already connected). Will be resolved or rejected when the connection is opened or fails to open.
         */
        this.connectionAttempt = null;
    }
    ensureConnection() {
        try {
            if (this.streamIsReady) {
                return Promise.resolve();
            }
            if (this.connectionAttempt) {
                return this.connectionAttempt;
            }
            this.connectionAttempt = new Promise((resolve, reject) => {
                if (!connectWebSocket) {
                    throw new DataConnectError(Code.OTHER, 'No WebSocket Implementation detected!');
                }
                const ws = new connectWebSocket(this.endpointUrl);
                this.connection = ws;
                this.connection.binaryType = 'arraybuffer';
                ws.onopen = () => {
                    this.isUnableToConnect = false;
                    this.onConnectionReady();
                    resolve();
                };
                ws.onerror = event => {
                    this.connectionAttempt = null;
                    this.isUnableToConnect = true;
                    const error = new DataConnectError(Code.OTHER, `Error using WebSocket connection, closing WebSocket`);
                    this.handleError(error);
                    reject(error);
                };
                ws.onmessage = ev => this.handleWebSocketMessage(ev).catch(async (reason) => {
                    this.handleError(reason);
                });
                ws.onclose = ev => this.handleWebsocketDisconnect(ev);
            });
            return this.connectionAttempt;
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    openConnection() {
        return this.ensureConnection().catch(err => {
            throw new DataConnectError(Code.OTHER, `Failed to open connection: ${err}`);
        });
    }
    closeConnection(code, reason) {
        if (!this.connection) {
            this.connectionAttempt = null;
            return Promise.resolve();
        }
        let error;
        try {
            if (reason) {
                // reason string can be max 123 bytes (not characters, bytes)
                // https://developer.mozilla.org/en-US/docs/Web/API/WebSocketStream/close#parameters
                const MAX_BYTES = 123;
                const encoder = new TextEncoder();
                const bytes = encoder.encode(reason);
                if (bytes.length <= MAX_BYTES) {
                    this.connection.close(code, reason);
                }
                else {
                    const buf = new Uint8Array(MAX_BYTES);
                    const { read } = encoder.encodeInto(reason, buf);
                    const truncatedReason = reason.substring(0, read);
                    this.connection.close(code, truncatedReason);
                }
            }
            else {
                this.connection.close(code);
            }
        }
        catch (e) {
            error = e;
        }
        finally {
            this.connection = undefined;
            this.connectionAttempt = null;
        }
        if (error) {
            return Promise.reject(error);
        }
        return Promise.resolve();
    }
    /**
     * Handle a disconnection from the server. Initiates graceful clean up and reconnection attempts.
     * @param ev the {@link CloseEvent} that closed the WebSocket.
     */
    handleWebsocketDisconnect(ev) {
        this.connection = undefined;
        this.connectionAttempt = null;
        this.onStreamClose(ev.code, ev.reason);
    }
    /**
     * Handle an error that occurred on the WebSocket. Close the connection and reject all active requests.
     */
    handleError(error) {
        logError(`DataConnect WebSocket error, closing stream: ${error}`);
        let reason = error ? String(error) : 'Unknown Error';
        if (error instanceof DataConnectError) {
            reason = error.message;
        }
        void this.closeConnection(WEBSOCKET_CLOSE_CODE, reason);
    }
    sendMessage(requestBody) {
        return this.ensureConnection().then(() => {
            try {
                this.connection.send(JSON.stringify(requestBody));
                return Promise.resolve();
            }
            catch (err) {
                this.handleError(err);
                throw new DataConnectError(Code.OTHER, `Failed to send message: ${String(err)}`);
            }
        });
    }
    /**
     * Handles incoming WebSocket messages.
     * @param ev The {@link MessageEvent} from the WebSocket.
     */
    async handleWebSocketMessage(ev) {
        const result = this.parseWebSocketData(ev.data);
        const requestId = result.requestId;
        const response = {
            data: result.data,
            errors: result.errors,
            extensions: result.extensions || { dataConnect: [] }
        };
        await this.handleResponse(requestId, response);
    }
    /**
     * Parse a response from the server. Assert that it has a {@link DataConnectStreamResponse.requestId | requestId}.
     * @param data the message from the server to be parsed
     * @returns the parsed message as a {@link DataConnectStreamResponse}
     * @throws {DataConnectError} if parsing fails or message is malformed.
     */
    parseWebSocketData(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data) {
        const dataIsString = typeof data === 'string';
        /** raw websocket message */
        let webSocketMessage;
        /** object containing data, errors, and extensions */
        let result;
        try {
            if (dataIsString) {
                webSocketMessage = JSON.parse(data);
            }
            else {
                webSocketMessage = JSON.parse(this.decodeBinaryResponse(data));
            }
        }
        catch (err) {
            throw new DataConnectError(Code.OTHER, `Could not parse WebSocket message: ${err instanceof Error ? err.message : String(err)}`);
        }
        if (typeof webSocketMessage !== 'object' || webSocketMessage === null) {
            throw new DataConnectError(Code.OTHER, 'WebSocket message is not an object');
        }
        if (dataIsString) {
            if (!('result' in webSocketMessage)) {
                throw new DataConnectError(Code.OTHER, 'WebSocket message from emulator did not include result');
            }
            if (typeof webSocketMessage.result !== 'object' ||
                webSocketMessage.result === null) {
                throw new DataConnectError(Code.OTHER, 'WebSocket message result is not an object');
            }
            result = webSocketMessage.result;
        }
        else {
            result = webSocketMessage;
        }
        if (!('requestId' in result)) {
            throw new DataConnectError(Code.OTHER, 'WebSocket message did not include requestId');
        }
        return result;
    }
}

/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Entry point for the transport layer. Manages routing between transport implementations.
 * @internal
 */
class DataConnectTransportManager {
    constructor(options, apiKey, appId, authProvider, appCheckProvider, transportOptions, _isUsingGen = false, _callerSdkType) {
        this.options = options;
        this.apiKey = apiKey;
        this.appId = appId;
        this.authProvider = authProvider;
        this.appCheckProvider = appCheckProvider;
        this.transportOptions = transportOptions;
        this._isUsingGen = _isUsingGen;
        this._callerSdkType = _callerSdkType;
        this.isUsingEmulator = false;
        this.restTransport = new RESTTransport(options, apiKey, appId, authProvider, appCheckProvider, transportOptions, _isUsingGen, _callerSdkType);
    }
    /**
     * Initializes the stream transport if it hasn't been already.
     */
    initStreamTransport() {
        if (!this.streamTransport) {
            this.streamTransport = new WebSocketTransport(this.options, this.apiKey, this.appId, this.authProvider, this.appCheckProvider, this.transportOptions, this._isUsingGen, this._callerSdkType);
            if (this.isUsingEmulator && this.transportOptions) {
                this.streamTransport.useEmulator(this.transportOptions.host, this.transportOptions.port, this.transportOptions.sslEnabled);
            }
            this.streamTransport.onGracefulStreamClose = () => {
                this.streamTransport = undefined;
            };
        }
        return this.streamTransport;
    }
    /**
     * Returns true if the stream is in a healthy, ready connection state and has active subscriptions.
     */
    executeShouldUseStream() {
        return (!!this.streamTransport &&
            !this.streamTransport.isPendingClose &&
            this.streamTransport.streamIsReady &&
            this.streamTransport.hasActiveSubscriptions &&
            !this.streamTransport.isUnableToConnect);
    }
    /**
     * Prefer to use Streaming Transport connection when one is available.
     * @inheritdoc
     */
    invokeQuery(queryName, body) {
        if (this.executeShouldUseStream()) {
            return this.streamTransport.invokeQuery(queryName, body).catch(err => {
                if (this.executeShouldUseStream()) {
                    throw err;
                }
                return this.restTransport.invokeQuery(queryName, body);
            });
        }
        return this.restTransport.invokeQuery(queryName, body);
    }
    /**
     * Prefer to use Streaming Transport connection when one is available.
     * @inheritdoc
     */
    invokeMutation(queryName, body) {
        if (this.executeShouldUseStream()) {
            return this.streamTransport.invokeMutation(queryName, body).catch(err => {
                if (this.executeShouldUseStream()) {
                    throw err;
                }
                return this.restTransport.invokeMutation(queryName, body);
            });
        }
        return this.restTransport.invokeMutation(queryName, body);
    }
    invokeSubscribe(observer, queryName, body) {
        const streamTransport = this.initStreamTransport();
        if (streamTransport.isUnableToConnect) {
            throw new DataConnectError(Code.OTHER, 'Unable to connect streaming connection to server. Subscriptions are unavailable.');
        }
        streamTransport.invokeSubscribe(observer, queryName, body);
    }
    invokeUnsubscribe(queryName, body) {
        if (this.streamTransport) {
            this.streamTransport.invokeUnsubscribe(queryName, body);
        }
    }
    useEmulator(host, port, sslEnabled) {
        this.isUsingEmulator = true;
        this.transportOptions = { host, port, sslEnabled };
        this.restTransport.useEmulator(host, port, sslEnabled);
        if (this.streamTransport) {
            this.streamTransport.useEmulator(host, port, sslEnabled);
        }
    }
    onAuthTokenChanged(token) {
        this.restTransport.onAuthTokenChanged(token);
        if (this.streamTransport) {
            this.streamTransport.onAuthTokenChanged(token);
        }
    }
    _setCallerSdkType(callerSdkType) {
        this._callerSdkType = callerSdkType;
        this.restTransport._setCallerSdkType(callerSdkType);
        if (this.streamTransport) {
            this.streamTransport._setCallerSdkType(callerSdkType);
        }
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 *
 * @param dcInstance Data Connect instance
 * @param mutationName name of mutation
 * @param variables variables to send with mutation
 * @returns `MutationRef`
 */
function mutationRef(dcInstance, mutationName, variables) {
    dcInstance.setInitialized();
    const ref = {
        dataConnect: dcInstance,
        name: mutationName,
        refType: MUTATION_STR,
        variables: variables
    };
    return ref;
}
/**
 * @internal
 */
class MutationManager {
    constructor(_transport) {
        this._transport = _transport;
        this._inflight = [];
    }
    executeMutation(mutationRef) {
        const result = this._transport.invokeMutation(mutationRef.name, mutationRef.variables);
        const withRefPromise = result.then(res => {
            const obj = {
                ...res, // Double check that the result is result.data, not just result
                source: SOURCE_SERVER,
                ref: mutationRef,
                fetchTime: Date.now().toLocaleString()
            };
            return obj;
        });
        this._inflight.push(result);
        const removePromise = () => (this._inflight = this._inflight.filter(promise => promise !== result));
        result.then(removePromise, removePromise);
        return withRefPromise;
    }
}
/**
 * Execute Mutation
 * @param mutationRef mutation to execute
 * @returns `MutationRef`
 */
function executeMutation(mutationRef) {
    return mutationRef.dataConnect._mutationManager.executeMutation(mutationRef);
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const FIREBASE_DATA_CONNECT_EMULATOR_HOST_VAR = 'FIREBASE_DATA_CONNECT_EMULATOR_HOST';
/**
 *
 * @param fullHost
 * @returns TransportOptions
 * @internal
 */
function parseOptions(fullHost) {
    const [protocol, hostName] = fullHost.split('://');
    const isSecure = protocol === 'https';
    const [host, portAsString] = hostName.split(':');
    const port = Number(portAsString);
    return { host, port, sslEnabled: isSecure };
}
/**
 * Class representing Firebase Data Connect
 */
class DataConnect {
    // @internal
    constructor(app, 
    // TODO(mtewani): Replace with _dataConnectOptions in the future
    dataConnectOptions, _authProvider, _appCheckProvider) {
        this.app = app;
        this.dataConnectOptions = dataConnectOptions;
        this._authProvider = _authProvider;
        this._appCheckProvider = _appCheckProvider;
        this.isEmulator = false;
        this._initialized = false;
        this._isUsingGeneratedSdk = false;
        this._callerSdkType = CallerSdkTypeEnum.Base;
        if (typeof process !== 'undefined' && process.env) {
            const host = process.env[FIREBASE_DATA_CONNECT_EMULATOR_HOST_VAR];
            if (host) {
                logDebug('Found custom host. Using emulator');
                this.isEmulator = true;
                this._transportOptions = parseOptions(host);
            }
        }
    }
    /**
     * @internal
     */
    getCache() {
        return this.cache;
    }
    // @internal
    _useGeneratedSdk() {
        if (!this._isUsingGeneratedSdk) {
            this._isUsingGeneratedSdk = true;
        }
    }
    _setCallerSdkType(callerSdkType) {
        this._callerSdkType = callerSdkType;
        if (this._initialized) {
            this._transport._setCallerSdkType(callerSdkType);
        }
    }
    _delete() {
        app._removeServiceInstance(this.app, 'data-connect', JSON.stringify(this.getSettings()));
        return Promise.resolve();
    }
    // @internal
    getSettings() {
        const copy = JSON.parse(JSON.stringify(this.dataConnectOptions));
        delete copy.projectId;
        return copy;
    }
    /**
     * @internal
     */
    setCacheSettings(cacheSettings) {
        this._cacheSettings = cacheSettings;
    }
    // @internal
    setInitialized() {
        if (this._initialized) {
            return;
        }
        if (this._transportClass === undefined) {
            logDebug('transportClass not provided. Defaulting to DataConnectTransportManager.');
            this._transportClass = DataConnectTransportManager;
        }
        this._authTokenProvider = new FirebaseAuthProvider(this.app.name, this.app.options, this._authProvider);
        const connectorConfig = {
            connector: this.dataConnectOptions.connector,
            service: this.dataConnectOptions.service,
            location: this.dataConnectOptions.location
        };
        if (this._cacheSettings) {
            this.cache = new DataConnectCache(this._authTokenProvider, this.app.options.projectId, connectorConfig, this._transportOptions?.host || PROD_HOST, this._cacheSettings);
        }
        if (this._appCheckProvider) {
            this._appCheckTokenProvider = new AppCheckTokenProvider(this.app, this._appCheckProvider);
        }
        this._transport = new this._transportClass(this.dataConnectOptions, this.app.options.apiKey, this.app.options.appId, this._authTokenProvider, this._appCheckTokenProvider, undefined, this._isUsingGeneratedSdk, this._callerSdkType);
        if (this._transportOptions) {
            this._transport.useEmulator(this._transportOptions.host, this._transportOptions.port, this._transportOptions.sslEnabled);
        }
        this._queryManager = new QueryManager(this._transport, this, this.cache);
        this._mutationManager = new MutationManager(this._transport);
        this._initialized = true;
    }
    // @internal
    enableEmulator(transportOptions) {
        if (this._transportOptions &&
            this._initialized &&
            !areTransportOptionsEqual(this._transportOptions, transportOptions)) {
            logError('enableEmulator called after initialization');
            throw new DataConnectError(Code.ALREADY_INITIALIZED, 'DataConnect instance already initialized!');
        }
        this._transportOptions = transportOptions;
        this.isEmulator = true;
    }
}
/**
 * @internal
 * @param transportOptions1
 * @param transportOptions2
 * @returns
 */
function areTransportOptionsEqual(transportOptions1, transportOptions2) {
    return (transportOptions1.host === transportOptions2.host &&
        transportOptions1.port === transportOptions2.port &&
        transportOptions1.sslEnabled === transportOptions2.sslEnabled);
}
/**
 * Connect to the DataConnect Emulator
 * @param dc Data Connect instance
 * @param host host of emulator server
 * @param port port of emulator server
 * @param sslEnabled use https
 */
function connectDataConnectEmulator(dc, host, port, sslEnabled = false) {
    // Workaround to get cookies in Firebase Studio
    if (util.isCloudWorkstation(host)) {
        void util.pingServer(`https://${host}${port ? `:${port}` : ''}`);
    }
    dc.enableEmulator({ host, port, sslEnabled });
}
function getDataConnect(appOrConnectorConfig, settingsOrConnectorConfig, settings) {
    let app$1;
    let connectorConfig;
    let realSettings;
    if ('location' in appOrConnectorConfig) {
        connectorConfig = appOrConnectorConfig;
        app$1 = app.getApp();
        realSettings = settingsOrConnectorConfig;
    }
    else {
        app$1 = appOrConnectorConfig;
        connectorConfig = settingsOrConnectorConfig;
        realSettings = settings;
    }
    if (!app$1 || Object.keys(app$1).length === 0) {
        app$1 = app.getApp();
    }
    // Options to store in Firebase Component Provider.
    const serializedOptions = {
        ...connectorConfig,
        projectId: app$1.options.projectId
    };
    // We should sort the keys before initialization.
    const sortedSerialized = Object.fromEntries(Object.entries(serializedOptions).sort());
    const provider = app._getProvider(app$1, 'data-connect');
    const identifier = JSON.stringify(sortedSerialized);
    if (provider.isInitialized(identifier)) {
        const dcInstance = provider.getImmediate({ identifier });
        const options = provider.getOptions(identifier);
        const optionsValid = Object.keys(options).length > 0;
        if (optionsValid) {
            logDebug('Re-using cached instance');
            return dcInstance;
        }
    }
    validateDCOptions(connectorConfig);
    logDebug('Creating new DataConnect instance');
    // Initialize with options.
    const dataConnect = provider.initialize({
        instanceIdentifier: identifier,
        options: Object.fromEntries(Object.entries({
            ...sortedSerialized
        }).sort())
    });
    if (realSettings?.cacheSettings) {
        dataConnect.setCacheSettings(realSettings.cacheSettings);
    }
    return dataConnect;
}
/**
 *
 * @param dcOptions
 * @returns {void}
 * @internal
 */
function validateDCOptions(dcOptions) {
    const fields = ['connector', 'location', 'service'];
    if (!dcOptions) {
        throw new DataConnectError(Code.INVALID_ARGUMENT, 'DC Option Required');
    }
    fields.forEach(field => {
        if (dcOptions[field] === null ||
            dcOptions[field] === undefined) {
            throw new DataConnectError(Code.INVALID_ARGUMENT, `${field} Required`);
        }
    });
    return true;
}
/**
 * Delete DataConnect instance
 * @param dataConnect DataConnect instance
 * @returns
 */
function terminate(dataConnect) {
    return dataConnect._delete();
    // TODO(mtewani): Stop pending tasks
}
const StorageType = {
    MEMORY: 'MEMORY'
};
function makeMemoryCacheProvider() {
    return new MemoryStub();
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function registerDataConnect(variant) {
    setSDKVersion(app.SDK_VERSION);
    app._registerComponent(new component.Component('data-connect', (container, { instanceIdentifier: connectorConfigStr, options }) => {
        const app = container.getProvider('app').getImmediate();
        const authProvider = container.getProvider('auth-internal');
        const appCheckProvider = container.getProvider('app-check-internal');
        let newOpts = options;
        if (connectorConfigStr) {
            newOpts = {
                ...JSON.parse(connectorConfigStr),
                ...newOpts
            };
        }
        if (!app.options.projectId) {
            throw new DataConnectError(Code.INVALID_ARGUMENT, 'Project ID must be provided. Did you pass in a proper projectId to initializeApp?');
        }
        return new DataConnect(app, { ...newOpts, projectId: app.options.projectId }, authProvider, appCheckProvider);
    }, "PUBLIC" /* ComponentType.PUBLIC */).setMultipleInstances(true));
    app.registerVersion(name, version, variant);
    // BUILD_TARGET will be replaced by values like esm, cjs, etc during the compilation
    app.registerVersion(name, version, 'cjs2020');
}

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const QueryFetchPolicy = {
    PREFER_CACHE: 'PREFER_CACHE',
    CACHE_ONLY: 'CACHE_ONLY',
    SERVER_ONLY: 'SERVER_ONLY'
};

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Execute Query
 * @param queryRef query to execute.
 * @returns `QueryPromise`
 */
function executeQuery(queryRef, options) {
    if (queryRef.refType !== QUERY_STR) {
        return Promise.reject(new DataConnectError(Code.INVALID_ARGUMENT, `ExecuteQuery can only execute query operations`));
    }
    const queryManager = queryRef.dataConnect._queryManager;
    const fetchPolicy = options?.fetchPolicy ?? QueryFetchPolicy.PREFER_CACHE;
    switch (fetchPolicy) {
        case QueryFetchPolicy.SERVER_ONLY:
            return queryManager.fetchServerResults(queryRef);
        case QueryFetchPolicy.CACHE_ONLY:
            return queryManager.fetchCacheResults(queryRef, true);
        case QueryFetchPolicy.PREFER_CACHE:
            return queryManager.preferCacheResults(queryRef, false);
        default:
            throw new DataConnectError(Code.INVALID_ARGUMENT, `Invalid fetch policy: ${fetchPolicy}`);
    }
}
/**
 * Execute Query
 * @param dcInstance Data Connect instance to use.
 * @param queryName Query to execute
 * @param variables Variables to execute with
 * @param initialCache initial cache to use for client hydration
 * @returns `QueryRef`
 */
function queryRef(dcInstance, queryName, variables, initialCache) {
    dcInstance.setInitialized();
    if (initialCache !== undefined) {
        dcInstance._queryManager.updateSSR(initialCache);
    }
    return {
        dataConnect: dcInstance,
        refType: QUERY_STR,
        name: queryName,
        variables: variables
    };
}
/**
 * Converts serialized ref to query ref
 * @param serializedRef ref to convert to `QueryRef`
 * @returns `QueryRef`
 */
function toQueryRef(serializedRef) {
    const { refInfo: { name, variables, connectorConfig } } = serializedRef;
    return queryRef(getDataConnect(connectorConfig), name, variables);
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The generated SDK will allow the user to pass in either the variables or the data connect instance
 * with the variables. This function validates the variables and returns back the DataConnect instance
 * and variables based on the arguments passed in.
 *
 * Generated SDKs generated from versions 3.2.0 and lower of the Data Connect emulator binary are
 * NOT concerned with options, and will use this function to validate arguments.
 *
 * @param connectorConfig
 * @param dcOrVars
 * @param vars
 * @param variablesRequired
 * @returns {DataConnect} and {Variables} instance
 * @internal
 */
function validateArgs(connectorConfig, dcOrVars, vars, variablesRequired) {
    let dcInstance;
    let realVars;
    const dcFirstArg = dcOrVars && 'enableEmulator' in dcOrVars;
    if (dcFirstArg) {
        dcInstance = dcOrVars;
        realVars = vars;
    }
    else {
        dcInstance = getDataConnect(connectorConfig);
        realVars = dcOrVars;
    }
    if (!dcInstance || (!realVars && variablesRequired)) {
        throw new DataConnectError(Code.INVALID_ARGUMENT, 'Variables required.');
    }
    return { dc: dcInstance, vars: realVars };
}
/**
 * The generated SDK will allow the user to pass in either the variables or the data connect instance
 * with the variables, and/or options. This function validates the variables and returns back the
 * DataConnect instance and variables, and potentially options, based on the arguments passed in.
 *
 * Generated SDKs generated from versions 3.2.0 and higher of the Data Connect emulator binary are
 * in fact concerned with options, and will use this function to validate arguments.
 *
 * @param connectorConfig
 * @param dcOrVarsOrOptions
 * @param varsOrOptions
 * @param variablesRequired
 * @param options
 * @returns {DataConnect} and {Variables} instance, and optionally {ExecuteQueryOptions}
 * @internal
 */
function validateArgsWithOptions(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, hasVars, variablesRequired) {
    let dcInstance;
    let realVars;
    let realOptions;
    const dcFirstArg = dcOrVarsOrOptions && 'enableEmulator' in dcOrVarsOrOptions;
    if (dcFirstArg) {
        dcInstance = dcOrVarsOrOptions;
        if (hasVars) {
            realVars = varsOrOptions;
            realOptions = options;
        }
        else {
            realVars = undefined;
            realOptions = varsOrOptions;
        }
    }
    else {
        dcInstance = getDataConnect(connectorConfig);
        if (hasVars) {
            realVars = dcOrVarsOrOptions;
            realOptions = varsOrOptions;
        }
        else {
            realVars = undefined;
            realOptions = dcOrVarsOrOptions;
        }
    }
    if (!dcInstance || (!realVars && variablesRequired)) {
        throw new DataConnectError(Code.INVALID_ARGUMENT, 'Variables required.');
    }
    return { dc: dcInstance, vars: realVars, options: realOptions };
}

/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Subscribe to a `QueryRef`
 * @param queryRefOrSerializedResult query ref or serialized result.
 * @param observerOrOnNext observer object or next function.
 * @param onError Callback to call when error gets thrown.
 * @param onComplete Called when subscription completes.
 * @returns `SubscriptionOptions`
 */
function subscribe(queryRefOrSerializedResult, observerOrOnNext, onError, onComplete) {
    let ref;
    let initialCache;
    if ('refInfo' in queryRefOrSerializedResult) {
        const serializedRef = queryRefOrSerializedResult;
        const { data, source, fetchTime } = serializedRef;
        ref = toQueryRef(serializedRef);
        initialCache = {
            data,
            source,
            fetchTime,
            ref,
            toJSON: getRefSerializer(ref, data, source, fetchTime)
        };
    }
    else {
        ref = queryRefOrSerializedResult;
    }
    let onResult = undefined;
    if (typeof observerOrOnNext === 'function') {
        onResult = observerOrOnNext;
    }
    else {
        onResult = observerOrOnNext.onNext;
        onError = observerOrOnNext.onErr;
        onComplete = observerOrOnNext.onComplete;
    }
    if (!onResult) {
        throw new DataConnectError(Code.INVALID_ARGUMENT, 'Must provide onNext');
    }
    return ref.dataConnect._queryManager.addSubscription(ref, onResult, onComplete, onError, initialCache);
}

/**
 * Firebase Data Connect
 *
 * @packageDocumentation
 */
registerDataConnect();

exports.AbstractDataConnectTransport = AbstractDataConnectTransport;
exports.CallerSdkTypeEnum = CallerSdkTypeEnum;
exports.Code = Code;
exports.DataConnect = DataConnect;
exports.DataConnectError = DataConnectError;
exports.DataConnectOperationError = DataConnectOperationError;
exports.MUTATION_STR = MUTATION_STR;
exports.MutationManager = MutationManager;
exports.QUERY_STR = QUERY_STR;
exports.QueryFetchPolicy = QueryFetchPolicy;
exports.SOURCE_CACHE = SOURCE_CACHE;
exports.SOURCE_SERVER = SOURCE_SERVER;
exports.StorageType = StorageType;
exports.areTransportOptionsEqual = areTransportOptionsEqual;
exports.connectDataConnectEmulator = connectDataConnectEmulator;
exports.executeMutation = executeMutation;
exports.executeQuery = executeQuery;
exports.getDataConnect = getDataConnect;
exports.getGoogApiClientValue = getGoogApiClientValue$1;
exports.makeMemoryCacheProvider = makeMemoryCacheProvider;
exports.mutationRef = mutationRef;
exports.parseOptions = parseOptions;
exports.queryRef = queryRef;
exports.setLogLevel = setLogLevel;
exports.subscribe = subscribe;
exports.terminate = terminate;
exports.toQueryRef = toQueryRef;
exports.validateArgs = validateArgs;
exports.validateArgsWithOptions = validateArgsWithOptions;
exports.validateDCOptions = validateDCOptions;
//# sourceMappingURL=index.cjs.js.map
