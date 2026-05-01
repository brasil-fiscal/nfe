import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { NFeCore } from '@nfe/core/NFeCore';
import type { NFeProps } from '@nfe/domain/entities/NFe';
import { loadE2EConfig, loadPfxBuffer, E2EConfig } from './env-loader';

const config = loadE2EConfig();

function loadNFCeTokens(): { cIdToken: string; csc: string } | null {
  const { readFileSync, existsSync } = require('node:fs');
  const { resolve } = require('node:path');
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return null;

  const content = readFileSync(envPath, 'utf-8') as string;
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const raw = trimmed.slice(eqIndex + 1).trim();
    vars[trimmed.slice(0, eqIndex).trim()] = raw.replace(/^["']|["']$/g, '');
  }

  const cIdToken = vars['NFCE_CID_TOKEN'] ?? process.env['NFCE_CID_TOKEN'] ?? '';
  const csc = vars['NFCE_CSC'] ?? process.env['NFCE_CSC'] ?? '';
  if (!cIdToken || !csc) return null;
  return { cIdToken, csc };
}

const nfceTokens = loadNFCeTokens();

function buildNFCeHomologacao(cfg: E2EConfig): NFeProps {
  return {
    identificacao: {
      naturezaOperacao: 'VENDA DE MERCADORIA',
      tipoOperacao: 1,
      destinoOperacao: 1,
      finalidade: 1,
      consumidorFinal: 1,
      presencaComprador: 1,
      uf: cfg.uf,
      municipio: cfg.codMunicipio,
      serie: 1,
      numero: Math.floor(Math.random() * 999999) + 1,
      dataEmissao: new Date(),
      tipoImpressao: 4,
      modelo: '65',
      ambiente: 2
    },
    emitente: {
      cnpj: cfg.cnpj,
      razaoSocial: cfg.razaoSocial,
      inscricaoEstadual: cfg.ie,
      regimeTributario: 1,
      endereco: {
        logradouro: cfg.logradouro,
        numero: cfg.numero,
        bairro: cfg.bairro,
        codigoMunicipio: cfg.codMunicipio,
        municipio: cfg.municipio,
        uf: cfg.uf,
        cep: cfg.cep
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
        quantidade: 1,
        valorUnitario: 10.00,
        valorTotal: 10.00,
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
          valor: 10.00
        }
      ]
    }
  };
}

const skipReason = !config
  ? 'Certificado ou IE nao configurados no .env'
  : !nfceTokens
    ? 'NFCE_CID_TOKEN e NFCE_CSC nao configurados no .env'
    : undefined;

describe('E2E: SEFAZ NFC-e Homologacao', { skip: skipReason }, () => {
  let nfce: NFeCore;

  before(() => {
    if (!config || !nfceTokens) return;
    const pfx = loadPfxBuffer(config.pfxPath);
    nfce = NFeCore.create({
      pfx,
      senha: config.pfxSenha,
      ambiente: 'homologacao',
      uf: config.uf,
      cIdToken: nfceTokens.cIdToken,
      csc: nfceTokens.csc
    });
  });

  it('deve transmitir NFC-e em homologacao', async () => {
    if (!config || !nfceTokens) return;

    const nfceData = buildNFCeHomologacao(config);
    console.log(`\n  Transmitindo NFC-e numero ${nfceData.identificacao.numero} para SEFAZ ${config.uf} homologacao...`);

    const result = await nfce.transmitir(nfceData);

    console.log(`  Status: ${result.codigoStatus} - ${result.motivo}`);
    console.log(`  Protocolo: ${result.protocolo}`);
    console.log(`  Chave: ${result.chaveAcesso}`);

    if (result.xmlProtocolado) {
      console.log(`  infNFeSupl: ${result.xmlProtocolado.includes('<infNFeSupl>') ? 'SIM' : 'NAO'}`);
    }

    assert.equal(result.autorizada, true);
    assert.ok(result.protocolo);
    assert.ok(result.chaveAcesso);
    assert.equal(result.codigoStatus, '100');
  });
});
