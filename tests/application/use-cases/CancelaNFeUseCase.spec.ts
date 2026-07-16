import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CancelaNFeUseCase } from '@nfe/application/use-cases/CancelaNFeUseCase';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import { NFeError } from '@nfe/shared/errors/NFeError';
import type { CertificateData } from '@nfe/contracts/CertificateProvider';

const fakeCert: CertificateData = {
  pfx: Buffer.from('fake-pfx'),
  password: 'test',
  notAfter: new Date('2030-01-01'),
  privateKey: 'fake-key',
  certPem: 'fake-cert'
};

const CHAVE = '51240412345678000195550010000000011234567890';

function buildSoapEventoResponse(cStat: string, xMotivo: string, nProt?: string): string {
  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retEnvEvento><retEvento versao="1.00"><infEvento>',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    nProt ? `<nProt>${nProt}</nProt>` : '',
    '<tpEvento>110111</tpEvento>',
    '</infEvento></retEvento></retEnvEvento>',
    '</soap12:Body>',
    '</soap12:Envelope>'
  ].join('');
}

function createUseCase(soapResponse: string): CancelaNFeUseCase {
  return new CancelaNFeUseCase({
    certificate: { load: async () => fakeCert },
    transport: { send: async () => ({ xml: soapResponse, statusCode: 200 }) },
    xmlSigner: { sign: (xml: string) => xml },
    environment: 'homologation'
  });
}

describe('CancelaNFeUseCase', () => {
  it('deve retornar EventoResult quando cStat 135', async () => {
    const response = buildSoapEventoResponse('135', 'Evento registrado', '151240000012345');
    const useCase = createUseCase(response);

    const result = await useCase.execute({
      chaveAcesso: CHAVE,
      cnpj: '12345678000195',
      protocolo: '151240000012345',
      justificativa: 'Erro na emissao da nota fiscal eletronica'
    });

    assert.equal(result.cStat, '135');
    assert.equal(result.nProt, '151240000012345');
  });

  it('deve lancar SefazRejectError quando cStat diferente de 135/136', async () => {
    const response = buildSoapEventoResponse('573', 'Duplicidade de evento');
    const useCase = createUseCase(response);

    await assert.rejects(
      () => useCase.execute({
        chaveAcesso: CHAVE,
        cnpj: '12345678000195',
        protocolo: '151240000012345',
        justificativa: 'Erro na emissao da nota fiscal eletronica'
      }),
      (err: unknown) => {
        assert.ok(err instanceof SefazRejectError);
        assert.equal(err.cStat, '573');
        return true;
      }
    );
  });

  it('deve lancar NFeError para justificativa curta', async () => {
    const useCase = createUseCase('');

    await assert.rejects(
      () => useCase.execute({
        chaveAcesso: CHAVE,
        cnpj: '12345678000195',
        protocolo: '151240000012345',
        justificativa: 'curta'
      }),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        assert.ok(err.message.includes('15 caracteres'));
        return true;
      }
    );
  });

  it('deve enviar cancelamento de NFC-e (mod65) para o endpoint de NFC-e', async () => {
    // Chave MT (51) modelo 65 -> deve bater no host nfce.sefaz.mt, nao no de NF-e.
    const chaveNFCe = '51240412345678000195650010000000011234567890';
    let capturedUrl = '';
    const useCase = new CancelaNFeUseCase({
      certificate: { load: async () => fakeCert },
      transport: {
        send: async (req) => {
          capturedUrl = req.url;
          return { xml: buildSoapEventoResponse('135', 'Evento registrado', '151240000012345'), statusCode: 200 };
        }
      },
      xmlSigner: { sign: (xml: string) => xml },
      environment: 'homologation'
    });

    await useCase.execute({
      chaveAcesso: chaveNFCe,
      cnpj: '12345678000195',
      protocolo: '151240000012345',
      justificativa: 'Erro na emissao da nota fiscal eletronica'
    });

    assert.ok(capturedUrl.includes('nfcews'), `esperava endpoint NFC-e, veio: ${capturedUrl}`);
  });

  it('deve enviar cancelamento de NF-e (mod55) para o endpoint de NF-e', async () => {
    let capturedUrl = '';
    const useCase = new CancelaNFeUseCase({
      certificate: { load: async () => fakeCert },
      transport: {
        send: async (req) => {
          capturedUrl = req.url;
          return { xml: buildSoapEventoResponse('135', 'Evento registrado', '151240000012345'), statusCode: 200 };
        }
      },
      xmlSigner: { sign: (xml: string) => xml },
      environment: 'homologation'
    });

    await useCase.execute({
      chaveAcesso: CHAVE,
      cnpj: '12345678000195',
      protocolo: '151240000012345',
      justificativa: 'Erro na emissao da nota fiscal eletronica'
    });

    assert.ok(capturedUrl.includes('/nfews/'), `esperava endpoint NF-e, veio: ${capturedUrl}`);
  });

  it('deve lancar NFeError para chave invalida', async () => {
    const useCase = createUseCase('');

    await assert.rejects(
      () => useCase.execute({
        chaveAcesso: '123',
        cnpj: '12345678000195',
        protocolo: '151240000012345',
        justificativa: 'Justificativa valida com mais de 15 chars'
      }),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        return true;
      }
    );
  });
});
