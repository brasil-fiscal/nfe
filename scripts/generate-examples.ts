import { writeFileSync } from 'node:fs';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import { GerarDanfeUseCase } from '@nfe/application/use-cases/GerarDanfeUseCase';
import { NFeProps } from '@nfe/domain/entities/NFe';
import { SAMPLE_NFE_XML } from '../tests/infra/danfe/sample-nfe';

const sampleNFe: NFeProps = {
  identificacao: {
    naturezaOperacao: 'Venda de mercadoria',
    tipoOperacao: 1,
    destinoOperacao: 1,
    finalidade: 1,
    consumidorFinal: 1,
    presencaComprador: 1,
    uf: 'MT',
    municipio: '5103403',
    serie: 1,
    numero: 1,
    dataEmissao: new Date('2024-04-29T10:00:00-04:00')
  },
  emitente: {
    cnpj: '12345678000195',
    razaoSocial: 'EMPRESA TESTE EMITENTE LTDA',
    nomeFantasia: 'TESTE EMITENTE',
    inscricaoEstadual: '131234567',
    regimeTributario: 1,
    endereco: {
      logradouro: 'Rua das Flores',
      numero: '100',
      bairro: 'Centro',
      codigoMunicipio: '5103403',
      municipio: 'Cuiaba',
      uf: 'MT',
      cep: '78005000'
    }
  },
  destinatario: {
    cnpj: '98765432000198',
    nome: 'CLIENTE TESTE DESTINATARIO ME',
    indicadorIE: 1,
    inscricaoEstadual: '139876543',
    endereco: {
      logradouro: 'Av Brasil',
      numero: '500',
      bairro: 'Jardim Tropical',
      codigoMunicipio: '5103403',
      municipio: 'Cuiaba',
      uf: 'MT',
      cep: '78010100'
    }
  },
  produtos: [
    {
      numero: 1,
      codigo: '001',
      descricao: 'Produto Teste Alpha - Caixa com 12 unidades',
      ncm: '84714900',
      cfop: '5102',
      unidade: 'CX',
      quantidade: 10,
      valorUnitario: 150.00,
      valorTotal: 1500.00,
      icms: { origem: 0, csosn: '102' },
      pis: { cst: '49' },
      cofins: { cst: '49' }
    },
    {
      numero: 2,
      codigo: '002',
      descricao: 'Produto Teste Beta - Unidade avulsa',
      ncm: '84714900',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 5,
      valorUnitario: 200.00,
      valorTotal: 1000.00,
      icms: { origem: 0, csosn: '102' },
      pis: { cst: '49' },
      cofins: { cst: '49' }
    }
  ],
  transporte: {
    modalidadeFrete: 9
  },
  pagamento: {
    pagamentos: [
      { formaPagamento: '01', valor: 2500.00 }
    ]
  },
  informacoesComplementares: 'Venda realizada em ambiente de homologacao - Sem valor fiscal. Documento emitido por @brasil-fiscal/nfe.'
};

async function main(): Promise<void> {
  const builder = new DefaultXmlBuilder();
  const xml = builder.build(sampleNFe);

  writeFileSync('examples/nfe-exemplo.xml', xml);
  console.log(`XML gerado: examples/nfe-exemplo.xml (${xml.length} bytes)`);

  const danfeUseCase = new GerarDanfeUseCase();
  const pdf = await danfeUseCase.execute(SAMPLE_NFE_XML);

  writeFileSync('examples/danfe-exemplo.pdf', pdf);
  console.log(`DANFE gerado: examples/danfe-exemplo.pdf (${pdf.length} bytes)`);
}

main().catch(console.error);
