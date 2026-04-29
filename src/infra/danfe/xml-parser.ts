import { NFeError } from '@nfe/shared/errors/NFeError';

export type DanfeEmitente = {
  readonly nome: string;
  readonly fantasia?: string;
  readonly cnpj: string;
  readonly ie: string;
  readonly endereco: string;
  readonly bairro: string;
  readonly cidade: string;
  readonly uf: string;
  readonly cep: string;
  readonly fone?: string;
};

export type DanfeDestinatario = {
  readonly nome: string;
  readonly cnpjCpf: string;
  readonly ie?: string;
  readonly endereco: string;
  readonly bairro: string;
  readonly cidade: string;
  readonly uf: string;
  readonly cep: string;
  readonly fone?: string;
};

export type DanfeProduto = {
  readonly codigo: string;
  readonly descricao: string;
  readonly ncm: string;
  readonly cfop: string;
  readonly unidade: string;
  readonly quantidade: string;
  readonly valorUnitario: string;
  readonly valorTotal: string;
  readonly bcIcms: string;
  readonly valorIcms: string;
  readonly aliqIcms: string;
};

export type DanfeTotais = {
  readonly bcIcms: string;
  readonly valorIcms: string;
  readonly valorProdutos: string;
  readonly valorFrete: string;
  readonly valorSeguro: string;
  readonly desconto: string;
  readonly outrasDespesas: string;
  readonly valorNfe: string;
};

export type DanfeTransporte = {
  readonly modalidade: string;
  readonly nome?: string;
  readonly cnpjCpf?: string;
  readonly ie?: string;
  readonly endereco?: string;
  readonly cidade?: string;
  readonly uf?: string;
  readonly quantidade?: string;
  readonly especie?: string;
  readonly pesoLiquido?: string;
  readonly pesoBruto?: string;
};

export type DanfeData = {
  readonly chaveAcesso: string;
  readonly naturezaOperacao: string;
  readonly numero: string;
  readonly serie: string;
  readonly dataEmissao: string;
  readonly dataSaida?: string;
  readonly tipoOperacao: string;
  readonly emitente: DanfeEmitente;
  readonly destinatario: DanfeDestinatario;
  readonly produtos: readonly DanfeProduto[];
  readonly totais: DanfeTotais;
  readonly transporte: DanfeTransporte;
  readonly protocolo: string;
  readonly dataAutorizacao: string;
  readonly informacoesComplementares?: string;
  readonly informacoesFisco?: string;
};

/**
 * Extrai dados de um XML autorizado de NFe para gerar o DANFE.
 * Aceita tanto <nfeProc> (XML protocolado) quanto <NFe> (XML simples).
 */
export function parseNFeXml(xml: string): DanfeData {
  const chaveAcesso = extractAttr(xml, 'infNFe', 'Id')?.replace('NFe', '') ?? '';
  if (!chaveAcesso || chaveAcesso.length !== 44) {
    throw new NFeError('XML invalido: chave de acesso nao encontrada em infNFe[@Id]');
  }

  const ide = extractBlock(xml, 'ide');
  const emit = extractBlock(xml, 'emit');
  const dest = extractBlock(xml, 'dest');
  const total = extractBlock(xml, 'total');
  const transp = extractBlock(xml, 'transp');
  const infAdic = extractBlock(xml, 'infAdic');
  const protNFe = extractBlock(xml, 'protNFe');

  const emitEnder = extractBlock(emit, 'enderEmit');
  const destEnder = extractBlock(dest, 'enderDest');

  const modalidadeFrete = tag(transp, 'modFrete') ?? '9';
  const modalidades: Record<string, string> = {
    '0': '0 - Contratacao por conta do Remetente (CIF)',
    '1': '1 - Contratacao por conta do Destinatario (FOB)',
    '2': '2 - Contratacao por conta de Terceiros',
    '3': '3 - Proprio por conta do Remetente',
    '4': '4 - Proprio por conta do Destinatario',
    '9': '9 - Sem Ocorrencia de Transporte'
  };

  const transporta = extractBlock(transp, 'transporta');
  const vol = extractBlock(transp, 'vol');

  return {
    chaveAcesso,
    naturezaOperacao: tag(ide, 'natOp') ?? '',
    numero: tag(ide, 'nNF') ?? '',
    serie: tag(ide, 'serie') ?? '',
    dataEmissao: formatDate(tag(ide, 'dhEmi') ?? ''),
    dataSaida: tag(ide, 'dhSaiEnt') ? formatDate(tag(ide, 'dhSaiEnt')!) : undefined,
    tipoOperacao: tag(ide, 'tpNF') === '0' ? 'ENTRADA' : 'SAIDA',
    emitente: {
      nome: tag(emit, 'xNome') ?? '',
      fantasia: tag(emit, 'xFant') ?? undefined,
      cnpj: tag(emit, 'CNPJ') ?? '',
      ie: tag(emit, 'IE') ?? '',
      endereco: `${tag(emitEnder, 'xLgr') ?? ''}, ${tag(emitEnder, 'nro') ?? ''}`,
      bairro: tag(emitEnder, 'xBairro') ?? '',
      cidade: tag(emitEnder, 'xMun') ?? '',
      uf: tag(emitEnder, 'UF') ?? '',
      cep: tag(emitEnder, 'CEP') ?? '',
      fone: tag(emitEnder, 'fone') ?? undefined
    },
    destinatario: {
      nome: tag(dest, 'xNome') ?? '',
      cnpjCpf: tag(dest, 'CNPJ') ?? tag(dest, 'CPF') ?? '',
      ie: tag(dest, 'IE') ?? undefined,
      endereco: `${tag(destEnder, 'xLgr') ?? ''}, ${tag(destEnder, 'nro') ?? ''}`,
      bairro: tag(destEnder, 'xBairro') ?? '',
      cidade: tag(destEnder, 'xMun') ?? '',
      uf: tag(destEnder, 'UF') ?? '',
      cep: tag(destEnder, 'CEP') ?? '',
      fone: tag(destEnder, 'fone') ?? undefined
    },
    produtos: parseProdutos(xml),
    totais: {
      bcIcms: tag(total, 'vBC') ?? '0.00',
      valorIcms: tag(total, 'vICMS') ?? '0.00',
      valorProdutos: tag(total, 'vProd') ?? '0.00',
      valorFrete: tag(total, 'vFrete') ?? '0.00',
      valorSeguro: tag(total, 'vSeg') ?? '0.00',
      desconto: tag(total, 'vDesc') ?? '0.00',
      outrasDespesas: tag(total, 'vOutro') ?? '0.00',
      valorNfe: tag(total, 'vNF') ?? '0.00'
    },
    transporte: {
      modalidade: modalidades[modalidadeFrete] ?? modalidadeFrete,
      nome: tag(transporta, 'xNome') ?? undefined,
      cnpjCpf: tag(transporta, 'CNPJ') ?? tag(transporta, 'CPF') ?? undefined,
      ie: tag(transporta, 'IE') ?? undefined,
      endereco: tag(transporta, 'xEnder') ?? undefined,
      cidade: tag(transporta, 'xMun') ?? undefined,
      uf: tag(transporta, 'UF') ?? undefined,
      quantidade: tag(vol, 'qVol') ?? undefined,
      especie: tag(vol, 'esp') ?? undefined,
      pesoLiquido: tag(vol, 'pesoL') ?? undefined,
      pesoBruto: tag(vol, 'pesoB') ?? undefined
    },
    protocolo: tag(protNFe, 'nProt') ?? '',
    dataAutorizacao: formatDate(tag(protNFe, 'dhRecbto') ?? ''),
    informacoesComplementares: tag(infAdic, 'infCpl') ?? undefined,
    informacoesFisco: tag(infAdic, 'infAdFisco') ?? undefined
  };
}

function parseProdutos(xml: string): DanfeProduto[] {
  const produtos: DanfeProduto[] = [];
  const detRegex = /<det\s[^>]*>([\s\S]*?)<\/det>/g;
  let match: RegExpExecArray | null;

  while ((match = detRegex.exec(xml)) !== null) {
    const det = match[1];
    const prod = extractBlock(det, 'prod');
    const icms = extractBlock(det, 'ICMS');

    // Pegar o primeiro cStat/pICMS/vICMS/vBC dentro do bloco ICMS
    const icmsInner = icms.match(/<ICMS\w*>([\s\S]*?)<\/ICMS\w*>/)?.[1] ?? icms;

    produtos.push({
      codigo: tag(prod, 'cProd') ?? '',
      descricao: tag(prod, 'xProd') ?? '',
      ncm: tag(prod, 'NCM') ?? '',
      cfop: tag(prod, 'CFOP') ?? '',
      unidade: tag(prod, 'uCom') ?? '',
      quantidade: tag(prod, 'qCom') ?? '',
      valorUnitario: tag(prod, 'vUnCom') ?? '',
      valorTotal: tag(prod, 'vProd') ?? '',
      bcIcms: tag(icmsInner, 'vBC') ?? '0.00',
      valorIcms: tag(icmsInner, 'vICMS') ?? '0.00',
      aliqIcms: tag(icmsInner, 'pICMS') ?? '0.00'
    });
  }

  return produtos;
}

function tag(xml: string, tagName: string): string | null {
  const match = xml.match(new RegExp(`<${tagName}>([^<]*)</${tagName}>`));
  return match ? match[1] : null;
}

function extractBlock(xml: string, tagName: string): string {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`));
  return match ? match[0] : '';
}

function extractAttr(xml: string, tagName: string, attr: string): string | null {
  const match = xml.match(new RegExp(`<${tagName}[^>]*${attr}="([^"]+)"`));
  return match ? match[1] : null;
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  } catch {
    return isoDate;
  }
}
