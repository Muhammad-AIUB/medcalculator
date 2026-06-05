import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter as HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 5000);
  const nodeEnv = configService.get<string>('nodeEnv', 'development');
  const corsOrigins = configService.get<string[]>('cors.origins', ['http://localhost:5001']);

  // Security
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production',
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());

  // CORS
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
    credentials: true,
  });

  // Global prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Global pipes, filters, interceptors
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pocket Medical Calculator API')
    .setDescription(`
## Enterprise Clinical Calculator Platform API

Professional-grade medical calculator REST API supporting 8+ clinical calculators 
with real-time unit conversion, calculation history, and favorites management.

### Calculators Supported
- **eGFR** — CKD-EPI 2021 & MDRD (Renal function)
- **Child-Pugh** — Liver disease severity
- **MELD-Na** — Liver transplant priority
- **BMI** — Body mass index with IBW/ABW
- **EDD** — Expected delivery date (LMP & ultrasound)
- **SOFA** — Sequential organ failure assessment
- **Vasopressor** — Vasopressor intensity score
- **TSAT** — Transferrin saturation

### Unit Conversion
All endpoints support automatic unit conversion across 100+ medical units.
    `)
    .setVersion('1.0.0')
    .addTag('calculators', 'Clinical calculator engines and metadata')
    .addTag('conversion', 'Medical unit conversion engine')
    .addTag('history', 'Calculation history management')
    .addTag('favorites', 'Calculator favorites management')
    .addTag('health', 'System health and status')
    .addServer(`http://localhost:${port}`, 'Local Development')
    .addServer('https://api.medcalcpro.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
    },
    customSiteTitle: 'Pocket Medical Calculator API Docs',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { background-color: #0891b2; }
      .swagger-ui .topbar .topbar-wrapper img { content: url('/logo.png'); }
    `,
  });

  await app.listen(port, '0.0.0.0');
  console.log(`
╔══════════════════════════════════════════════════════╗
║        Pocket Medical Calculator API Server          ║
╠══════════════════════════════════════════════════════╣
║  Environment : ${nodeEnv.padEnd(36)}║
║  Port        : ${String(port).padEnd(36)}║
║  API Base    : http://localhost:${port}/api           ║
║  API Docs    : http://localhost:${port}/api/docs      ║
╚══════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
