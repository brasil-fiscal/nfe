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
      consumidorFinal: 1,
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
        codigo: 'PROD001',
        descricao: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
        ncm: '94036000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 2,
        valorUnitario: 50.00,
        valorTotal: 100.00,
        icms: { origem: 0, csosn: '102' },
        pis: { cst: '49' },
        cofins: { cst: '49' }
      },
      {
        numero: 2,
        codigo: 'PROD002',
        descricao: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
        ncm: '84714900',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 1,
        valorUnitario: 150.00,
        valorTotal: 150.00,
        icms: { origem: 0, csosn: '102' },
        pis: { cst: '49' },
        cofins: { cst: '49' }
      }
    ],
    transporte: { modalidadeFrete: 9 },
    pagamento: {
      pagamentos: [{ formaPagamento: '01', valor: 250.00 }]
    },
    informacoesComplementares: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL. Teste de integracao @brasil-fiscal/nfe.'
  };

  console.log('Transmitindo NFe para SEFAZ MT homologacao...');
  const result = await nfeCore.transmitir(nfeData);

  console.log(`Status: ${result.codigoStatus} - ${result.motivo}`);
  console.log(`Protocolo: ${result.protocolo}`);
  console.log(`Chave: ${result.chaveAcesso}`);

  if (!result.xmlProtocolado) {
    console.log('XML protocolado nao retornado');
    return;
  }

  // Salvar XML autorizado
  const xmlPath = `examples/nfe-autorizada-${result.chaveAcesso}.xml`;
  writeFileSync(xmlPath, result.xmlProtocolado);
  console.log(`\nXML salvo em: ${xmlPath}`);

  // Gerar DANFE
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
