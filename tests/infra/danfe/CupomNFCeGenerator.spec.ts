import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractInfNFeSupl } from '@nfe/infra/danfe/CupomNFCeGenerator';

describe('CupomNFCeGenerator', () => {
  describe('extractInfNFeSupl', () => {
    it('deve extrair qrCode de CDATA', () => {
      const xml = '<infNFeSupl><qrCode><![CDATA[https://example.com/qr?p=123]]></qrCode><urlChave>https://example.com/consulta</urlChave></infNFeSupl>';
      const result = extractInfNFeSupl(xml);
      assert.strictEqual(result.qrCodeUrl, 'https://example.com/qr?p=123');
      assert.strictEqual(result.urlChave, 'https://example.com/consulta');
    });

    it('deve extrair qrCode sem CDATA', () => {
      const xml = '<infNFeSupl><qrCode>https://example.com/qr</qrCode><urlChave>https://example.com</urlChave></infNFeSupl>';
      const result = extractInfNFeSupl(xml);
      assert.strictEqual(result.qrCodeUrl, 'https://example.com/qr');
    });

    it('deve retornar vazio quando infNFeSupl nao existe', () => {
      const xml = '<NFe><infNFe>...</infNFe></NFe>';
      const result = extractInfNFeSupl(xml);
      assert.strictEqual(result.qrCodeUrl, undefined);
      assert.strictEqual(result.urlChave, undefined);
    });
  });
});
