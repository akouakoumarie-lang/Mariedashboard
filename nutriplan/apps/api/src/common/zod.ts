import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { z, type ZodType } from 'zod';

/** Validation systématique des entrées avec les schémas Zod partagés (@nutriplan/core). */
export class ZodPipe<T extends ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}
  transform(value: unknown, _meta: ArgumentMetadata): z.output<T> {
    // En cas d'échec, ZodError est converti en réponse 400 par le filtre d'erreurs global.
    return this.schema.parse(value);
  }
}

/** Documente le corps attendu dans Swagger à partir du schéma Zod. */
export function ApiZodBody(schema: ZodType) {
  return ApiBody({ schema: z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input', unrepresentable: 'any' }) as object });
}
