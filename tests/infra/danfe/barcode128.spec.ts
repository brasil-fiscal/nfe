import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encodeCode128C, getBarcodeWidth } from '@nfe/infra/danfe/barcode128';

describe('barcode128', () => {
  it('deve codificar chave de acesso de 44 digitos', () => {
    const bars = encodeCode128C('51240412345678000195550010000000011234567890');
    assert.ok(bars.length > 0);
  });

  it('deve retornar barras com posicao x crescente', () => {
    const bars = encodeCode128C('1234567890123456789012345678901234567890abcd'.replace(/[a-d]/g, '0').substring(0, 44));
    for (let i = 1; i < bars.length; i++) {
      assert.ok(bars[i].x >= bars[i - 1].x);
    }
  });

  it('deve ter largura total positiva', () => {
    const bars = encodeCode128C('51240412345678000195550010000000011234567890');
    const width = getBarcodeWidth(bars);
    assert.ok(width > 0);
  });

  it('deve lancar erro para numero impar de digitos', () => {
    assert.throws(
      () => encodeCode128C('123'),
      { message: /par de digitos/ }
    );
  });

  it('deve codificar string curta (2 digitos)', () => {
    const bars = encodeCode128C('42');
    assert.ok(bars.length > 0);
  });

  it('deve ter barras alternando entre bar e espaco', () => {
    const bars = encodeCode128C('1234');
    // Dentro de cada simbolo, os elementos alternam bar/espaco
    // O primeiro elemento de cada simbolo eh sempre barra
    assert.equal(bars[0].isBar, true);
    assert.equal(bars[1].isBar, false);
  });
});
