import { z } from 'zod/v4';

export const faturaSchema = z.object({
  nFat: z.string().max(60).optional(),
  vOrig: z.number().min(0).optional(),
  vDesc: z.number().min(0).optional(),
  vLiq: z.number().min(0).optional()
});

export const duplicataSchema = z.object({
  nDup: z.string().max(60),
  dVenc: z.string().length(10),
  vDup: z.number().min(0)
});

export const cobrancaSchema = z.object({
  fatura: faturaSchema.optional(),
  duplicatas: z.array(duplicataSchema).optional()
});
