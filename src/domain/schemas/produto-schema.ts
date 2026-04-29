import { z } from 'zod/v4';

export const icmsSchema = z.object({
  origem: z.int().min(0).max(8),
  cst: z.string().length(2).optional(),
  csosn: z.string().min(3).max(3).optional(),
  aliquota: z.number().min(0).optional(),
  baseCalculo: z.number().min(0).optional(),
  valor: z.number().min(0).optional()
});

export const pisSchema = z.object({
  cst: z.string().length(2),
  baseCalculo: z.number().min(0).optional(),
  aliquota: z.number().min(0).optional(),
  valor: z.number().min(0).optional()
});

export const cofinsSchema = z.object({
  cst: z.string().length(2),
  baseCalculo: z.number().min(0).optional(),
  aliquota: z.number().min(0).optional(),
  valor: z.number().min(0).optional()
});

export const ipiSchema = z.object({
  cst: z.string().length(2),
  baseCalculo: z.number().min(0).optional(),
  aliquota: z.number().min(0).optional(),
  valor: z.number().min(0).optional(),
  cEnq: z.string().max(3).optional()
});

export const produtoSchema = z.object({
  numero: z.int().min(1),
  codigo: z.string().min(1).max(60),
  descricao: z.string().min(1).max(120),
  ncm: z.string().length(8),
  cest: z.string().length(7).optional(),
  cfop: z.string().length(4),
  unidade: z.string().min(1).max(6),
  quantidade: z.number().positive(),
  valorUnitario: z.number().min(0),
  valorTotal: z.number().min(0),
  valorDesconto: z.number().min(0).optional(),
  valorFrete: z.number().min(0).optional(),
  valorSeguro: z.number().min(0).optional(),
  outrasDespesas: z.number().min(0).optional(),
  ean: z.string().max(14).optional(),
  eanTributavel: z.string().max(14).optional(),
  icms: icmsSchema,
  pis: pisSchema,
  cofins: cofinsSchema,
  ipi: ipiSchema.optional()
});
