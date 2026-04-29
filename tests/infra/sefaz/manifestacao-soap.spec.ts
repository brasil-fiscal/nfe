import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildManifestacaoXml,
  wrapManifestacaoSoapEnvelope,
  parseManifestacaoResponse,
  requiresJustificativa
} from '@nfe/infra/sefaz/manifestacao-soap';

const CHAVE = '51240412345678000195550010000000011234567890';

describe('manifestacao-soap', () => {
  describe('buildManifestacaoXml', () => {
    it('deve gerar XML de confirmacao (210200) sem justificativa', () => {
      const xml = buildManifestacaoXml(
        'confirmacao', CHAVE, '12345678000195', '91', '2', '2024-04-29T10:00:00-04:00'
      );

      assert.ok(xml.includes('<tpEvento>210200</tpEvento>'));
      assert.ok(xml.includes(`Id="ID210200${CHAVE}01"`));
      assert.ok(xml.includes('<descEvento>Confirmacao da Operacao</descEvento>'));
      assert.ok(xml.includes('<cOrgao>91</cOrgao>'));
      assert.ok(!xml.includes('<xJust>'));
    });

    it('deve gerar XML de ciencia (210210)', () => {
      const xml = buildManifestacaoXml(
        'ciencia', CHAVE, '12345678000195', '91', '2', '2024-04-29T10:00:00-04:00'
      );

      assert.ok(xml.includes('<tpEvento>210210</tpEvento>'));
      assert.ok(xml.includes('<descEvento>Ciencia da Operacao</descEvento>'));
    });

    it('deve gerar XML de desconhecimento (210220) com justificativa', () => {
      const xml = buildManifestacaoXml(
        'desconhecimento', CHAVE, '12345678000195', '91', '2',
        '2024-04-29T10:00:00-04:00', 'Nao reconheco esta operacao de compra'
      );

      assert.ok(xml.includes('<tpEvento>210220</tpEvento>'));
      assert.ok(xml.includes('<descEvento>Desconhecimento da Operacao</descEvento>'));
      assert.ok(xml.includes('<xJust>Nao reconheco esta operacao de compra</xJust>'));
    });

    it('deve gerar XML de operacao nao realizada (210240) com justificativa', () => {
      const xml = buildManifestacaoXml(
        'naoRealizada', CHAVE, '12345678000195', '91', '2',
        '2024-04-29T10:00:00-04:00', 'Mercadoria devolvida ao remetente'
      );

      assert.ok(xml.includes('<tpEvento>210240</tpEvento>'));
      assert.ok(xml.includes('<descEvento>Operacao nao Realizada</descEvento>'));
      assert.ok(xml.includes('<xJust>Mercadoria devolvida ao remetente</xJust>'));
    });
  });

  describe('wrapManifestacaoSoapEnvelope', () => {
    it('deve envolver evento em SOAP com namespace do AN', () => {
      const signedXml = '<evento versao="1.00"><infEvento>...</infEvento></evento>';
      const envelope = wrapManifestacaoSoapEnvelope(signedXml);

      assert.ok(envelope.includes('<soap12:Envelope'));
      assert.ok(envelope.includes('<envEvento versao="1.00"'));
      assert.ok(envelope.includes('NFeRecepcaoEvento4'));
    });
  });

  describe('parseManifestacaoResponse', () => {
    it('deve parsear resposta de manifestacao registrada (cStat 135)', () => {
      const body = [
        '<retEnvEvento>',
        '<retEvento versao="1.00">',
        '<infEvento>',
        '<cStat>135</cStat>',
        '<xMotivo>Evento registrado e vinculado a NF-e</xMotivo>',
        `<chNFe>${CHAVE}</chNFe>`,
        '<tpEvento>210200</tpEvento>',
        '<dhRegEvento>2024-04-29T10:00:00-04:00</dhRegEvento>',
        '</infEvento>',
        '</retEvento>',
        '</retEnvEvento>'
      ].join('');

      const result = parseManifestacaoResponse(body);
      assert.equal(result.cStat, '135');
      assert.equal(result.tpEvento, '210200');
      assert.ok(result.dhRegEvento);
    });

    it('deve lancar erro se resposta sem cStat', () => {
      assert.throws(
        () => parseManifestacaoResponse('<retEnvEvento></retEnvEvento>'),
        { message: /sem cStat/ }
      );
    });
  });

  describe('requiresJustificativa', () => {
    it('confirmacao nao requer justificativa', () => {
      assert.equal(requiresJustificativa('confirmacao'), false);
    });

    it('ciencia nao requer justificativa', () => {
      assert.equal(requiresJustificativa('ciencia'), false);
    });

    it('desconhecimento requer justificativa', () => {
      assert.equal(requiresJustificativa('desconhecimento'), true);
    });

    it('naoRealizada requer justificativa', () => {
      assert.equal(requiresJustificativa('naoRealizada'), true);
    });
  });
});
