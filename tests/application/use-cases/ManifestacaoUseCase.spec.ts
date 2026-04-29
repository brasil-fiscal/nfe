import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ManifestacaoUseCase } from '@nfe/application/use-cases/ManifestacaoUseCase';
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

function buildSoapResponse(cStat: string, xMotivo: string, tpEvento?: string): string {
  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retEnvEvento><retEvento versao="1.00"><infEvento>',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    tpEvento ? `<tpEvento>${tpEvento}</tpEvento>` : '',
    '</infEvento></retEvento></retEnvEvento>',
    '</soap12:Body>',
    '</soap12:Envelope>'
  ].join('');
}

function createUseCase(soapResponse: string): ManifestacaoUseCase {
  return new ManifestacaoUseCase({
    certificate: { load: async () => fakeCert },
    transport: { send: async () => ({ xml: soapResponse, statusCode: 200 }) },
    xmlSigner: { sign: (xml: string) => xml },
    environment: 'homologation'
  });
}

const baseInput = { chaveAcesso: CHAVE, cnpj: '12345678000195' };

describe('ManifestacaoUseCase', () => {
  describe('confirmar', () => {
    it('deve retornar ManifestacaoResult quando cStat 135', async () => {
      const useCase = createUseCase(buildSoapResponse('135', 'Evento registrado', '210200'));
      const result = await useCase.confirmar(baseInput);

      assert.equal(result.cStat, '135');
      assert.equal(result.tpEvento, '210200');
    });

    it('nao deve exigir justificativa', async () => {
      const useCase = createUseCase(buildSoapResponse('135', 'OK'));
      const result = await useCase.confirmar(baseInput);
      assert.equal(result.cStat, '135');
    });
  });

  describe('ciencia', () => {
    it('deve retornar ManifestacaoResult quando cStat 135', async () => {
      const useCase = createUseCase(buildSoapResponse('135', 'Evento registrado', '210210'));
      const result = await useCase.ciencia(baseInput);

      assert.equal(result.cStat, '135');
    });
  });

  describe('desconhecer', () => {
    it('deve retornar ManifestacaoResult com justificativa', async () => {
      const useCase = createUseCase(buildSoapResponse('135', 'Evento registrado', '210220'));
      const result = await useCase.desconhecer({
        ...baseInput,
        justificativa: 'Nao reconheco esta operacao comercial'
      });

      assert.equal(result.cStat, '135');
    });

    it('deve lancar NFeError sem justificativa', async () => {
      const useCase = createUseCase('');

      await assert.rejects(
        () => useCase.desconhecer(baseInput),
        (err: unknown) => {
          assert.ok(err instanceof NFeError);
          assert.ok(err.message.includes('15 caracteres'));
          return true;
        }
      );
    });

    it('deve lancar NFeError com justificativa curta', async () => {
      const useCase = createUseCase('');

      await assert.rejects(
        () => useCase.desconhecer({ ...baseInput, justificativa: 'curta' }),
        (err: unknown) => {
          assert.ok(err instanceof NFeError);
          return true;
        }
      );
    });
  });

  describe('naoRealizada', () => {
    it('deve retornar ManifestacaoResult com justificativa', async () => {
      const useCase = createUseCase(buildSoapResponse('135', 'Evento registrado', '210240'));
      const result = await useCase.naoRealizada({
        ...baseInput,
        justificativa: 'Mercadoria devolvida ao remetente original'
      });

      assert.equal(result.cStat, '135');
    });

    it('deve lancar NFeError sem justificativa', async () => {
      const useCase = createUseCase('');

      await assert.rejects(
        () => useCase.naoRealizada(baseInput),
        (err: unknown) => {
          assert.ok(err instanceof NFeError);
          return true;
        }
      );
    });
  });

  describe('erros comuns', () => {
    it('deve lancar SefazRejectError para cStat diferente de 135/136', async () => {
      const useCase = createUseCase(buildSoapResponse('573', 'Duplicidade de evento'));

      await assert.rejects(
        () => useCase.confirmar(baseInput),
        (err: unknown) => {
          assert.ok(err instanceof SefazRejectError);
          assert.equal(err.cStat, '573');
          return true;
        }
      );
    });

    it('deve lancar NFeError para chave invalida', async () => {
      const useCase = createUseCase('');

      await assert.rejects(
        () => useCase.confirmar({ ...baseInput, chaveAcesso: '123' }),
        (err: unknown) => {
          assert.ok(err instanceof NFeError);
          return true;
        }
      );
    });

    it('deve usar URL do Ambiente Nacional', async () => {
      let capturedUrl = '';
      const useCase = new ManifestacaoUseCase({
        certificate: { load: async (): Promise<CertificateData> => fakeCert },
        transport: {
          send: async (req): Promise<{ xml: string; statusCode: number }> => {
            capturedUrl = req.url;
            return { xml: buildSoapResponse('135', 'OK'), statusCode: 200 };
          }
        },
        xmlSigner: { sign: (xml: string): string => xml },
        environment: 'homologation'
      });

      await useCase.confirmar(baseInput);
      assert.ok(capturedUrl.includes('hom1.nfe.fazenda.gov.br'));
    });
  });
});
