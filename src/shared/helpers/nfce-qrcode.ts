import { createHash } from 'node:crypto';

export type NFCeQRCodeParams = {
  readonly urlQRCode: string;
  readonly chNFe: string;
  readonly tpAmb: '1' | '2';
  readonly cDest: string;
  readonly cIdToken: string;
  readonly csc: string;
  /** Campos obrigatorios apenas para contingencia offline (tpEmis=9) */
  readonly dhEmi?: string;
  readonly vNF?: string;
  readonly vICMS?: string;
  readonly digVal?: string;
  readonly tpEmis?: number;
};

/**
 * Gera a URL do QR Code v2 da NFC-e.
 *
 * Online (tpEmis != 9):
 *   ?p={chNFe}|2|{tpAmb}|{cDest}|{cHashQRCode}
 *   cHashQRCode = SHA1({chNFe}|2|{tpAmb}|{cIdToken}{CSC})
 *
 * Offline (tpEmis = 9):
 *   ?p={chNFe}|2|{tpAmb}|{dhEmi_hex}|{vNF}|{digVal_hex}|{cIdToken}|{cHashQRCode}
 *   cHashQRCode = SHA1({chNFe}|2|{tpAmb}|{dhEmi_hex}|{vNF}|{digVal_hex}|{cIdToken}{CSC})
 */
export function buildNFCeQRCodeUrl(params: NFCeQRCodeParams): string {
  const nVersao = '2';
  const isOffline = params.tpEmis === 9;

  if (isOffline) {
    return buildOfflineQRCode(params, nVersao);
  }

  return buildOnlineQRCode(params, nVersao);
}

function buildOnlineQRCode(params: NFCeQRCodeParams, nVersao: string): string {
  const cIdTokenNum = String(Number(params.cIdToken));

  const payload =
    params.chNFe + '|' +
    nVersao + '|' +
    params.tpAmb + '|' +
    cIdTokenNum;

  const hashInput = payload + params.csc;
  const cHashQRCode = createHash('sha1').update(hashInput).digest('hex').toUpperCase();

  return params.urlQRCode + '?p=' + payload + '|' + cHashQRCode;
}

function buildOfflineQRCode(params: NFCeQRCodeParams, nVersao: string): string {
  const dhEmiHex = toHex(params.dhEmi ?? '');
  const digValHex = toHex(params.digVal ?? '');

  const payload =
    params.chNFe + '|' +
    nVersao + '|' +
    params.tpAmb + '|' +
    dhEmiHex + '|' +
    params.vNF + '|' +
    digValHex + '|' +
    params.cIdToken;

  const hashInput = payload + params.csc;
  const cHashQRCode = createHash('sha1').update(hashInput).digest('hex').toUpperCase();

  return params.urlQRCode + '?p=' + payload + '|' + cHashQRCode;
}

/**
 * Monta o bloco <infNFeSupl> com qrCode e urlChave.
 * Inserido apos </infNFe> e antes de <Signature>.
 */
export function buildInfNFeSupl(qrCodeUrl: string, urlChave: string): string {
  return (
    '<infNFeSupl>' +
    `<qrCode><![CDATA[${qrCodeUrl}]]></qrCode>` +
    `<urlChave>${urlChave}</urlChave>` +
    '</infNFeSupl>'
  );
}

function toHex(value: string): string {
  return Buffer.from(value, 'utf-8').toString('hex');
}
