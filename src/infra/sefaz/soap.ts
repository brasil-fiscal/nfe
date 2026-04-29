import { NFeError } from '@nfe/shared/errors/NFeError';

const NFE_NAMESPACE = 'http://www.portalfiscal.inf.br/nfe';

type SoapService = 'NFeAutorizacao4' | 'NFeConsultaProtocolo4';

const WSDL_NAMESPACE: Record<SoapService, string> = {
  NFeAutorizacao4: `${NFE_NAMESPACE}/wsdl/NFeAutorizacao4`,
  NFeConsultaProtocolo4: `${NFE_NAMESPACE}/wsdl/NFeConsultaProtocolo4`
};

export const SOAP_ACTIONS: Record<SoapService, string> = {
  NFeAutorizacao4: `${NFE_NAMESPACE}/wsdl/NFeAutorizacao4/nfeAutorizacaoLote`,
  NFeConsultaProtocolo4: `${NFE_NAMESPACE}/wsdl/NFeConsultaProtocolo4/nfeConsultaNF`
};

/**
 * Monta envelope SOAP para envio sincrono de NFe (NFeAutorizacao4).
 */
export function buildAutorizacaoEnvelope(
  signedNFeXml: string,
  idLote: string = '1'
): string {
  const innerXml = signedNFeXml.replace(/<\?xml[^?]*\?>\s*/g, '');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Header/>',
    '<soap12:Body>',
    `<nfeDadosMsg xmlns="${WSDL_NAMESPACE.NFeAutorizacao4}">`,
    `<enviNFe versao="4.00" xmlns="${NFE_NAMESPACE}">`,
    `<idLote>${idLote}</idLote>`,
    '<indSinc>1</indSinc>',
    innerXml,
    '</enviNFe>',
    '</nfeDadosMsg>',
    '</soap12:Body>',
    '</soap12:Envelope>'
  ].join('');
}

/**
 * Monta envelope SOAP para consulta de protocolo (NFeConsultaProtocolo4).
 */
export function buildConsultaEnvelope(
  chaveAcesso: string,
  tpAmb: '1' | '2'
): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Header/>',
    '<soap12:Body>',
    `<nfeDadosMsg xmlns="${WSDL_NAMESPACE.NFeConsultaProtocolo4}">`,
    `<consSitNFe versao="4.00" xmlns="${NFE_NAMESPACE}">`,
    `<tpAmb>${tpAmb}</tpAmb>`,
    '<xServ>CONSULTAR</xServ>',
    `<chNFe>${chaveAcesso}</chNFe>`,
    '</consSitNFe>',
    '</nfeDadosMsg>',
    '</soap12:Body>',
    '</soap12:Envelope>'
  ].join('');
}

/**
 * Extrai o conteudo dentro de <soap12:Body> ou <soapenv:Body>.
 */
export function extractSoapBody(soapXml: string): string {
  const match = soapXml.match(/<(?:soap12|soapenv|soap):Body[^>]*>([\s\S]*?)<\/(?:soap12|soapenv|soap):Body>/i);
  if (!match) {
    throw new NFeError('Resposta SOAP invalida: Body nao encontrado');
  }
  return match[1].trim();
}

export type AutorizacaoResult = {
  readonly cStat: string;
  readonly xMotivo: string;
  readonly nProt?: string;
  readonly dhRecbto?: string;
  readonly chNFe?: string;
  readonly xmlProtocolado?: string;
};

/**
 * Parseia a resposta de NFeAutorizacao4.
 * Extrai campos do <protNFe> dentro de <retEnviNFe>.
 */
export function parseAutorizacaoResponse(body: string): AutorizacaoResult {
  const cStatLote = extractTag(body, 'cStat');
  if (!cStatLote) {
    throw new NFeError('Resposta da SEFAZ sem cStat');
  }

  // cStat do lote (nivel retEnviNFe)
  // 104 = Lote processado — verificar protNFe individual
  if (cStatLote !== '104') {
    return {
      cStat: cStatLote,
      xMotivo: extractTag(body, 'xMotivo') ?? 'Motivo desconhecido'
    };
  }

  // Extrai protNFe
  const protNFe = body.match(/<protNFe[^>]*>([\s\S]*?)<\/protNFe>/);
  if (!protNFe) {
    throw new NFeError('Resposta da SEFAZ sem protNFe');
  }

  const proto = protNFe[1];
  return {
    cStat: extractTag(proto, 'cStat') ?? cStatLote,
    xMotivo: extractTag(proto, 'xMotivo') ?? 'Motivo desconhecido',
    nProt: extractTag(proto, 'nProt') ?? undefined,
    dhRecbto: extractTag(proto, 'dhRecbto') ?? undefined,
    chNFe: extractTag(proto, 'chNFe') ?? undefined
  };
}

export type ConsultaResult = {
  readonly cStat: string;
  readonly xMotivo: string;
  readonly nProt?: string;
  readonly dhRecbto?: string;
};

/**
 * Parseia a resposta de NFeConsultaProtocolo4.
 * Extrai campos do <retConsSitNFe>.
 */
export function parseConsultaResponse(body: string): ConsultaResult {
  const protNFe = body.match(/<protNFe[^>]*>([\s\S]*?)<\/protNFe>/);

  const source = protNFe ? protNFe[1] : body;
  const cStat = extractTag(source, 'cStat');
  if (!cStat) {
    throw new NFeError('Resposta de consulta sem cStat');
  }

  return {
    cStat,
    xMotivo: extractTag(source, 'xMotivo') ?? 'Motivo desconhecido',
    nProt: extractTag(source, 'nProt') ?? undefined,
    dhRecbto: extractTag(source, 'dhRecbto') ?? undefined
  };
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}
