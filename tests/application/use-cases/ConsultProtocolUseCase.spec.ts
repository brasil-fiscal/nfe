import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConsultProtocolUseCase } from '@nfe/application/use-cases/ConsultProtocolUseCase';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import { NFeError } from '@nfe/shared/errors/NFeError';
import type { CertificateProvider, CertificateData } from '@nfe/contracts/CertificateProvider';
import type { SefazTransport } from '@nfe/contracts/SefazTransport';

function buildSoapConsultaResponse(
  cStat: string,
  xMotivo: string,
  nProt?: string
): string {
  const protNFe = nProt
    ? [
        '<protNFe versao="4.00">',
        '<infProt>',
        `<cStat>${cStat}</cStat>`,
        `<xMotivo>${xMotivo}</xMotivo>`,
        `<nProt>${nProt}</nProt>`,
        '<dhRecbto>2024-04-29T10:00:00-04:00</dhRecbto>',
        '</infProt>',
        '</protNFe>'
      ].join('')
    : '';

  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retConsSitNFe xmlns="http://www.portalfiscal.inf.br/nfe">',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    protNFe,
    '</retConsSitNFe>',
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

// Chave com UF 51 (MT)
const VALID_CHAVE = '51240412345678000195550010000000011234567890';

describe('ConsultProtocolUseCase', () => {
  function createUseCase(soapResponse: string): ConsultProtocolUseCase {
    const certificate: CertificateProvider = {
      load: async () => fakeCert
    };
    const transport: SefazTransport = {
      send: async () => ({ xml: soapResponse, statusCode: 200 })
    };

    return new ConsultProtocolUseCase({
      certificate,
      transport,
      environment: 'homologation'
    });
  }

  it('deve retornar ConsultResult para NFe autorizada (cStat 100)', async () => {
    const response = buildSoapConsultaResponse(
      '100', 'Autorizado o uso da NF-e', '151240000012345'
    );

    const useCase = createUseCase(response);
    const result = await useCase.execute(VALID_CHAVE);

    assert.equal(result.codigoStatus, '100');
    assert.equal(result.protocolo, '151240000012345');
    assert.equal(result.motivo, 'Autorizado o uso da NF-e');
    assert.ok(result.dataAutorizacao instanceof Date);
  });

  it('deve retornar ConsultResult para NFe cancelada (cStat 101)', async () => {
    const response = buildSoapConsultaResponse(
      '101', 'Cancelamento de NF-e homologado', '151240000012346'
    );

    const useCase = createUseCase(response);
    const result = await useCase.execute(VALID_CHAVE);

    assert.equal(result.codigoStatus, '101');
    assert.equal(result.protocolo, '151240000012346');
  });

  it('deve lancar SefazRejectError para cStat diferente de 100/101', async () => {
    const response = buildSoapConsultaResponse(
      '217', 'NF-e nao consta na base de dados da SEFAZ'
    );

    const useCase = createUseCase(response);

    await assert.rejects(
      () => useCase.execute(VALID_CHAVE),
      (err: unknown) => {
        assert.ok(err instanceof SefazRejectError);
        assert.equal(err.cStat, '217');
        return true;
      }
    );
  });

  it('deve lancar NFeError para chave com menos de 44 digitos', async () => {
    const useCase = createUseCase('');

    await assert.rejects(
      () => useCase.execute('123'),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        assert.ok(err.message.includes('44 digitos'));
        return true;
      }
    );
  });

  it('deve lancar NFeError para chave com letras', async () => {
    const useCase = createUseCase('');

    await assert.rejects(
      () => useCase.execute('5124041234567800019555001000000001123456789A'),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        return true;
      }
    );
  });

  it('deve extrair UF corretamente da chave de acesso (51 = MT)', async () => {
    const response = buildSoapConsultaResponse(
      '100', 'Autorizado', '151240000012345'
    );

    let capturedUrl = '';
    const certificate: CertificateProvider = {
      load: async () => fakeCert
    };
    const transport: SefazTransport = {
      send: async (req) => {
        capturedUrl = req.url;
        return { xml: response, statusCode: 200 };
      }
    };

    const useCase = new ConsultProtocolUseCase({
      certificate,
      transport,
      environment: 'homologation'
    });

    await useCase.execute(VALID_CHAVE);
    assert.ok(capturedUrl.includes('sefaz.mt.gov.br'));
  });
});
