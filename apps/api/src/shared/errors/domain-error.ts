/** Errores de dominio mapeables a HTTP por el GlobalExceptionFilter. */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
  readonly httpStatus = 404;
}

export class ConflictError extends DomainError {
  readonly code = "CONFLICT";
  readonly httpStatus = 409;
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
  readonly httpStatus = 422;
}

export class UnauthorizedError extends DomainError {
  readonly code = "UNAUTHORIZED";
  readonly httpStatus = 401;
}

export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN";
  readonly httpStatus = 403;
}
