import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GerarDanfeUseCase } from '@nfe/application/use-cases/GerarDanfeUseCase';
import { NFeError } from '@nfe/shared/errors/NFeError';
import { SAMPLE_NFE_XML } from './sample-nfe';

describe('GerarDanfeUseCase', () => {
  it('deve gerar PDF como Buffer nao-vazio', async () => {
    const useCase = new GerarDanfeUseCase();
    const pdf = await useCase.execute(SAMPLE_NFE_XML);

    assert.ok(Buffer.isBuffer(pdf));
    assert.ok(pdf.length > 0);
  });

  it('deve gerar PDF que comeca com %PDF', async () => {
    const useCase = new GerarDanfeUseCase();
    const pdf = await useCase.execute(SAMPLE_NFE_XML);

    const header = pdf.subarray(0, 5).toString('ascii');
    assert.equal(header, '%PDF-');
  });

  it('deve lancar NFeError para XML invalido', async () => {
    const useCase = new GerarDanfeUseCase();

    await assert.rejects(
      () => useCase.execute('<xml>sem nfe</xml>'),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        return true;
      }
    );
  });

  it('deve lancar NFeError para XML vazio', async () => {
    const useCase = new GerarDanfeUseCase();

    await assert.rejects(
      () => useCase.execute(''),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        return true;
      }
    );
  });
});
