import { PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";
import { ValidationError } from "../errors/domain-error";

/** Valida el body/params contra un schema Zod compartido (FASE 9). */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const detail = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new ValidationError(detail);
    }
    return result.data;
  }
}
