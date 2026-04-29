import { gunzipSync } from 'node:zlib';
import { NFeError } from '@nfe/shared/errors/NFeError';

const NFE_NAMESPACE = 'http://www.portalfiscal.inf.br/nfe';
const WSDL_NAMESPACE = `${NFE_NAMESPACE}/wsdl/NFeDistribuicaoDFe`;

export const DISTRIBUICAO_SOAP_ACTION =
  `${NFE_NAMESPACE}/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse`;

/**
 * Monta envelope SOAP para consulta por ultimo NSU (distNSU).
 */
export function buildDistNSUEnvelope(
  cnpj: string,
  cUFAutor: string,
  tpAmb: '1' | '2',
  ultNSU: string
): string {
  const nsuPadded = ultNSU.padStart(15, '0');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Header/>',
    '<soap12:Body>',
    `<nfeDistDFeInteresse xmlns="${WSDL_NAMESPACE}">`,
    '<nfeDadosMsg>',
    `<distDFeInt versao="1.01" xmlns="${NFE_NAMESPACE}">`,
    `<tpAmb>${tpAmb}</tpAmb>`,
    `<cUFAutor>${cUFAutor}</cUFAutor>`,
    `<CNPJ>${cnpj}</CNPJ>`,
    `<distNSU><ultNSU>${nsuPadded}</ultNSU></distNSU>`,
    '</distDFeInt>',
    '</nfeDadosMsg>',
    '</nfeDistDFeInteresse>',
    '</soap12:Body>',
    '</soap12:Envelope>'
  ].join('');
}

/**
 * Monta envelope SOAP para consulta por chave de acesso (consChNFe).
 */
export function buildConsChNFeEnvelope(
  cnpj: string,
  cUFAutor: string,
  tpAmb: '1' | '2',
  chNFe: string
): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Header/>',
    '<soap12:Body>',
    `<nfeDistDFeInteresse xmlns="${WSDL_NAMESPACE}">`,
    '<nfeDadosMsg>',
    `<distDFeInt versao="1.01" xmlns="${NFE_NAMESPACE}">`,
    `<tpAmb>${tpAmb}</tpAmb>`,
    `<cUFAutor>${cUFAutor}</cUFAutor>`,
    `<CNPJ>${cnpj}</CNPJ>`,
    `<consChNFe><chNFe>${chNFe}</chNFe></consChNFe>`,
    '</distDFeInt>',
    '</nfeDadosMsg>',
    '</nfeDistDFeInteresse>',
    '</soap12:Body>',
    '</soap12:Envelope>'
  ].join('');
}

export type DFeDocument = {
  readonly nsu: string;
  readonly schema: string;
  readonly xml: string;
};

export type DistribuicaoResult = {
  readonly cStat: string;
  readonly xMotivo: string;
  readonly ultNSU: string;
  readonly maxNSU: string;
  readonly documentos: readonly DFeDocument[];
};

/**
 * Parseia a resposta do servico NFeDistribuicaoDFe.
 */
export function parseDistribuicaoResponse(body: string): DistribuicaoResult {
  const cStat = extractTag(body, 'cStat');
  if (!cStat) {
    throw new NFeError('Resposta de distribuicao sem cStat');
  }

  const xMotivo = extractTag(body, 'xMotivo') ?? 'Motivo desconhecido';
  const ultNSU = extractTag(body, 'ultNSU') ?? '000000000000000';
  const maxNSU = extractTag(body, 'maxNSU') ?? '000000000000000';

  const documentos: DFeDocument[] = [];
  const docZipRegex = /<docZip\s+NSU="(\d+)"\s+schema="([^"]+)"[^>]*>([^<]+)<\/docZip>/g;
  let match: RegExpExecArray | null;

  while ((match = docZipRegex.exec(body)) !== null) {
    const nsu = match[1];
    const schema = match[2];
    const base64Content = match[3];

    try {
      const xml = decompressDocZip(base64Content);
      documentos.push({ nsu, schema, xml });
    } catch {
      documentos.push({
        nsu,
        schema,
        xml: `<erro>Falha ao descompactar documento NSU ${nsu}</erro>`
      });
    }
  }

  return { cStat, xMotivo, ultNSU, maxNSU, documentos };
}

/**
 * Descompacta um docZip (base64 + GZip) para XML.
 */
export function decompressDocZip(base64Content: string): string {
  const buffer = Buffer.from(base64Content, 'base64');
  const decompressed = gunzipSync(buffer);
  return decompressed.toString('utf-8');
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}
