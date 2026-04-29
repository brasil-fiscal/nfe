import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAutorizacaoEnvelope,
  buildConsultaEnvelope,
  extractSoapBody,
  parseAutorizacaoResponse,
  parseConsultaResponse
} from '@nfe/infra/sefaz/soap';

describe('soap', () => {
  describe('buildAutorizacaoEnvelope', () => {
    it('deve gerar envelope SOAP com NFe assinada', () => {
      const nfeXml = '<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe>...</infNFe></NFe>';
      const envelope = buildAutorizacaoEnvelope(nfeXml);

      assert.ok(envelope.includes('<soap12:Envelope'));
      assert.ok(envelope.includes('<enviNFe versao="4.00"'));
      assert.ok(envelope.includes('<idLote>1</idLote>'));
      assert.ok(envelope.includes('<indSinc>1</indSinc>'));
      assert.ok(envelope.includes('<NFe xmlns="http://www.portalfiscal.inf.br/nfe">'));
      assert.ok(envelope.includes('nfeDadosMsg'));
    });

    it('deve aceitar idLote customizado', () => {
      const envelope = buildAutorizacaoEnvelope('<NFe/>', '42');
      assert.ok(envelope.includes('<idLote>42</idLote>'));
    });

    it('deve remover declaracao XML da NFe assinada', () => {
      const nfeXml = '<?xml version="1.0" encoding="UTF-8"?><NFe/>';
      const envelope = buildAutorizacaoEnvelope(nfeXml);

      const xmlDeclCount = (envelope.match(/<\?xml/g) ?? []).length;
      assert.equal(xmlDeclCount, 1, 'deve ter apenas uma declaracao XML');
    });
  });

  describe('buildConsultaEnvelope', () => {
    it('deve gerar envelope SOAP para consulta', () => {
      const chave = '51240412345678000195550010000000011234567890';
      const envelope = buildConsultaEnvelope(chave, '2');

      assert.ok(envelope.includes('<consSitNFe versao="4.00"'));
      assert.ok(envelope.includes('<tpAmb>2</tpAmb>'));
      assert.ok(envelope.includes('<xServ>CONSULTAR</xServ>'));
      assert.ok(envelope.includes(`<chNFe>${chave}</chNFe>`));
      assert.ok(envelope.includes('NFeConsultaProtocolo4'));
    });

    it('deve usar tpAmb 1 para producao', () => {
      const envelope = buildConsultaEnvelope('12345678901234567890123456789012345678901234', '1');
      assert.ok(envelope.includes('<tpAmb>1</tpAmb>'));
    });
  });

  describe('extractSoapBody', () => {
    it('deve extrair conteudo do Body com namespace soap12', () => {
      const soap = [
        '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
        '<soap12:Body><retEnviNFe>conteudo</retEnviNFe></soap12:Body>',
        '</soap12:Envelope>'
      ].join('');

      const body = extractSoapBody(soap);
      assert.equal(body, '<retEnviNFe>conteudo</retEnviNFe>');
    });

    it('deve extrair conteudo do Body com namespace soapenv', () => {
      const soap = '<soapenv:Body><retConsSitNFe>dados</retConsSitNFe></soapenv:Body>';
      const body = extractSoapBody(soap);
      assert.equal(body, '<retConsSitNFe>dados</retConsSitNFe>');
    });

    it('deve lancar erro se Body nao encontrado', () => {
      assert.throws(
        () => extractSoapBody('<xml>sem body</xml>'),
        { message: /Body nao encontrado/ }
      );
    });
  });

  describe('parseAutorizacaoResponse', () => {
    it('deve parsear resposta autorizada (cStat 100)', () => {
      const body = [
        '<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe">',
        '<cStat>104</cStat>',
        '<xMotivo>Lote processado</xMotivo>',
        '<protNFe versao="4.00">',
        '<infProt>',
        '<cStat>100</cStat>',
        '<xMotivo>Autorizado o uso da NF-e</xMotivo>',
        '<nProt>151240000012345</nProt>',
        '<dhRecbto>2024-04-29T10:00:00-04:00</dhRecbto>',
        '<chNFe>51240412345678000195550010000000011234567890</chNFe>',
        '</infProt>',
        '</protNFe>',
        '</retEnviNFe>'
      ].join('');

      const result = parseAutorizacaoResponse(body);
      assert.equal(result.cStat, '100');
      assert.equal(result.xMotivo, 'Autorizado o uso da NF-e');
      assert.equal(result.nProt, '151240000012345');
      assert.equal(result.chNFe, '51240412345678000195550010000000011234567890');
      assert.ok(result.dhRecbto);
    });

    it('deve parsear rejeicao do lote (cStat != 104)', () => {
      const body = [
        '<retEnviNFe>',
        '<cStat>215</cStat>',
        '<xMotivo>Rejeicao: Chave de Acesso invalida</xMotivo>',
        '</retEnviNFe>'
      ].join('');

      const result = parseAutorizacaoResponse(body);
      assert.equal(result.cStat, '215');
      assert.equal(result.xMotivo, 'Rejeicao: Chave de Acesso invalida');
      assert.equal(result.nProt, undefined);
    });

    it('deve parsear rejeicao individual (protNFe com cStat != 100)', () => {
      const body = [
        '<retEnviNFe>',
        '<cStat>104</cStat>',
        '<xMotivo>Lote processado</xMotivo>',
        '<protNFe versao="4.00">',
        '<infProt>',
        '<cStat>539</cStat>',
        '<xMotivo>Rejeicao: Duplicidade de NF-e</xMotivo>',
        '</infProt>',
        '</protNFe>',
        '</retEnviNFe>'
      ].join('');

      const result = parseAutorizacaoResponse(body);
      assert.equal(result.cStat, '539');
      assert.equal(result.xMotivo, 'Rejeicao: Duplicidade de NF-e');
    });

    it('deve lancar erro se resposta sem cStat', () => {
      assert.throws(
        () => parseAutorizacaoResponse('<retEnviNFe></retEnviNFe>'),
        { message: /sem cStat/ }
      );
    });
  });

  describe('parseConsultaResponse', () => {
    it('deve parsear consulta com protocolo autorizado', () => {
      const body = [
        '<retConsSitNFe>',
        '<cStat>100</cStat>',
        '<xMotivo>Autorizado o uso da NF-e</xMotivo>',
        '<protNFe>',
        '<infProt>',
        '<cStat>100</cStat>',
        '<xMotivo>Autorizado o uso da NF-e</xMotivo>',
        '<nProt>151240000012345</nProt>',
        '<dhRecbto>2024-04-29T10:00:00-04:00</dhRecbto>',
        '</infProt>',
        '</protNFe>',
        '</retConsSitNFe>'
      ].join('');

      const result = parseConsultaResponse(body);
      assert.equal(result.cStat, '100');
      assert.equal(result.nProt, '151240000012345');
      assert.ok(result.dhRecbto);
    });

    it('deve parsear consulta sem protNFe (NFe nao encontrada)', () => {
      const body = [
        '<retConsSitNFe>',
        '<cStat>217</cStat>',
        '<xMotivo>NF-e nao consta na base de dados da SEFAZ</xMotivo>',
        '</retConsSitNFe>'
      ].join('');

      const result = parseConsultaResponse(body);
      assert.equal(result.cStat, '217');
      assert.equal(result.xMotivo, 'NF-e nao consta na base de dados da SEFAZ');
      assert.equal(result.nProt, undefined);
    });

    it('deve lancar erro se resposta sem cStat', () => {
      assert.throws(
        () => parseConsultaResponse('<retConsSitNFe></retConsSitNFe>'),
        { message: /sem cStat/ }
      );
    });
  });
});
