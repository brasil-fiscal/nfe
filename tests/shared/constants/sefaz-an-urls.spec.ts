import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAnUrl } from '@nfe/shared/constants/sefaz-an-urls';

describe('sefaz-an-urls', () => {
  describe('getAnUrl', () => {
    it('deve retornar URL de homologacao para NFeDistribuicaoDFe', () => {
      const url = getAnUrl('homologacao', 'NFeDistribuicaoDFe');
      assert.equal(
        url,
        'https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx'
      );
    });

    it('deve retornar URL de producao para NFeDistribuicaoDFe', () => {
      const url = getAnUrl('producao', 'NFeDistribuicaoDFe');
      assert.equal(
        url,
        'https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx'
      );
    });
  });
});
