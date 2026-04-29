import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import {
  buildDistNSUEnvelope,
  buildConsChNFeEnvelope,
  parseDistribuicaoResponse,
  decompressDocZip
} from '@nfe/infra/sefaz/distribuicao-soap';

describe('distribuicao-soap', () => {
  describe('buildDistNSUEnvelope', () => {
    it('deve gerar envelope SOAP com distNSU', () => {
      const envelope = buildDistNSUEnvelope('12345678000195', '51', '2', '0');

      assert.ok(envelope.includes('<distDFeInt versao="1.01"'));
      assert.ok(envelope.includes('<tpAmb>2</tpAmb>'));
      assert.ok(envelope.includes('<cUFAutor>51</cUFAutor>'));
      assert.ok(envelope.includes('<CNPJ>12345678000195</CNPJ>'));
      assert.ok(envelope.includes('<ultNSU>000000000000000</ultNSU>'));
      assert.ok(envelope.includes('NFeDistribuicaoDFe'));
    });

    it('deve preencher ultNSU com zeros a esquerda', () => {
      const envelope = buildDistNSUEnvelope('12345678000195', '51', '2', '42');
      assert.ok(envelope.includes('<ultNSU>000000000000042</ultNSU>'));
    });

    it('deve manter ultNSU com 15 digitos se ja completo', () => {
      const envelope = buildDistNSUEnvelope('12345678000195', '51', '1', '000000000012345');
      assert.ok(envelope.includes('<ultNSU>000000000012345</ultNSU>'));
    });
  });

  describe('buildConsChNFeEnvelope', () => {
    it('deve gerar envelope SOAP com consChNFe', () => {
      const chave = '51240412345678000195550010000000011234567890';
      const envelope = buildConsChNFeEnvelope('12345678000195', '51', '2', chave);

      assert.ok(envelope.includes('<consChNFe>'));
      assert.ok(envelope.includes(`<chNFe>${chave}</chNFe>`));
      assert.ok(envelope.includes('<tpAmb>2</tpAmb>'));
    });
  });

  describe('decompressDocZip', () => {
    it('deve descompactar GZip base64 para XML', () => {
      const xml = '<resNFe><chNFe>123</chNFe></resNFe>';
      const compressed = gzipSync(Buffer.from(xml, 'utf-8'));
      const base64 = compressed.toString('base64');

      const result = decompressDocZip(base64);
      assert.equal(result, xml);
    });
  });

  describe('parseDistribuicaoResponse', () => {
    function makeDocZip(nsu: string, schema: string, xml: string): string {
      const compressed = gzipSync(Buffer.from(xml, 'utf-8'));
      const base64 = compressed.toString('base64');
      return `<docZip NSU="${nsu}" schema="${schema}">${base64}</docZip>`;
    }

    it('deve parsear resposta com documentos (cStat 138)', () => {
      const doc1 = makeDocZip('000000000000001', 'resNFe_v1.01.xsd', '<resNFe>doc1</resNFe>');
      const doc2 = makeDocZip('000000000000002', 'procNFe_v4.00.xsd', '<procNFe>doc2</procNFe>');

      const body = [
        '<retDistDFeInt xmlns="http://www.portalfiscal.inf.br/nfe">',
        '<cStat>138</cStat>',
        '<xMotivo>Documento localizado</xMotivo>',
        '<ultNSU>000000000000002</ultNSU>',
        '<maxNSU>000000000000050</maxNSU>',
        '<loteDistDFeInt>',
        doc1,
        doc2,
        '</loteDistDFeInt>',
        '</retDistDFeInt>'
      ].join('');

      const result = parseDistribuicaoResponse(body);

      assert.equal(result.cStat, '138');
      assert.equal(result.xMotivo, 'Documento localizado');
      assert.equal(result.ultNSU, '000000000000002');
      assert.equal(result.maxNSU, '000000000000050');
      assert.equal(result.documentos.length, 2);
      assert.equal(result.documentos[0].nsu, '000000000000001');
      assert.equal(result.documentos[0].schema, 'resNFe_v1.01.xsd');
      assert.equal(result.documentos[0].xml, '<resNFe>doc1</resNFe>');
      assert.equal(result.documentos[1].nsu, '000000000000002');
      assert.equal(result.documentos[1].xml, '<procNFe>doc2</procNFe>');
    });

    it('deve parsear resposta sem documentos (cStat 137)', () => {
      const body = [
        '<retDistDFeInt>',
        '<cStat>137</cStat>',
        '<xMotivo>Nenhum documento localizado</xMotivo>',
        '<ultNSU>000000000000000</ultNSU>',
        '<maxNSU>000000000000000</maxNSU>',
        '</retDistDFeInt>'
      ].join('');

      const result = parseDistribuicaoResponse(body);

      assert.equal(result.cStat, '137');
      assert.equal(result.documentos.length, 0);
    });

    it('deve lancar erro se resposta sem cStat', () => {
      assert.throws(
        () => parseDistribuicaoResponse('<retDistDFeInt></retDistDFeInt>'),
        { message: /sem cStat/ }
      );
    });

    it('deve incluir ultNSU e maxNSU padrao quando ausentes', () => {
      const body = '<retDistDFeInt><cStat>137</cStat></retDistDFeInt>';
      const result = parseDistribuicaoResponse(body);

      assert.equal(result.ultNSU, '000000000000000');
      assert.equal(result.maxNSU, '000000000000000');
    });
  });
});
