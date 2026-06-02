import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import { Response } from "express";
import { randomUUID } from "node:crypto";
import { DomainError } from "../errors/domain-error";

/** Mapea excepciones (dominio + HTTP + desconocidas) al envelope de error de la API (FASE 9). */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const traceId = randomUUID();

    if (exception instanceof DomainError) {
      res.status(exception.httpStatus).json({
        error: { code: exception.code, message: exception.message, traceId },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json({
        error: { code: "HTTP_ERROR", message: typeof body === "string" ? body : (body as any).message, traceId },
      });
      return;
    }

    this.logger.error(`Error no controlado [${traceId}]`, exception instanceof Error ? exception.stack : String(exception));
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Error interno del servidor", traceId },
    });
  }
}
