import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./shared/filters/global-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  // Prefijo y versionado de la API (FASE 9: /api/v1)
  app.setGlobalPrefix("api/v1");

  // Validación de entrada en el borde
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Manejo de errores global (mapea excepciones de dominio → HTTP)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS para el frontend
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true });

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  Logger.log(`CLIENTRA API escuchando en http://localhost:${port}/api/v1`, "Bootstrap");
}

void bootstrap();
