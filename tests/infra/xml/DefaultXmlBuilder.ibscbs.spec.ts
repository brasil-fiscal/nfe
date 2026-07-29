import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import { NFeProps } from '@nfe/domain/entities/NFe';

// valorTotal do primeiro produto = 99.8
// vBC = 99.80
// vIBSUF = 0.01 / 100 * 99.8 = 0.00998 → 0.01 (formatNumber 2 dec)
// vIBSMun = 0 / 100 * 99.8 = 0.00 (formatNumber 2 dec)
// vCBS = 0.9 / 100 * 99.8 = 0.8982 → 0.90 (formatNumber 2 dec)

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
      },
      ibsCbs: {
        cst: '000',
        cClassTrib: '000001',
        pIBSUF: 0.01,
        pIBSMun: 0,
        pCBS: 0.9
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

describe('DefaultXmlBuilder — IBSCBS', () => {
  it('deve emitir grupo IBSCBS com CST e cClassTrib', () => {
    const xml = new DefaultXmlBuilder().build(sampleNFe);
    assert.match(xml, /<IBSCBS><CST>000<\/CST><cClassTrib>000001<\/cClassTrib>/);
  });

  it('deve emitir gIBSUF com aliquota formatada em 4 decimais e valor em 2 decimais', () => {
    const xml = new DefaultXmlBuilder().build(sampleNFe);
    assert.match(xml, /<gIBSUF><pIBSUF>0\.0100<\/pIBSUF><vIBSUF>0\.01<\/vIBSUF><\/gIBSUF>/);
  });

  it('deve emitir gCBS com aliquota formatada em 4 decimais e valor em 2 decimais', () => {
    const xml = new DefaultXmlBuilder().build(sampleNFe);
    assert.match(xml, /<gCBS><pCBS>0\.9000<\/pCBS><vCBS>0\.90<\/vCBS><\/gCBS>/);
  });

  it('deve emitir gIBSCBS com vBC correto', () => {
    const xml = new DefaultXmlBuilder().build(sampleNFe);
    assert.match(xml, /<gIBSCBS><vBC>99\.80<\/vBC>/);
  });

  it('deve emitir IBSCBS apos COFINS dentro de imposto', () => {
    const xml = new DefaultXmlBuilder().build(sampleNFe);
    const cofinsPos = xml.indexOf('</COFINS>');
    const ibscbsPos = xml.indexOf('<IBSCBS>');
    assert.ok(ibscbsPos > cofinsPos, 'IBSCBS deve aparecer após COFINS dentro de <imposto>');
  });

  it('emite o total IBSCBSTot somando os itens', () => {
    const xml = new DefaultXmlBuilder().build(sampleNFe);
    // vBCIBSCBS = 99.80 (valorTotal do único produto com ibsCbs)
    assert.match(xml, /<IBSCBSTot><vBCIBSCBS>99\.80<\/vBCIBSCBS>/);
    // vIBS = vIBSUF + vIBSMun = 0.01 + 0.00 = 0.01
    assert.match(xml, /<vIBS>0\.01<\/vIBS>/);
    // gCBS: vDif=0.00, vDevTrib=0.00, vCBS=0.90
    assert.match(xml, /<gCBS><vDif>0\.00<\/vDif><vDevTrib>0\.00<\/vDevTrib><vCBS>0\.90<\/vCBS><\/gCBS>/);
  });

  it('produto sem ibsCbs nao deve emitir grupo IBSCBS', () => {
    const nfeSemIbs: NFeProps = {
      ...sampleNFe,
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
          icms: { origem: 0, csosn: '102' },
          pis: { cst: '49' },
          cofins: { cst: '49' }
        }
      ]
    };
    const xml = new DefaultXmlBuilder().build(nfeSemIbs);
    assert.ok(!xml.includes('<IBSCBS>'), 'Não deve conter <IBSCBS> quando ibsCbs não está definido');
  });
});
