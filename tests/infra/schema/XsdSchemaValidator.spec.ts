import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolve } from 'node:path';
import { XsdSchemaValidator } from '@nfe/infra/schema/XsdSchemaValidator';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import { DefaultXmlSigner } from '@nfe/infra/xml/DefaultXmlSigner';
import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { NFeProps } from '@nfe/domain/entities/NFe';
import { generateTestCertificate } from '../../helpers/generate-test-certificate';

const schemasDir = resolve(__dirname, '..', '..', '..', 'schemas');

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
    nome: 'Raphael Serafim',
    email: 'raphaelvserafim@email.com',
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

describe('XsdSchemaValidator', () => {
  const validator = new XsdSchemaValidator(schemasDir);
  const builder = new DefaultXmlBuilder();

  it('deve validar XML assinado gerado pelo builder sem erros', async () => {
    const { pfx, password } = generateTestCertificate();
    const certProvider = new A1CertificateProvider(pfx, password);
    const certData = await certProvider.load();
    const signer = new DefaultXmlSigner();

    const xml = builder.build(sampleNFe);
    const signedXml = signer.sign(xml, certData);
    const result = validator.validate(signedXml);

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('deve retornar erros para XML com campo obrigatorio faltando', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">' +
      '<infNFe versao="4.00" Id="NFe35240112345678901234550010000000011234567890">' +
      '</infNFe>' +
      '</NFe>';

    const result = validator.validate(xml);

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.some((e) => e.field === 'infNFe'));
  });

  it('deve retornar erros para XML malformado', () => {
    assert.throws(() => {
      validator.validate('<NFe><unclosed');
    });
  });

  it('deve retornar erros para XML com valor invalido em campo enum', async () => {
    const { pfx, password } = generateTestCertificate();
    const certProvider = new A1CertificateProvider(pfx, password);
    const certData = await certProvider.load();
    const signer = new DefaultXmlSigner();

    const xml = builder.build(sampleNFe);
    const signedXml = signer.sign(xml, certData);
    const invalidXml = signedXml.replace('<tpNF>1</tpNF>', '<tpNF>9</tpNF>');

    const result = validator.validate(invalidXml);

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('deve retornar erros descritivos com nome do campo', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">' +
      '<infNFe versao="4.00" Id="NFe35240112345678901234550010000000011234567890">' +
      '</infNFe>' +
      '</NFe>';

    const result = validator.validate(xml);

    for (const error of result.errors) {
      assert.ok(error.field.length > 0, 'field deve ter nome');
      assert.ok(error.message.length > 0, 'message deve ter conteudo');
    }
  });
});
