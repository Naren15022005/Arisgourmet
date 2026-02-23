import * as client from 'prom-client';

// Collect default metrics with a 5s interval
if (typeof client.collectDefaultMetrics === 'function') {
  client.collectDefaultMetrics();
}

export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

export function metricsMiddleware() {
  return async (req: any, res: any, next: any) => {
    const end = res.end;
    res.end = function (chunk: any, encoding: any) {
      httpRequestCounter.inc({ method: req.method, path: req.path || req.url, status: String(res.statusCode) }, 1);
      res.end = end;
      return res.end(chunk, encoding);
    };
    next();
  };
}

export default client;
