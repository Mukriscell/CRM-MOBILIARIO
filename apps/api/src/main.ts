import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./shared/filters/global-exception.filter";

async function bootstrap() {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    Logger.error("JWT_ACCESS_SECRET y JWT_REFRESH_SECRET son requeridos", "Bootstrap");
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  // Prefijo y versionado de la API (FASE 9: /api/v1)
  app.setGlobalPrefix("api/v1");

  // La validación de entrada se hace con Zod (ZodValidationPipe) por endpoint;
  // no usamos el ValidationPipe de class-validator.

  // Manejo de errores global (mapea excepciones de dominio → HTTP)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS: acepta cualquier origen (reflejado) para compatibilidad con Railway y dev local
  app.enableCors({ origin: true, credentials: true });

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  Logger.log(`CLIENTRA API escuchando en http://0.0.0.0:${port}/api/v1`, "Bootstrap");
}

void bootstrap();
