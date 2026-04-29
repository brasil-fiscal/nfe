import { NFeError } from '@nfe/shared/errors/NFeError';

export type DanfeEmitente = {
  readonly nome: string;
  readonly fantasia?: string;
  readonly cnpj: string;
  readonly ie: string;
  readonly im?: string;
  readonly ieSt?: string;
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
  readonly origemCsosn: string;
  readonly cfop: string;
  readonly unidade: string;
  readonly quantidade: string;
  readonly valorUnitario: string;
  readonly valorTotal: string;
  readonly valorDesconto: string;
  readonly bcIcms: string;
  readonly valorIcms: string;
  readonly valorIpi: string;
  readonly aliqIcms: string;
  readonly aliqIpi: string;
};

export type DanfeTotais = {
  readonly bcIcms: string;
  readonly valorIcms: string;
  readonly bcIcmsSt: string;
  readonly valorIcmsSt: string;
  readonly valorImportacao: string;
  readonly valorProdutos: string;
  readonly valorFrete: string;
  readonly valorSeguro: string;
  readonly desconto: string;
  readonly outrasDespesas: string;
  readonly valorIpi: string;
  readonly valorNfe: string;
};

export type DanfeTransporte = {
  readonly modalidade: string;
  readonly freteTexto: string;
  readonly nome?: string;
  readonly cnpjCpf?: string;
  readonly ie?: string;
  readonly endereco?: string;
  readonly cidade?: string;
  readonly uf?: string;
  readonly codigoAntt?: string;
  readonly placa?: string;
  readonly ufVeiculo?: string;
  readonly quantidade?: string;
  readonly especie?: string;
  readonly marca?: string;
  readonly numeracao?: string;
  readonly pesoLiquido?: string;
  readonly pesoBruto?: string;
};

export type DanfeFatura = {
  readonly numero: string;
  readonly valorOriginal: string;
  readonly valorDesconto: string;
  readonly valorLiquido: string;
};

export type DanfeDuplicata = {
  readonly numero: string;
  readonly vencimento: string;
  readonly valor: string;
};

export type DanfePagamento = {
  readonly forma: string;
  readonly valor: string;
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
  readonly fatura?: DanfeFatura;
  readonly duplicatas?: readonly DanfeDuplicata[];
  readonly pagamentos: readonly DanfePagamento[];
  readonly protocolo: string;
  readonly dataAutorizacao: string;
  readonly informacoesComplementares?: string;
  readonly informacoesFisco?: string;
};

const MODALIDADE_FRETE: Record<string, string> = {
  '0': '0-CIF',
  '1': '1-FOB',
  '2': '2-Terceiros',
  '3': '3-Rem. Proprio',
  '4': '4-Dest. Proprio',
  '9': '9-Sem Frete'
};

const FORMA_PAGAMENTO: Record<string, string> = {
  '01': 'Dinheiro',
  '02': 'Cheque',
  '03': 'Cartao de Credito',
  '04': 'Cartao de Debito',
  '05': 'Credito Loja',
  '10': 'Vale Alimentacao',
  '11': 'Vale Refeicao',
  '12': 'Vale Presente',
  '13': 'Vale Combustivel',
  '14': 'Duplicata Mercantil',
  '15': 'Boleto Bancario',
  '16': 'Deposito Bancario',
  '17': 'PIX',
  '18': 'Transferencia',
  '19': 'Fidelidade/Cashback',
  '90': 'Sem Pagamento',
  '99': 'Outros'
};

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
  const cobr = extractBlock(xml, 'cobr');
  const pag = extractBlock(xml, 'pag');
  const infAdic = extractBlock(xml, 'infAdic');
  const protNFe = extractBlock(xml, 'protNFe');

  const emitEnder = extractBlock(emit, 'enderEmit');
  const destEnder = extractBlock(dest, 'enderDest');

  const modalidadeFrete = xmlTag(transp, 'modFrete') ?? '9';
  const transporta = extractBlock(transp, 'transporta');
  const veicTransp = extractBlock(transp, 'veicTransp');
  const vol = extractBlock(transp, 'vol');

  return {
    chaveAcesso,
    naturezaOperacao: xmlTag(ide, 'natOp') ?? '',
    numero: xmlTag(ide, 'nNF') ?? '',
    serie: xmlTag(ide, 'serie') ?? '',
    dataEmissao: formatDate(xmlTag(ide, 'dhEmi') ?? ''),
    dataSaida: xmlTag(ide, 'dhSaiEnt') ? formatDate(xmlTag(ide, 'dhSaiEnt')!) : undefined,
    tipoOperacao: xmlTag(ide, 'tpNF') === '0' ? 'ENTRADA' : 'SAIDA',
    emitente: {
      nome: xmlTag(emit, 'xNome') ?? '',
      fantasia: xmlTag(emit, 'xFant') ?? undefined,
      cnpj: xmlTag(emit, 'CNPJ') ?? '',
      ie: xmlTag(emit, 'IE') ?? '',
      im: xmlTag(emit, 'IM') ?? undefined,
      ieSt: undefined,
      endereco: `${xmlTag(emitEnder, 'xLgr') ?? ''}, ${xmlTag(emitEnder, 'nro') ?? ''}`,
      bairro: xmlTag(emitEnder, 'xBairro') ?? '',
      cidade: xmlTag(emitEnder, 'xMun') ?? '',
      uf: xmlTag(emitEnder, 'UF') ?? '',
      cep: xmlTag(emitEnder, 'CEP') ?? '',
      fone: xmlTag(emitEnder, 'fone') ?? undefined
    },
    destinatario: {
      nome: xmlTag(dest, 'xNome') ?? '',
      cnpjCpf: xmlTag(dest, 'CNPJ') ?? xmlTag(dest, 'CPF') ?? '',
      ie: xmlTag(dest, 'IE') ?? undefined,
      endereco: `${xmlTag(destEnder, 'xLgr') ?? ''}, ${xmlTag(destEnder, 'nro') ?? ''}`,
      bairro: xmlTag(destEnder, 'xBairro') ?? '',
      cidade: xmlTag(destEnder, 'xMun') ?? '',
      uf: xmlTag(destEnder, 'UF') ?? '',
      cep: xmlTag(destEnder, 'CEP') ?? '',
      fone: xmlTag(destEnder, 'fone') ?? undefined
    },
    produtos: parseProdutos(xml),
    totais: {
      bcIcms: xmlTag(total, 'vBC') ?? '0.00',
      valorIcms: xmlTag(total, 'vICMS') ?? '0.00',
      bcIcmsSt: xmlTag(total, 'vBCST') ?? '0.00',
      valorIcmsSt: xmlTag(total, 'vST') ?? '0.00',
      valorImportacao: xmlTag(total, 'vII') ?? '0.00',
      valorProdutos: xmlTag(total, 'vProd') ?? '0.00',
      valorFrete: xmlTag(total, 'vFrete') ?? '0.00',
      valorSeguro: xmlTag(total, 'vSeg') ?? '0.00',
      desconto: xmlTag(total, 'vDesc') ?? '0.00',
      outrasDespesas: xmlTag(total, 'vOutro') ?? '0.00',
      valorIpi: xmlTag(total, 'vIPI') ?? '0.00',
      valorNfe: xmlTag(total, 'vNF') ?? '0.00'
    },
    transporte: {
      modalidade: modalidadeFrete,
      freteTexto: MODALIDADE_FRETE[modalidadeFrete] ?? modalidadeFrete,
      nome: xmlTag(transporta, 'xNome') ?? undefined,
      cnpjCpf: xmlTag(transporta, 'CNPJ') ?? xmlTag(transporta, 'CPF') ?? undefined,
      ie: xmlTag(transporta, 'IE') ?? undefined,
      endereco: xmlTag(transporta, 'xEnder') ?? undefined,
      cidade: xmlTag(transporta, 'xMun') ?? undefined,
      uf: xmlTag(transporta, 'UF') ?? undefined,
      codigoAntt: xmlTag(veicTransp, 'RNTC') ?? undefined,
      placa: xmlTag(veicTransp, 'placa') ?? undefined,
      ufVeiculo: xmlTag(veicTransp, 'UF') ?? undefined,
      quantidade: xmlTag(vol, 'qVol') ?? undefined,
      especie: xmlTag(vol, 'esp') ?? undefined,
      marca: xmlTag(vol, 'marca') ?? undefined,
      numeracao: xmlTag(vol, 'nVol') ?? undefined,
      pesoLiquido: xmlTag(vol, 'pesoL') ?? undefined,
      pesoBruto: xmlTag(vol, 'pesoB') ?? undefined
    },
    fatura: parseFatura(cobr),
    duplicatas: parseDuplicatas(cobr),
    pagamentos: parsePagamentos(pag),
    protocolo: xmlTag(protNFe, 'nProt') ?? '',
    dataAutorizacao: formatDate(xmlTag(protNFe, 'dhRecbto') ?? ''),
    informacoesComplementares: xmlTag(infAdic, 'infCpl') ?? undefined,
    informacoesFisco: xmlTag(infAdic, 'infAdFisco') ?? undefined
  };
}

function parseProdutos(xml: string): DanfeProduto[] {
  const produtos: DanfeProduto[] = [];
  const detRegex = /<det\s[^>]*>([\s\S]*?)<\/det>/g;
  let match: RegExpExecArray | null;

  while ((match = detRegex.exec(xml)) !== null) {
    const det = match[1];
    const prod = extractBlock(det, 'prod');
    const icmsBlock = extractBlock(det, 'ICMS');
    const ipiBlock = extractBlock(det, 'IPI');

    const icmsInner = icmsBlock.match(/<ICMS\w*>([\s\S]*?)<\/ICMS\w*>/)?.[1] ?? icmsBlock;

    const origem = xmlTag(icmsInner, 'orig') ?? '0';
    const cst = xmlTag(icmsInner, 'CST');
    const csosn = xmlTag(icmsInner, 'CSOSN');
    const origemCsosn = csosn ? `${origem}/${csosn}` : cst ? `${origem}/${cst}` : origem;

    const ipiInner = ipiBlock.match(/<IPITrib>([\s\S]*?)<\/IPITrib>/)?.[1] ?? '';

    produtos.push({
      codigo: xmlTag(prod, 'cProd') ?? '',
      descricao: xmlTag(prod, 'xProd') ?? '',
      ncm: xmlTag(prod, 'NCM') ?? '',
      origemCsosn,
      cfop: xmlTag(prod, 'CFOP') ?? '',
      unidade: xmlTag(prod, 'uCom') ?? '',
      quantidade: xmlTag(prod, 'qCom') ?? '',
      valorUnitario: xmlTag(prod, 'vUnCom') ?? '',
      valorTotal: xmlTag(prod, 'vProd') ?? '',
      valorDesconto: xmlTag(prod, 'vDesc') ?? '0.00',
      bcIcms: xmlTag(icmsInner, 'vBC') ?? '0.00',
      valorIcms: xmlTag(icmsInner, 'vICMS') ?? '0.00',
      valorIpi: xmlTag(ipiInner, 'vIPI') ?? '0.00',
      aliqIcms: xmlTag(icmsInner, 'pICMS') ?? '0.00',
      aliqIpi: xmlTag(ipiInner, 'pIPI') ?? '0.00'
    });
  }

  return produtos;
}

function parseFatura(cobr: string): DanfeFatura | undefined {
  if (!cobr) return undefined;
  const fat = extractBlock(cobr, 'fat');
  if (!fat) return undefined;

  return {
    numero: xmlTag(fat, 'nFat') ?? '',
    valorOriginal: xmlTag(fat, 'vOrig') ?? '0.00',
    valorDesconto: xmlTag(fat, 'vDesc') ?? '0.00',
    valorLiquido: xmlTag(fat, 'vLiq') ?? '0.00'
  };
}

function parseDuplicatas(cobr: string): DanfeDuplicata[] | undefined {
  if (!cobr) return undefined;
  const dups: DanfeDuplicata[] = [];
  const dupRegex = /<dup>([\s\S]*?)<\/dup>/g;
  let match: RegExpExecArray | null;

  while ((match = dupRegex.exec(cobr)) !== null) {
    const d = match[1];
    dups.push({
      numero: xmlTag(d, 'nDup') ?? '',
      vencimento: formatDateShort(xmlTag(d, 'dVenc') ?? ''),
      valor: xmlTag(d, 'vDup') ?? '0.00'
    });
  }

  return dups.length > 0 ? dups : undefined;
}

function parsePagamentos(pag: string): DanfePagamento[] {
  const pagamentos: DanfePagamento[] = [];
  const detPagRegex = /<detPag>([\s\S]*?)<\/detPag>/g;
  let match: RegExpExecArray | null;

  while ((match = detPagRegex.exec(pag)) !== null) {
    const d = match[1];
    const tPag = xmlTag(d, 'tPag') ?? '99';
    pagamentos.push({
      forma: FORMA_PAGAMENTO[tPag] ?? `Outros (${tPag})`,
      valor: xmlTag(d, 'vPag') ?? '0.00'
    });
  }

  return pagamentos;
}

function xmlTag(xml: string, tagName: string): string | null {
  const match = xml.match(new RegExp(`<${tagName}>([^<]*)</${tagName}>`));
  return match ? unescapeXml(match[1]) : null;
}

function unescapeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
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

function formatDateShort(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const [yyyy, mm, dd] = dateStr.split('-');
  return `${dd}/${mm}/${yyyy}`;
}
