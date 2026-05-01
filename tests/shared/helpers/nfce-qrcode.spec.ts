import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildNFCeQRCodeUrl, buildInfNFeSupl } from '@nfe/shared/helpers/nfce-qrcode';

describe('nfce-qrcode', () => {
  const baseParams = {
    urlQRCode: 'https://homologacao.sefaz.mt.gov.br/nfce/consultanfce',
    chNFe: '51260411222333000181650010000000011123456789',
    tpAmb: '2' as const,
    cDest: '',
    cIdToken: '000001',
    csc: 'CSCTESTE123456'
  };

  describe('buildNFCeQRCodeUrl - online (tpEmis != 9)', () => {
    const params = { ...baseParams, tpEmis: 1 };

    it('deve gerar URL com formato correto', () => {
      const url = buildNFCeQRCodeUrl(params);
      assert.ok(url.startsWith(params.urlQRCode + '?p='));
    });

    it('deve conter chave de acesso no inicio dos parametros', () => {
      const url = buildNFCeQRCodeUrl(params);
      const p = url.split('?p=')[1];
      assert.ok(p.startsWith(params.chNFe));
    });

    it('deve conter versao 2 do QR Code', () => {
      const url = buildNFCeQRCodeUrl(params);
      const parts = url.split('?p=')[1].split('|');
      assert.strictEqual(parts[1], '2');
    });

    it('deve ter 5 campos: chNFe|2|tpAmb|cIdToken|cHashQRCode', () => {
      const url = buildNFCeQRCodeUrl(params);
      const parts = url.split('?p=')[1].split('|');
      assert.strictEqual(parts.length, 5);
      assert.strictEqual(parts[0], params.chNFe);
      assert.strictEqual(parts[1], '2');
      assert.strictEqual(parts[2], '2');
      assert.strictEqual(parts[3], '1'); // cIdToken sem zeros
      assert.ok(/^[0-9A-F]{40}$/.test(parts[4]));
    });

    it('deve remover zeros a esquerda do cIdToken', () => {
      const url = buildNFCeQRCodeUrl(params);
      const parts = url.split('?p=')[1].split('|');
      assert.strictEqual(parts[3], '1');
    });
  });

  describe('buildNFCeQRCodeUrl - offline (tpEmis = 9)', () => {
    const params = {
      ...baseParams,
      tpEmis: 9,
      dhEmi: '2026-04-28T10:00:00-03:00',
      vNF: '10.00',
      vICMS: '0.00',
      digVal: 'aW1hZ2VtIGRlIHRlc3Rl'
    };

    it('deve ter 8 campos: chNFe|2|tpAmb|dhEmiHex|vNF|digValHex|cIdToken|cHashQRCode', () => {
      const url = buildNFCeQRCodeUrl(params);
      const parts = url.split('?p=')[1].split('|');
      assert.strictEqual(parts.length, 8);
    });

    it('deve conter dhEmi em hex', () => {
      const url = buildNFCeQRCodeUrl(params);
      const parts = url.split('?p=')[1].split('|');
      assert.ok(/^[0-9a-fA-F]+$/.test(parts[3]));
    });

    it('deve conter cHashQRCode como ultimo campo', () => {
      const url = buildNFCeQRCodeUrl(params);
      const parts = url.split('?p=')[1].split('|');
      assert.ok(/^[0-9A-F]{40}$/.test(parts[7]));
    });
  });

  describe('buildInfNFeSupl', () => {
    it('deve gerar XML com qrCode em CDATA', () => {
      const xml = buildInfNFeSupl(
        'https://example.com/qrcode?p=123',
        'https://example.com/consulta'
      );
      assert.ok(xml.includes('<infNFeSupl>'));
      assert.ok(xml.includes('<qrCode><![CDATA[https://example.com/qrcode?p=123]]></qrCode>'));
      assert.ok(xml.includes('<urlChave>https://example.com/consulta</urlChave>'));
      assert.ok(xml.includes('</infNFeSupl>'));
    });
  });
});
