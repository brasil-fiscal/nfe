import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { DistribuicaoDFeUseCase } from '@nfe/application/use-cases/DistribuicaoDFeUseCase';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import { NFeError } from '@nfe/shared/errors/NFeError';
import type { CertificateProvider, CertificateData } from '@nfe/contracts/CertificateProvider';
import type { SefazTransport } from '@nfe/contracts/SefazTransport';

const fakeCert: CertificateData = {
  pfx: Buffer.from('fake-pfx'),
  password: 'test',
  notAfter: new Date('2030-01-01'),
  privateKey: 'fake-key',
  certPem: 'fake-cert'
};

function makeDocZip(nsu: string, schema: string, xml: string): string {
  const compressed = gzipSync(Buffer.from(xml, 'utf-8'));
  const base64 = compressed.toString('base64');
  return `<docZip NSU="${nsu}" schema="${schema}">${base64}</docZip>`;
}

function buildSoapDistResponse(
  cStat: string,
  xMotivo: string,
  ultNSU: string = '000000000000000',
  maxNSU: string = '000000000000000',
  docs: string = ''
): string {
  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retDistDFeInt xmlns="http://www.portalfiscal.inf.br/nfe">',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    `<ultNSU>${ultNSU}</ultNSU>`,
    `<maxNSU>${maxNSU}</maxNSU>`,
    docs ? `<loteDistDFeInt>${docs}</loteDistDFeInt>` : '',
    '</retDistDFeInt>',
    '</soap12:Body>',
    '</soap12:Envelope>'
  ].join('');
}

function createUseCase(soapResponse: string): DistribuicaoDFeUseCase {
  const certificate: CertificateProvider = {
    load: async () => fakeCert
  };
  const transport: SefazTransport = {
    send: async () => ({ xml: soapResponse, statusCode: 200 })
  };

  return new DistribuicaoDFeUseCase({
    certificate,
    transport,
    environment: 'homologation'
  });
}

describe('DistribuicaoDFeUseCase', () => {
  describe('consultarPorNSU', () => {
    it('deve retornar documentos quando cStat 138', async () => {
      const doc = makeDocZip('000000000000001', 'resNFe_v1.01.xsd', '<resNFe>teste</resNFe>');
      const response = buildSoapDistResponse(
        '138', 'Documento localizado',
        '000000000000001', '000000000000050', doc
      );

      const useCase = createUseCase(response);
      const result = await useCase.consultarPorNSU('12345678000195', 'MT', '0');

      assert.equal(result.cStat, '138');
      assert.equal(result.documentos.length, 1);
      assert.equal(result.documentos[0].xml, '<resNFe>teste</resNFe>');
      assert.equal(result.ultNSU, '000000000000001');
      assert.equal(result.maxNSU, '000000000000050');
    });

    it('deve retornar vazio quando cStat 137 (nenhum documento)', async () => {
      const response = buildSoapDistResponse(
        '137', 'Nenhum documento localizado'
      );

      const useCase = createUseCase(response);
      const result = await useCase.consultarPorNSU('12345678000195', 'MT');

      assert.equal(result.cStat, '137');
      assert.equal(result.documentos.length, 0);
    });

    it('deve lancar SefazRejectError para cStat diferente de 137/138', async () => {
      const response = buildSoapDistResponse(
        '656', 'Consumo indevido'
      );

      const useCase = createUseCase(response);

      await assert.rejects(
        () => useCase.consultarPorNSU('12345678000195', 'MT'),
        (err: unknown) => {
          assert.ok(err instanceof SefazRejectError);
          assert.equal(err.cStat, '656');
          return true;
        }
      );
    });

    it('deve lancar NFeError para CNPJ invalido', async () => {
      const useCase = createUseCase('');

      await assert.rejects(
        () => useCase.consultarPorNSU('123', 'MT'),
        (err: unknown) => {
          assert.ok(err instanceof NFeError);
          assert.ok(err.message.includes('CNPJ invalido'));
          return true;
        }
      );
    });

    it('deve lancar NFeError para UF desconhecida', async () => {
      const useCase = createUseCase('');

      await assert.rejects(
        () => useCase.consultarPorNSU('12345678000195', 'XX'),
        (err: unknown) => {
          assert.ok(err instanceof NFeError);
          assert.ok(err.message.includes('UF desconhecida'));
          return true;
        }
      );
    });

    it('deve usar URL do Ambiente Nacional (nao por UF)', async () => {
      let capturedUrl = '';
      const certificate: CertificateProvider = { load: async () => fakeCert };
      const transport: SefazTransport = {
        send: async (req) => {
          capturedUrl = req.url;
          return {
            xml: buildSoapDistResponse('137', 'Nenhum documento'),
            statusCode: 200
          };
        }
      };

      const useCase = new DistribuicaoDFeUseCase({
        certificate,
        transport,
        environment: 'homologation'
      });

      await useCase.consultarPorNSU('12345678000195', 'MT');
      assert.ok(capturedUrl.includes('hom1.nfe.fazenda.gov.br'));
    });
  });

  describe('consultarPorChave', () => {
    const VALID_CHAVE = '51240412345678000195550010000000011234567890';

    it('deve retornar documento quando cStat 138', async () => {
      const doc = makeDocZip('000000000000001', 'procNFe_v4.00.xsd', '<procNFe>nfe</procNFe>');
      const response = buildSoapDistResponse(
        '138', 'Documento localizado',
        '000000000000001', '000000000000001', doc
      );

      const useCase = createUseCase(response);
      const result = await useCase.consultarPorChave('12345678000195', 'MT', VALID_CHAVE);

      assert.equal(result.cStat, '138');
      assert.equal(result.documentos.length, 1);
      assert.equal(result.documentos[0].schema, 'procNFe_v4.00.xsd');
    });

    it('deve lancar NFeError para chave invalida', async () => {
      const useCase = createUseCase('');

      await assert.rejects(
        () => useCase.consultarPorChave('12345678000195', 'MT', '123'),
        (err: unknown) => {
          assert.ok(err instanceof NFeError);
          assert.ok(err.message.includes('Chave de acesso invalida'));
          return true;
        }
      );
    });
  });
});
