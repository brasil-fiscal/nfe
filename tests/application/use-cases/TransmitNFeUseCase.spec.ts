import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TransmitNFeUseCase } from '@nfe/application/use-cases/TransmitNFeUseCase';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import type { XmlBuilder } from '@nfe/contracts/XmlBuilder';
import type { XmlSigner } from '@nfe/contracts/XmlSigner';
import type { CertificateProvider, CertificateData } from '@nfe/contracts/CertificateProvider';
import type { SefazTransport } from '@nfe/contracts/SefazTransport';
import type { NFeProps } from '@nfe/domain/entities/NFe';

function buildSoapAutorizacaoResponse(
  cStatLote: string,
  cStat: string,
  xMotivo: string,
  nProt?: string,
  chNFe?: string
): string {
  const protNFe = cStatLote === '104'
    ? [
        '<protNFe versao="4.00">',
        '<infProt>',
        `<cStat>${cStat}</cStat>`,
        `<xMotivo>${xMotivo}</xMotivo>`,
        nProt ? `<nProt>${nProt}</nProt>` : '',
        '<dhRecbto>2024-04-29T10:00:00-04:00</dhRecbto>',
        chNFe ? `<chNFe>${chNFe}</chNFe>` : '',
        '</infProt>',
        '</protNFe>'
      ].join('')
    : '';

  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe">',
    `<cStat>${cStatLote}</cStat>`,
    `<xMotivo>${cStatLote === '104' ? 'Lote processado' : xMotivo}</xMotivo>`,
    protNFe,
    '</retEnviNFe>',
    '</soap12:Body>',
    '</soap12:Envelope>'
  ].join('');
}

const fakeCert: CertificateData = {
  pfx: Buffer.from('fake-pfx'),
  password: 'test',
  notAfter: new Date('2030-01-01'),
  privateKey: 'fake-key',
  certPem: 'fake-cert'
};

const fakeNFe = {} as NFeProps;

function createMocks(soapResponse: string): {
  xmlBuilder: XmlBuilder;
  xmlSigner: XmlSigner;
  certificate: CertificateProvider;
  transport: SefazTransport;
} {
  return {
    xmlBuilder: { build: () => '<NFe>xml</NFe>' },
    xmlSigner: { sign: () => '<NFe>signed</NFe>' },
    certificate: { load: async () => fakeCert },
    transport: {
      send: async () => ({ xml: soapResponse, statusCode: 200 })
    }
  };
}

describe('TransmitNFeUseCase', () => {
  it('deve retornar TransmitResult autorizada quando cStat 100', async () => {
    const response = buildSoapAutorizacaoResponse(
      '104', '100', 'Autorizado o uso da NF-e',
      '151240000012345',
      '51240412345678000195550010000000011234567890'
    );

    const mocks = createMocks(response);
    const useCase = new TransmitNFeUseCase({
      ...mocks,
      environment: 'homologation',
      uf: 'MT'
    });

    const result = await useCase.execute(fakeNFe);

    assert.equal(result.autorizada, true);
    assert.equal(result.protocolo, '151240000012345');
    assert.equal(result.chaveAcesso, '51240412345678000195550010000000011234567890');
    assert.equal(result.codigoStatus, '100');
    assert.ok(result.dataAutorizacao instanceof Date);
  });

  it('deve lancar SefazRejectError quando cStat do lote != 104', async () => {
    const response = buildSoapAutorizacaoResponse(
      '215', '215', 'Rejeicao: Chave de Acesso invalida'
    );

    const mocks = createMocks(response);
    const useCase = new TransmitNFeUseCase({
      ...mocks,
      environment: 'homologation',
      uf: 'MT'
    });

    await assert.rejects(
      () => useCase.execute(fakeNFe),
      (err: unknown) => {
        assert.ok(err instanceof SefazRejectError);
        assert.equal(err.cStat, '215');
        return true;
      }
    );
  });

  it('deve lancar SefazRejectError quando protNFe tem cStat != 100', async () => {
    const response = buildSoapAutorizacaoResponse(
      '104', '539', 'Rejeicao: Duplicidade de NF-e'
    );

    const mocks = createMocks(response);
    const useCase = new TransmitNFeUseCase({
      ...mocks,
      environment: 'homologation',
      uf: 'MT'
    });

    await assert.rejects(
      () => useCase.execute(fakeNFe),
      (err: unknown) => {
        assert.ok(err instanceof SefazRejectError);
        assert.equal(err.cStat, '539');
        assert.equal(err.uf, 'MT');
        return true;
      }
    );
  });

  it('deve propagar erro do transport', async () => {
    const mocks = createMocks('');
    mocks.transport = {
      send: async (): Promise<never> => { throw new Error('Connection refused'); }
    };

    const useCase = new TransmitNFeUseCase({
      ...mocks,
      environment: 'homologation',
      uf: 'MT'
    });

    await assert.rejects(
      () => useCase.execute(fakeNFe),
      { message: /Connection refused/ }
    );
  });
});
