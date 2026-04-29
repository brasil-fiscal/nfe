import { z } from 'zod/v4';

export const volumeSchema = z.object({
  quantidade: z.number().int().min(0).optional(),
  especie: z.string().max(60).optional(),
  marca: z.string().max(60).optional(),
  numeracao: z.string().max(60).optional(),
  pesoLiquido: z.number().min(0).optional(),
  pesoBruto: z.number().min(0).optional()
});

export const veiculoTranspSchema = z.object({
  placa: z.string().max(7).optional(),
  uf: z.string().length(2).optional(),
  rntc: z.string().max(20).optional()
});

export const transporteSchema = z.object({
  modalidadeFrete: z.literal(0).or(z.literal(1)).or(z.literal(2)).or(z.literal(3)).or(z.literal(4)).or(z.literal(9)),
  cnpjTransportadora: z.string().length(14).optional(),
  nomeTransportadora: z.string().max(60).optional(),
  inscricaoEstadual: z.string().max(14).optional(),
  endereco: z.string().max(60).optional(),
  municipio: z.string().max(60).optional(),
  uf: z.string().length(2).optional(),
  veiculo: veiculoTranspSchema.optional(),
  volumes: z.array(volumeSchema).optional()
});
