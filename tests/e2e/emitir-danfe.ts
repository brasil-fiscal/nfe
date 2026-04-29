import { writeFileSync } from 'node:fs';
import { NFeCore } from '@nfe/core/NFeCore';
import type { NFeProps } from '@nfe/domain/entities/NFe';
import { loadE2EConfig, loadPfxBuffer } from './env-loader';

async function main(): Promise<void> {
  const config = loadE2EConfig();
  if (!config) {
    console.log('Configuracao .env nao encontrada ou incompleta');
    return;
  }

  const pfx = loadPfxBuffer(config.pfxPath);
  const nfeCore = NFeCore.create({
    pfx,
    senha: config.pfxSenha,
    ambiente: 'homologacao',
    uf: config.uf
  });

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
      numero: Math.floor(Math.random() * 999999) + 1,
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
      veiculo: {
        placa: 'ABC1D23',
        uf: config.uf,
        rntc: '12345678'
      },
      volumes: [
        {
          quantidade: 3,
          especie: 'CAIXA',
          marca: 'TESTE',
          pesoBruto: 85.500,
          pesoLiquido: 72.300
        }
      ]
    },
    cobranca: {
      fatura: {
        nFat: '001',
        vOrig: 2791.50,
        vDesc: 0,
        vLiq: 2791.50
      },
      duplicatas: [
        { nDup: '001', dVenc: '2026-05-29', vDup: 1395.75 },
        { nDup: '002', dVenc: '2026-06-29', vDup: 1395.75 }
      ]
    },
    pagamento: {
      pagamentos: [
        { formaPagamento: '05', valor: 1395.75 },
        { formaPagamento: '05', valor: 1395.75 }
      ]
    },
    informacoesComplementares: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL. Teste completo com frete, seguro, desconto e multiplos produtos.'
  };

  console.log('Transmitindo NFe completa para SEFAZ MT homologacao...');
  console.log(`  Produtos: ${nfeData.produtos.length}`);
  const totalFrete = nfeData.produtos.reduce((s, p) => s + (p.valorFrete || 0), 0);
  const totalSeguro = nfeData.produtos.reduce((s, p) => s + (p.valorSeguro || 0), 0);
  console.log(`  Frete: R$ ${totalFrete.toFixed(2)}`);
  console.log(`  Seguro: R$ ${totalSeguro.toFixed(2)}`);

  const result = await nfeCore.transmitir(nfeData);

  console.log(`\nStatus: ${result.codigoStatus} - ${result.motivo}`);
  console.log(`Protocolo: ${result.protocolo}`);
  console.log(`Chave: ${result.chaveAcesso}`);

  if (!result.xmlProtocolado) {
    console.log('XML protocolado nao retornado');
    return;
  }

  const xmlPath = `examples/nfe-autorizada-${result.chaveAcesso}.xml`;
  writeFileSync(xmlPath, result.xmlProtocolado);
  console.log(`\nXML salvo em: ${xmlPath}`);

  console.log('Gerando DANFE...');
  const danfePdf = await nfeCore.danfe(result.xmlProtocolado);

  const pdfPath = `examples/danfe-${result.chaveAcesso}.pdf`;
  writeFileSync(pdfPath, danfePdf);
  console.log(`DANFE salvo em: ${pdfPath}`);

  console.log(`\nPara consultar no portal da SEFAZ:`);
  console.log(`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&tipoConteudo=7PhJ+gAVw2g=`);
  console.log(`Chave de acesso: ${result.chaveAcesso}`);
}

main().catch((err) => {
  console.error('Erro:', err.message);
  if (err.cStat) {
    console.error(`SEFAZ: [${err.cStat}] ${err.xMotivo}`);
  }
  process.exit(1);
});
