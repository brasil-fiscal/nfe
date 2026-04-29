import { NFeError } from '@nfe/shared/errors/NFeError';

const NFE_NAMESPACE = 'http://www.portalfiscal.inf.br/nfe';

export const MANIFESTACAO_SOAP_ACTION =
  `${NFE_NAMESPACE}/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento`;

export type TipoManifestacao = 'confirmacao' | 'ciencia' | 'desconhecimento' | 'naoRealizada';

type ManifestacaoConfig = {
  readonly tpEvento: string;
  readonly descEvento: string;
  readonly requiresJustificativa: boolean;
};

const MANIFESTACAO_CONFIG: Record<TipoManifestacao, ManifestacaoConfig> = {
  confirmacao: {
    tpEvento: '210200',
    descEvento: 'Confirmacao da Operacao',
    requiresJustificativa: false
  },
  ciencia: {
    tpEvento: '210210',
    descEvento: 'Ciencia da Operacao',
    requiresJustificativa: false
  },
  desconhecimento: {
    tpEvento: '210220',
    descEvento: 'Desconhecimento da Operacao',
    requiresJustificativa: true
  },
  naoRealizada: {
    tpEvento: '210240',
    descEvento: 'Operacao nao Realizada',
    requiresJustificativa: true
  }
};

/**
 * Monta XML de manifestacao do destinatario — SEM envelope SOAP.
 * Precisa ser assinado antes de envolver no SOAP.
 */
export function buildManifestacaoXml(
  tipo: TipoManifestacao,
  chNFe: string,
  cnpj: string,
  cOrgao: string,
  tpAmb: '1' | '2',
  dhEvento: string,
  xJust?: string
): string {
  const config = MANIFESTACAO_CONFIG[tipo];
  const id = `ID${config.tpEvento}${chNFe}01`;

  const detEventoContent = xJust
    ? `<descEvento>${config.descEvento}</descEvento><xJust>${xJust}</xJust>`
    : `<descEvento>${config.descEvento}</descEvento>`;

  return [
    `<evento versao="1.00" xmlns="${NFE_NAMESPACE}">`,
    `<infEvento Id="${id}">`,
    `<cOrgao>${cOrgao}</cOrgao>`,
    `<tpAmb>${tpAmb}</tpAmb>`,
    `<CNPJ>${cnpj}</CNPJ>`,
    `<chNFe>${chNFe}</chNFe>`,
    `<dhEvento>${dhEvento}</dhEvento>`,
    `<tpEvento>${config.tpEvento}</tpEvento>`,
    '<nSeqEvento>1</nSeqEvento>',
    '<verEvento>1.00</verEvento>',
    `<detEvento versao="1.00">${detEventoContent}</detEvento>`,
    '</infEvento>',
    '</evento>'
  ].join('');
}

/**
 * Envolve XML de manifestacao assinado em envelope SOAP.
 * Usa o RecepcaoEvento4 do Ambiente Nacional.
 */
export function wrapManifestacaoSoapEnvelope(signedEventoXml: string): string {
  const inner = signedEventoXml.replace(/<\?xml[^?]*\?>\s*/g, '');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Header/>',
    '<soap12:Body>',
    `<nfeDadosMsg xmlns="${NFE_NAMESPACE}/wsdl/NFeRecepcaoEvento4">`,
    `<envEvento versao="1.00" xmlns="${NFE_NAMESPACE}">`,
    '<idLote>1</idLote>',
    inner,
    '</envEvento>',
    '</nfeDadosMsg>',
    '</soap12:Body>',
    '</soap12:Envelope>'
  ].join('');
}

export type ManifestacaoResult = {
  readonly cStat: string;
  readonly xMotivo: string;
  readonly chNFe?: string;
  readonly tpEvento?: string;
  readonly dhRegEvento?: string;
};

/**
 * Parseia resposta de manifestacao do destinatario.
 */
export function parseManifestacaoResponse(body: string): ManifestacaoResult {
  const retEvento = body.match(/<retEvento[^>]*>([\s\S]*?)<\/retEvento>/);
  const source = retEvento ? retEvento[1] : body;

  const cStat = extractTag(source, 'cStat');
  if (!cStat) {
    throw new NFeError('Resposta de manifestacao sem cStat');
  }

  return {
    cStat,
    xMotivo: extractTag(source, 'xMotivo') ?? 'Motivo desconhecido',
    chNFe: extractTag(source, 'chNFe') ?? undefined,
    tpEvento: extractTag(source, 'tpEvento') ?? undefined,
    dhRegEvento: extractTag(source, 'dhRegEvento') ?? undefined
  };
}

/**
 * Retorna true se o tipo de manifestacao requer justificativa.
 */
export function requiresJustificativa(tipo: TipoManifestacao): boolean {
  return MANIFESTACAO_CONFIG[tipo].requiresJustificativa;
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}
