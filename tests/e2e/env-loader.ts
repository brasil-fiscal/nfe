import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export type E2EConfig = {
  readonly pfxPath: string;
  readonly pfxSenha: string;
  readonly cnpj: string;
  readonly razaoSocial: string;
  readonly ie: string;
  readonly uf: string;
  readonly codMunicipio: string;
  readonly municipio: string;
  readonly logradouro: string;
  readonly numero: string;
  readonly bairro: string;
  readonly cep: string;
};

function loadEnvFile(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return {};
  }
  const content = readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const raw = trimmed.slice(eqIndex + 1).trim();
    const value = raw.replace(/^["']|["']$/g, '');
    vars[key] = value;
  }
  return vars;
}

export function loadE2EConfig(): E2EConfig | null {
  const vars = loadEnvFile();
  const get = (key: string): string => vars[key] ?? process.env[key] ?? '';

  const pfxPath = get('NFE_PFX_PATH');
  const ie = get('NFE_IE');

  if (!pfxPath || !existsSync(resolve(process.cwd(), pfxPath))) {
    return null;
  }

  if (!ie) {
    return null;
  }

  return {
    pfxPath,
    pfxSenha: get('NFE_PFX_SENHA'),
    cnpj: get('NFE_CNPJ'),
    razaoSocial: get('NFE_RAZAO_SOCIAL'),
    ie,
    uf: get('NFE_UF'),
    codMunicipio: get('NFE_COD_MUNICIPIO'),
    municipio: get('NFE_MUNICIPIO'),
    logradouro: get('NFE_LOGRADOURO'),
    numero: get('NFE_NUMERO'),
    bairro: get('NFE_BAIRRO'),
    cep: get('NFE_CEP')
  };
}

export function loadPfxBuffer(pfxPath: string): Buffer {
  return readFileSync(resolve(process.cwd(), pfxPath));
}
