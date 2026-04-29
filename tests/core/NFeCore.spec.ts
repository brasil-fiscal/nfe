import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NFeCore } from '@nfe/core/NFeCore';
import type { XmlBuilder } from '@nfe/contracts/XmlBuilder';
import type { XmlSigner } from '@nfe/contracts/XmlSigner';
import type { CertificateProvider, CertificateData } from '@nfe/contracts/CertificateProvider';
import type { SefazTransport, SefazRequest } from '@nfe/contracts/SefazTransport';
import type { NFeProps } from '@nfe/domain/entities/NFe';

const fakeCert: CertificateData = {
  pfx: Buffer.from('fake-pfx'),
  password: 'test',
  notAfter: new Date('2030-01-01'),
  privateKey: 'fake-key',
  certPem: 'fake-cert'
};

const fakeNFe = {} as NFeProps;

function buildAutorizacaoResponse(cStat: string, xMotivo: string, nProt?: string, chNFe?: string): string {
  const protNFe = [
    '<protNFe versao="4.00"><infProt>',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    nProt ? `<nProt>${nProt}</nProt>` : '',
    '<dhRecbto>2024-04-29T10:00:00-04:00</dhRecbto>',
    chNFe ? `<chNFe>${chNFe}</chNFe>` : '',
    '</infProt></protNFe>'
  ].join('');

  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe">',
    '<cStat>104</cStat><xMotivo>Lote processado</xMotivo>',
    protNFe,
    '</retEnviNFe>',
    '</soap12:Body></soap12:Envelope>'
  ].join('');
}

function buildConsultaResponse(cStat: string, xMotivo: string, nProt?: string): string {
  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retConsSitNFe xmlns="http://www.portalfiscal.inf.br/nfe">',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    nProt ? `<nProt>${nProt}</nProt>` : '',
    '<dhRecbto>2024-04-29T10:00:00-04:00</dhRecbto>',
    '</retConsSitNFe>',
    '</soap12:Body></soap12:Envelope>'
  ].join('');
}

function buildEventoResponse(cStat: string, xMotivo: string): string {
  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retEnvEvento xmlns="http://www.portalfiscal.inf.br/nfe">',
    '<retEvento><infEvento>',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    '<nProt>151240000099999</nProt>',
    '</infEvento></retEvento>',
    '</retEnvEvento>',
    '</soap12:Body></soap12:Envelope>'
  ].join('');
}

function buildInutilizacaoResponse(cStat: string, xMotivo: string): string {
  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retInutNFe xmlns="http://www.portalfiscal.inf.br/nfe">',
    '<infInut>',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    '<nProt>151240000099999</nProt>',
    '</infInut>',
    '</retInutNFe>',
    '</soap12:Body></soap12:Envelope>'
  ].join('');
}

function buildDistribuicaoResponse(cStat: string, xMotivo: string): string {
  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retDistDFeInt xmlns="http://www.portalfiscal.inf.br/nfe">',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    '<ultNSU>000000000000000</ultNSU>',
    '<maxNSU>000000000000000</maxNSU>',
    '</retDistDFeInt>',
    '</soap12:Body></soap12:Envelope>'
  ].join('');
}

function buildManifestacaoResponse(cStat: string, xMotivo: string): string {
  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retEnvEvento xmlns="http://www.portalfiscal.inf.br/nfe">',
    '<retEvento><infEvento>',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    '<nProt>151240000099999</nProt>',
    '</infEvento></retEvento>',
    '</retEnvEvento>',
    '</soap12:Body></soap12:Envelope>'
  ].join('');
}

function createNFe(transportResponse: string): NFeCore {
  const transport: SefazTransport = {
    send: async () => ({ xml: transportResponse, statusCode: 200 })
  };
  const certificate: CertificateProvider = {
    load: async () => fakeCert
  };
  const xmlBuilder: XmlBuilder = { build: () => '<NFe>xml</NFe>' };
  const xmlSigner: XmlSigner = { sign: () => '<NFe>signed</NFe>' };

  return NFeCore.create({
    pfx: Buffer.from('fake'),
    senha: 'test',
    ambiente: 'homologacao',
    uf: 'MT',
    transport,
    certificate,
    xmlBuilder,
    xmlSigner
  });
}

const CHAVE_51 = '51240412345678000195550010000000011234567890';
const CNPJ = '12345678000195';

describe('NFeCore', () => {
  describe('create()', () => {
    it('deve criar instancia com configuracao minima', () => {
      const nfe = NFeCore.create({
        pfx: Buffer.from('fake'),
        senha: 'test',
        ambiente: 'homologacao',
        uf: 'MT'
      });
      assert.ok(nfe);
      assert.ok(nfe.manifestar);
    });

    it('deve aceitar providers customizados', () => {
      const customBuilder: XmlBuilder = { build: () => '<custom/>' };
      const nfe = NFeCore.create({
        pfx: Buffer.from('fake'),
        senha: 'test',
        ambiente: 'producao',
        uf: 'SP',
        xmlBuilder: customBuilder
      });
      assert.ok(nfe);
    });
  });

  describe('transmitir()', () => {
    it('deve transmitir NFe e retornar resultado autorizado', async () => {
      const response = buildAutorizacaoResponse(
        '100', 'Autorizado o uso da NF-e', '151240000012345', CHAVE_51
      );
      const nfe = createNFe(response);
      const result = await nfe.transmitir(fakeNFe);

      assert.equal(result.autorizada, true);
      assert.equal(result.protocolo, '151240000012345');
      assert.equal(result.codigoStatus, '100');
    });

    it('deve lancar SefazRejectError quando rejeitada', async () => {
      const response = buildAutorizacaoResponse('301', 'Uso Denegado');
      const nfe = createNFe(response);

      await assert.rejects(
        () => nfe.transmitir(fakeNFe),
        (err: Error) => err.constructor.name === 'SefazRejectError'
      );
    });
  });

  describe('consultarProtocolo()', () => {
    it('deve consultar protocolo pela chave de acesso', async () => {
      const response = buildConsultaResponse('100', 'Autorizado o uso da NF-e', '151240000012345');
      const nfe = createNFe(response);
      const result = await nfe.consultarProtocolo(CHAVE_51);

      assert.equal(result.codigoStatus, '100');
      assert.equal(result.protocolo, '151240000012345');
    });
  });

  describe('cancelar()', () => {
    it('deve cancelar NFe com sucesso', async () => {
      const response = buildEventoResponse('135', 'Evento registrado e vinculado a NF-e');
      const nfe = createNFe(response);
      const result = await nfe.cancelar({
        chaveAcesso: CHAVE_51,
        cnpj: CNPJ,
        protocolo: '151240000012345',
        justificativa: 'Erro na emissao da nota fiscal'
      });

      assert.equal(result.cStat, '135');
    });
  });

  describe('cartaCorrecao()', () => {
    it('deve enviar carta de correcao com sucesso', async () => {
      const response = buildEventoResponse('135', 'Evento registrado e vinculado a NF-e');
      const nfe = createNFe(response);
      const result = await nfe.cartaCorrecao({
        chaveAcesso: CHAVE_51,
        cnpj: CNPJ,
        correcao: 'Correcao do endereco do destinatario conforme solicitado'
      });

      assert.equal(result.cStat, '135');
    });
  });

  describe('inutilizar()', () => {
    it('deve inutilizar numeracao com sucesso', async () => {
      const response = buildInutilizacaoResponse('102', 'Inutilizacao de numero homologado');
      const nfe = createNFe(response);
      const result = await nfe.inutilizar({
        cnpj: CNPJ,
        ano: 2024,
        serie: 1,
        numeroInicial: 1,
        numeroFinal: 10,
        justificativa: 'Numeracao inutilizada por erro de sequencia'
      });

      assert.equal(result.cStat, '102');
    });

    it('deve usar UF do config quando nao informada no input', async () => {
      const response = buildInutilizacaoResponse('102', 'Inutilizacao de numero homologado');
      let capturedUrl = '';
      const transport: SefazTransport = {
        send: async (req: SefazRequest) => {
          capturedUrl = req.url;
          return { xml: response, statusCode: 200 };
        }
      };

      const nfe = NFeCore.create({
        pfx: Buffer.from('fake'),
        senha: 'test',
        ambiente: 'homologacao',
        uf: 'MT',
        transport,
        certificate: { load: async () => fakeCert },
        xmlSigner: { sign: () => '<signed/>' }
      });

      await nfe.inutilizar({
        cnpj: CNPJ,
        ano: 2024,
        serie: 1,
        numeroInicial: 1,
        numeroFinal: 1,
        justificativa: 'Numeracao inutilizada por erro de sequencia'
      });

      assert.ok(capturedUrl.includes('homologacao'), 'URL deve ser de homologacao');
    });
  });

  describe('distribuicaoPorNSU()', () => {
    it('deve consultar distribuicao por NSU', async () => {
      const response = buildDistribuicaoResponse('137', 'Nenhum documento localizado');
      const nfe = createNFe(response);
      const result = await nfe.distribuicaoPorNSU(CNPJ);

      assert.equal(result.cStat, '137');
    });
  });

  describe('distribuicaoPorChave()', () => {
    it('deve consultar distribuicao por chave', async () => {
      const response = buildDistribuicaoResponse('137', 'Nenhum documento localizado');
      const nfe = createNFe(response);
      const result = await nfe.distribuicaoPorChave(CNPJ, CHAVE_51);

      assert.equal(result.cStat, '137');
    });
  });

  describe('manifestar', () => {
    it('deve confirmar operacao', async () => {
      const response = buildManifestacaoResponse('135', 'Evento registrado');
      const nfe = createNFe(response);
      const result = await nfe.manifestar.confirmar({
        chaveAcesso: CHAVE_51,
        cnpj: CNPJ
      });

      assert.equal(result.cStat, '135');
    });

    it('deve registrar ciencia da operacao', async () => {
      const response = buildManifestacaoResponse('135', 'Evento registrado');
      const nfe = createNFe(response);
      const result = await nfe.manifestar.ciencia({
        chaveAcesso: CHAVE_51,
        cnpj: CNPJ
      });

      assert.equal(result.cStat, '135');
    });

    it('deve registrar desconhecimento da operacao', async () => {
      const response = buildManifestacaoResponse('135', 'Evento registrado');
      const nfe = createNFe(response);
      const result = await nfe.manifestar.desconhecer({
        chaveAcesso: CHAVE_51,
        cnpj: CNPJ,
        justificativa: 'Nao reconheco esta operacao de compra'
      });

      assert.equal(result.cStat, '135');
    });

    it('deve registrar operacao nao realizada', async () => {
      const response = buildManifestacaoResponse('135', 'Evento registrado');
      const nfe = createNFe(response);
      const result = await nfe.manifestar.naoRealizada({
        chaveAcesso: CHAVE_51,
        cnpj: CNPJ,
        justificativa: 'Operacao cancelada por acordo entre as partes'
      });

      assert.equal(result.cStat, '135');
    });
  });
});
