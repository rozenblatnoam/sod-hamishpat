"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const logger = new common_1.Logger('Bootstrap');
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'https://sod-hamishpat.netlify.app')
    .split(',')
    .map((o) => o.trim());
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: (origin, cb) => {
            if (!origin || ALLOWED_ORIGINS.includes(origin))
                return cb(null, true);
            cb(new Error(`CORS: origin ${origin} not allowed`), false);
        },
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    if (process.env.NODE_ENV !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('דיינים צעירים API')
            .setDescription('API למשחק דיינים צעירים')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const doc = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api', app, doc);
    }
    app.getHttpAdapter().get('/health', (_req, res) => res.status(200).json({ ok: true }));
    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`Server running on http://0.0.0.0:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map