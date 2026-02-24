"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = exports.httpRequestCounter = void 0;
const client = require("prom-client");
// Collect default metrics with a 5s interval
if (typeof client.collectDefaultMetrics === 'function') {
    client.collectDefaultMetrics();
}
exports.httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
});
function metricsMiddleware() {
    return async (req, res, next) => {
        const end = res.end;
        res.end = function (chunk, encoding) {
            exports.httpRequestCounter.inc({ method: req.method, path: req.path || req.url, status: String(res.statusCode) }, 1);
            res.end = end;
            return res.end(chunk, encoding);
        };
        next();
    };
}
exports.metricsMiddleware = metricsMiddleware;
exports.default = client;
//# sourceMappingURL=metrics.js.map