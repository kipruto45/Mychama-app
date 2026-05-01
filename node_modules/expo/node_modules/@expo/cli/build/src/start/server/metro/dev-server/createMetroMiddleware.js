"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createMetroMiddleware", {
    enumerable: true,
    get: function() {
        return createMetroMiddleware;
    }
});
function _paths() {
    const data = require("@expo/config/paths");
    _paths = function() {
        return data;
    };
    return data;
}
function _connect() {
    const data = /*#__PURE__*/ _interop_require_default(require("connect"));
    _connect = function() {
        return data;
    };
    return data;
}
function _nodefs() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:fs"));
    _nodefs = function() {
        return data;
    };
    return data;
}
function _nodepath() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:path"));
    _nodepath = function() {
        return data;
    };
    return data;
}
const _compression = require("./compression");
const _createEventSocket = require("./createEventSocket");
const _createMessageSocket = require("./createMessageSocket");
const _log = require("../../../../log");
const _editor = require("../../../../utils/editor");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createMetroMiddleware(metroConfig) {
    const messages = (0, _createMessageSocket.createMessagesSocket)({
        logger: _log.Log
    });
    const events = (0, _createEventSocket.createEventsSocket)(messages);
    const middleware = (0, _connect().default)().use(noCacheMiddleware).use(_compression.compression)// Support opening stack frames from clients directly in the editor
    .use('/open-stack-frame', rawBodyMiddleware).use('/open-stack-frame', createMetroOpenStackFrameMiddleware(metroConfig))// Support the symbolication endpoint of Metro
    // See: https://github.com/facebook/metro/blob/a792d85ffde3c21c3fbf64ac9404ab0afe5ff957/packages/metro/src/Server.js#L1266
    .use('/symbolicate', rawBodyMiddleware)// Support status check to detect if the packager needs to be started from the native side
    .use('/status', createMetroStatusMiddleware(metroConfig));
    return {
        middleware,
        messagesSocket: messages,
        eventsSocket: events,
        websocketEndpoints: {
            [messages.endpoint]: messages.server,
            [events.endpoint]: events.server
        }
    };
}
const noCacheMiddleware = (_req, res, next)=>{
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
};
const rawBodyMiddleware = (req, _res, next)=>{
    const reqWithBody = req;
    reqWithBody.setEncoding('utf8');
    reqWithBody.rawBody = '';
    reqWithBody.on('data', (chunk)=>reqWithBody.rawBody += chunk);
    reqWithBody.on('end', next);
};
function createMetroStatusMiddleware(metroConfig) {
    return (_req, res)=>{
        res.setHeader('X-React-Native-Project-Root', encodeURI(metroConfig.projectRoot));
        res.end('packager-status:running');
    };
}
function createMetroOpenStackFrameMiddleware(metroConfig) {
    return async (req, res, next)=>{
        if (req.method !== 'POST') {
            return next();
        }
        if (!('rawBody' in req) || !req.rawBody) {
            res.statusCode = 406;
            return res.end('Open stack frame requires the JSON stack frame as request body');
        }
        let frame;
        try {
            const json = JSON.parse(req.rawBody);
            if (typeof json === 'object' && json != null && typeof json.file === 'string') {
                frame = {
                    file: json.file,
                    lineNumber: typeof json.lineNumber === 'number' && Number.isSafeInteger(json.lineNumber) ? json.lineNumber : undefined
                };
            }
        } catch  {}
        if (!frame) {
            res.statusCode = 400;
            return res.end('Open stack frame requires the JSON stack frame as request body');
        }
        const root = (0, _paths().getMetroServerRoot)(metroConfig.projectRoot);
        const file = await ensureFileInRootDirectory(root, frame.file);
        if (!file) {
            res.statusCode = 400;
            return res.end('Open stack frame requires target file to be in server root');
        }
        try {
            await (0, _editor.openInEditorAsync)(file, frame.lineNumber);
            return res.end('OK');
        } catch  {
            res.statusCode = 5006;
            return res.end('Open stack frame failed to open local editor');
        }
    };
}
const ensureFileInRootDirectory = async (root, file)=>{
    try {
        file = _nodepath().default.resolve(root, file);
        file = await _nodefs().default.promises.realpath(file);
        // Cannot be accessed using Metro's server API, we need to move the file
        // into the project root and try again.
        if (!_nodepath().default.relative(root, file).startsWith('..' + _nodepath().default.sep)) {
            return file;
        } else {
            return null;
        }
    } catch  {
        return null;
    }
};

//# sourceMappingURL=createMetroMiddleware.js.map