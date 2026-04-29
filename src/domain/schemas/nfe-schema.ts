import { z } from 'zod/v4';
import { emitenteSchema } from './emitente-schema';
import { destinatarioSchema } from './destinatario-schema';
import { produtoSchema } from './produto-schema';
import { transporteSchema } from './transporte-schema';
import { pagamentoSchema } from './pagamento-schema';
import { cobrancaSchema } from './cobranca-schema';

export const nfeIdentificacaoSchema = z.object({
  naturezaOperacao: z.string().min(1).max(60),
  tipoOperacao: z.literal(0).or(z.literal(1)),
  destinoOperacao: z.literal(1).or(z.literal(2)).or(z.literal(3)),
  finalidade: z.literal(1).or(z.literal(2)).or(z.literal(3)).or(z.literal(4)),
  consumidorFinal: z.literal(0).or(z.literal(1)),
  presencaComprador: z
    .literal(0)
    .or(z.literal(1))
    .or(z.literal(2))
    .or(z.literal(3))
    .or(z.literal(4))
    .or(z.literal(5))
    .or(z.literal(9)),
  uf: z.string().length(2),
  municipio: z.string().length(7),
  serie: z.int().min(0).max(999),
  numero: z.int().min(1).max(999999999),
  dataEmissao: z.date().optional(),
  tipoEmissao: z
    .literal(1)
    .or(z.literal(2))
    .or(z.literal(3))
    .or(z.literal(4))
    .or(z.literal(5))
    .or(z.literal(6))
    .or(z.literal(7))
    .or(z.literal(9))
    .optional(),
  tipoImpressao: z
    .literal(0)
    .or(z.literal(1))
    .or(z.literal(2))
    .or(z.literal(3))
    .or(z.literal(4))
    .or(z.literal(5))
    .optional()
});

export const nfeSchema = z.object({
  identificacao: nfeIdentificacaoSchema,
  emitente: emitenteSchema,
  destinatario: destinatarioSchema,
  produtos: z.array(produtoSchema).min(1),
  transporte: transporteSchema,
  cobranca: cobrancaSchema.optional(),
  pagamento: pagamentoSchema,
  informacoesComplementares: z.string().max(5000).optional(),
  informacoesFisco: z.string().max(2000).optional()
});

export type NFeInput = z.infer<typeof nfeSchema>;
