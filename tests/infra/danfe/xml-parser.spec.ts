import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseNFeXml } from '@nfe/infra/danfe/xml-parser';
import { SAMPLE_NFE_XML } from './sample-nfe';

describe('xml-parser', () => {
  it('deve extrair chave de acesso', () => {
    const data = parseNFeXml(SAMPLE_NFE_XML);
    assert.equal(data.chaveAcesso, '51240412345678000195550010000000011234567890');
  });

  it('deve extrair dados da identificacao', () => {
    const data = parseNFeXml(SAMPLE_NFE_XML);
    assert.equal(data.naturezaOperacao, 'Venda de mercadoria');
    assert.equal(data.numero, '1');
    assert.equal(data.serie, '1');
    assert.equal(data.tipoOperacao, 'SAIDA');
    assert.ok(data.dataEmissao.includes('29/04/2024'));
  });

  it('deve extrair dados do emitente', () => {
    const data = parseNFeXml(SAMPLE_NFE_XML);
    assert.equal(data.emitente.nome, 'EMPRESA TESTE EMITENTE LTDA');
    assert.equal(data.emitente.cnpj, '12345678000195');
    assert.equal(data.emitente.ie, '131234567');
    assert.equal(data.emitente.uf, 'MT');
  });

  it('deve extrair dados do destinatario', () => {
    const data = parseNFeXml(SAMPLE_NFE_XML);
    assert.equal(data.destinatario.nome, 'CLIENTE TESTE DESTINATARIO ME');
    assert.equal(data.destinatario.cnpjCpf, '98765432000198');
    assert.equal(data.destinatario.ie, '139876543');
  });

  it('deve extrair produtos', () => {
    const data = parseNFeXml(SAMPLE_NFE_XML);
    assert.equal(data.produtos.length, 2);
    assert.equal(data.produtos[0].codigo, '001');
    assert.equal(data.produtos[0].descricao, 'Produto Teste Alpha - Caixa com 12 unidades');
    assert.equal(data.produtos[0].quantidade, '10.0000');
    assert.equal(data.produtos[0].valorTotal, '1500.00');
    assert.equal(data.produtos[1].codigo, '002');
  });

  it('deve extrair totais', () => {
    const data = parseNFeXml(SAMPLE_NFE_XML);
    assert.equal(data.totais.valorProdutos, '2500.00');
    assert.equal(data.totais.valorNfe, '2500.00');
  });

  it('deve extrair transporte', () => {
    const data = parseNFeXml(SAMPLE_NFE_XML);
    assert.ok(data.transporte.modalidade.includes('Sem Ocorrencia'));
  });

  it('deve extrair protocolo', () => {
    const data = parseNFeXml(SAMPLE_NFE_XML);
    assert.equal(data.protocolo, '151240000012345');
    assert.ok(data.dataAutorizacao.includes('29/04/2024'));
  });

  it('deve extrair informacoes complementares', () => {
    const data = parseNFeXml(SAMPLE_NFE_XML);
    assert.ok(data.informacoesComplementares?.includes('homologacao'));
  });

  it('deve lancar erro para XML sem infNFe', () => {
    assert.throws(
      () => parseNFeXml('<xml>sem nfe</xml>'),
      { message: /chave de acesso/ }
    );
  });
});
