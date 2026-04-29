import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import { DefaultXmlSigner } from '@nfe/infra/xml/DefaultXmlSigner';
import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { XsdSchemaValidator } from '@nfe/infra/schema/XsdSchemaValidator';
import type { NFeProps } from '@nfe/domain/entities/NFe';
import { loadE2EConfig, loadPfxBuffer } from './env-loader';

const config = loadE2EConfig();
if (!config) {
  console.log('Configuracao .env nao encontrada ou incompleta');
  process.exit(1);
}

const nfeData: NFeProps = {
  identificacao: {
    naturezaOperacao: 'VENDA DE MERCADORIA',
    tipoOperacao: 1,
    destinoOperacao: 1,
    finalidade: 1,
    consumidorFinal: 0,
    presencaComprador: 1,
    uf: config.uf,
    municipio: config.codMunicipio,
    serie: 1,
    numero: 999999,
    dataEmissao: new Date()
  },
  emitente: {
    cnpj: config.cnpj,
    razaoSocial: config.razaoSocial,
    inscricaoEstadual: config.ie,
    regimeTributario: 1,
    endereco: {
      logradouro: config.logradouro,
      numero: config.numero,
      bairro: config.bairro,
      codigoMunicipio: config.codMunicipio,
      municipio: config.municipio,
      uf: config.uf,
      cep: config.cep
    }
  },
  destinatario: {
    nome: 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
    cnpj: config.cnpj,
    indicadorIE: config.ie === 'ISENTO' ? 9 : 1,
    inscricaoEstadual: config.ie === 'ISENTO' ? undefined : config.ie,
    endereco: {
      logradouro: config.logradouro,
      numero: config.numero,
      bairro: config.bairro,
      codigoMunicipio: config.codMunicipio,
      municipio: config.municipio,
      uf: config.uf,
      cep: config.cep
    }
  },
  produtos: [
    {
      numero: 1,
      codigo: 'MOV-001',
      descricao: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
      ncm: '94036000',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 4,
      valorUnitario: 320.00,
      valorTotal: 1280.00,
      valorFrete: 75.00,
      valorSeguro: 12.50,
      icms: { origem: 0, csosn: '102' },
      pis: { cst: '49' },
      cofins: { cst: '49' }
    },
    {
      numero: 2,
      codigo: 'MOV-002',
      descricao: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
      ncm: '94035000',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 2,
      valorUnitario: 450.00,
      valorTotal: 900.00,
      valorFrete: 50.00,
      valorSeguro: 8.50,
      icms: { origem: 0, csosn: '102' },
      pis: { cst: '49' },
      cofins: { cst: '49' }
    },
    {
      numero: 3,
      codigo: 'MOV-003',
      descricao: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
      ncm: '94017900',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 1,
      valorUnitario: 189.90,
      valorTotal: 189.90,
      valorDesconto: 9.90,
      valorFrete: 15.00,
      valorSeguro: 2.50,
      icms: { origem: 0, csosn: '102' },
      pis: { cst: '49' },
      cofins: { cst: '49' }
    },
    {
      numero: 4,
      codigo: 'ELE-001',
      descricao: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
      ncm: '84714900',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 3,
      valorUnitario: 85.50,
      valorTotal: 256.50,
      valorFrete: 10.00,
      valorSeguro: 1.50,
      icms: { origem: 0, csosn: '102' },
      pis: { cst: '49' },
      cofins: { cst: '49' }
    }
  ],
  transporte: {
    modalidadeFrete: 0,
    cnpjTransportadora: config.cnpj,
    nomeTransportadora: 'TRANSPORTES TESTE LTDA',
    endereco: 'AV PRINCIPAL 500',
    municipio: config.municipio,
    uf: config.uf,
    volumes: [
      {
        quantidade: 3,
        especie: 'CAIXA',
        pesoBruto: 85.500,
        pesoLiquido: 72.300
      }
    ]
  },
  pagamento: {
    pagamentos: [
      { formaPagamento: '01', valor: 1500.00 },
      { formaPagamento: '03', valor: 1291.50 }
    ]
  },
  informacoesComplementares: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL.'
};

async function run(): Promise<void> {
  console.log('Gerando XML...');
  const builder = new DefaultXmlBuilder();
  const xml = builder.build(nfeData);

  console.log('Assinando XML...');
  const pfx = loadPfxBuffer(config.pfxPath);
  const certProvider = new A1CertificateProvider(pfx, config.pfxSenha);
  const cert = await certProvider.load();
  const signer = new DefaultXmlSigner();
  const signedXml = signer.sign(xml, cert);

  console.log('Validando contra XSD...\n');
  const validator = new XsdSchemaValidator();
  const result = validator.validate(signedXml);

  if (result.valid) {
    console.log('XML VALIDO - Nenhum erro encontrado no schema XSD');
  } else {
    console.log(`XML INVALIDO - ${result.errors.length} erro(s):\n`);
    for (const err of result.errors) {
      console.log(`  [${err.field}] ${err.message}`);
    }
    process.exit(1);
  }
}

run().catch(console.error);
