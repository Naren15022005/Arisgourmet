"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = require("dotenv");
const path_1 = require("path");
dotenv.config({ path: process.env.ENV_PATH || (0, path_1.resolve)(__dirname, '../../.env') });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const metrics_1 = require("./metrics");
const promClient = require("prom-client");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.use((0, metrics_1.metricsMiddleware)());
    // expose /metrics
    app.getHttpAdapter().get('/metrics', async (req, res) => {
        res.setHeader('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    });
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
    console.log('Backend running on port', process.env.PORT || 4000);
}
bootstrap();
//# sourceMappingURL=main.js.map