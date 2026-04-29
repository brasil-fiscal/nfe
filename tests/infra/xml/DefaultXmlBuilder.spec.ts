import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import { NFeProps } from '@nfe/domain/entities/NFe';

const sampleNFe: NFeProps = {
  identificacao: {
    naturezaOperacao: 'Venda de producao do estabelecimento',
    tipoOperacao: 1,
    destinoOperacao: 1,
    finalidade: 1,
    consumidorFinal: 1,
    presencaComprador: 1,
    uf: 'MT',
    municipio: '5103403',
    serie: 1,
    numero: 1,
    dataEmissao: new Date('2026-04-28T10:00:00')
  },
  emitente: {
    cnpj: '11222333000181',
    razaoSocial: 'Empresa Teste Ltda',
    nomeFantasia: 'Empresa Teste',
    inscricaoEstadual: '111111111111',
    regimeTributario: 1,
    endereco: {
      logradouro: 'Rua Teste',
      numero: '100',
      bairro: 'Centro',
      codigoMunicipio: '5103403',
      municipio: 'Cuiaba',
      uf: 'MT',
      cep: '78005000'
    }
  },
  destinatario: {
    cpf: '52998224725',
    nome: 'Joao da Silva',
    email: 'joao@email.com',
    indicadorIE: 9,
    endereco: {
      logradouro: 'Av. do CPA',
      numero: '500',
      bairro: 'Centro Politico Administrativo',
      codigoMunicipio: '5103403',
      municipio: 'Cuiaba',
      uf: 'MT',
      cep: '78050970'
    }
  },
  produtos: [
    {
      numero: 1,
      codigo: 'PROD001',
      descricao: 'Camiseta Algodao P',
      ncm: '61091000',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 2,
      valorUnitario: 49.9,
      valorTotal: 99.8,
      icms: {
        origem: 0,
        csosn: '102'
      },
      pis: {
        cst: '49'
      },
      cofins: {
        cst: '49'
      }
    }
  ],
  transporte: {
    modalidadeFrete: 9
  },
  pagamento: {
    pagamentos: [
      {
        formaPagamento: '01',
        valor: 99.8
      }
    ]
  }
};

describe('DefaultXmlBuilder', () => {
  const builder = new DefaultXmlBuilder();

  it('deve gerar XML valido com declaracao e namespace', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('xmlns="http://www.portalfiscal.inf.br/nfe"'));
  });

  it('deve conter tag infNFe com versao 4.00 e Id', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.includes('versao="4.00"'));
    assert.ok(xml.includes('Id="NFe'));
  });

  it('deve conter dados do emitente', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.includes('<CNPJ>11222333000181</CNPJ>'));
    assert.ok(xml.includes('<xNome>Empresa Teste Ltda</xNome>'));
    assert.ok(xml.includes('<UF>MT</UF>'));
    assert.ok(xml.includes('<cMun>5103403</cMun>'));
  });

  it('deve conter dados do destinatario', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.includes('<CPF>52998224725</CPF>'));
    assert.ok(xml.includes('<xNome>Joao da Silva</xNome>'));
  });

  it('deve conter dados do produto', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.includes('<xProd>Camiseta Algodao P</xProd>'));
    assert.ok(xml.includes('<NCM>61091000</NCM>'));
    assert.ok(xml.includes('<CFOP>5102</CFOP>'));
    assert.ok(xml.includes('<vProd>99.80</vProd>'));
  });

  it('deve conter ICMS do Simples Nacional (CSOSN)', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.includes('<CSOSN>102</CSOSN>'));
  });

  it('deve conter PIS e COFINS outras operacoes para CST 49', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.includes('<PISOutr>'));
    assert.ok(xml.includes('<COFINSOutr>'));
  });

  it('deve conter totais calculados', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.includes('<vNF>99.80</vNF>'));
  });

  it('deve conter transporte sem frete', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.includes('<modFrete>9</modFrete>'));
  });

  it('deve conter pagamento em dinheiro', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.includes('<tPag>01</tPag>'));
    assert.ok(xml.includes('<vPag>99.80</vPag>'));
  });

  it('deve conter cUF 51 (MT)', () => {
    const xml = builder.build(sampleNFe);

    assert.ok(xml.includes('<cUF>51</cUF>'));
  });

  it('deve gerar chave de acesso com 44 digitos no Id', () => {
    const xml = builder.build(sampleNFe);

    const match = xml.match(/Id="NFe(\d+)"/);
    assert.ok(match);
    assert.strictEqual(match![1].length, 44);
  });
});
