import { describe, it } from 'node:test';
import assert from 'node:assert';
import { produtoSchema } from '@nfe/domain/schemas/produto-schema';

const base = {
  numero: 1, codigo: 'P1', descricao: 'Item', ncm: '61091000', cfop: '5102',
  unidade: 'UN', quantidade: 1, valorUnitario: 10, valorTotal: 10,
  icms: { origem: 0, cst: '00', aliquota: 18, baseCalculo: 10, valor: 1.8 },
  pis: { cst: '01' }, cofins: { cst: '01' },
};

describe('produtoSchema IBS/CBS', () => {
  it('aceita produto sem ibsCbs (retrocompat)', () => {
    assert.doesNotThrow(() => produtoSchema.parse(base));
  });
  it('aceita produto com ibsCbs válido', () => {
    const withIbs = { ...base, ibsCbs: { cst: '000', cClassTrib: '000001', pIBSUF: 0.01, pIBSMun: 0, pCBS: 0.9 } };
    const parsed = produtoSchema.parse(withIbs);
    assert.strictEqual(parsed.ibsCbs.cst, '000');
    assert.strictEqual(parsed.ibsCbs.pCBS, 0.9);
  });
});
