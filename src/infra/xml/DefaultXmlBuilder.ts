import { XmlBuilder } from '@nfe/contracts/XmlBuilder';
import { NFeProps } from '@nfe/domain/entities/NFe';
import { EmitenteProps } from '@nfe/domain/entities/Emitente';
import { DestinatarioProps } from '@nfe/domain/entities/Destinatario';
import { EnderecoProps } from '@nfe/domain/entities/Endereco';
import { ProdutoProps } from '@nfe/domain/entities/Produto';
import { TransporteProps } from '@nfe/domain/entities/Transporte';
import { PagamentoProps } from '@nfe/domain/entities/Pagamento';
import { CobrancaProps } from '@nfe/domain/entities/Cobranca';
import { UF_CODES } from '@nfe/shared/constants/ibge-codes';
import { generateAccessKey, generateNumericCode } from '@nfe/shared/helpers/access-key';
import { tag, tagGroup, formatNumber, formatDate } from './xml-helper';

const NFE_VERSION = '4.00';
const NFE_NAMESPACE = 'http://www.portalfiscal.inf.br/nfe';

export class DefaultXmlBuilder implements XmlBuilder {
  build(nfe: NFeProps): string {
    const uf = nfe.identificacao.uf;
    const cUF = UF_CODES[uf] || uf;
    const dataEmissao = nfe.identificacao.dataEmissao ?? new Date();
    const tipoEmissao = nfe.identificacao.tipoEmissao ?? 1;
    const codigoNumerico = generateNumericCode();
    const modelo = '55';

    const chaveAcesso = generateAccessKey({
      uf: cUF,
      dataEmissao,
      cnpj: nfe.emitente.cnpj,
      modelo,
      serie: nfe.identificacao.serie,
      numero: nfe.identificacao.numero,
      tipoEmissao,
      codigoNumerico
    });

    const cDV = chaveAcesso.slice(-1);

    const ide = this.buildIde(nfe, cUF, dataEmissao, tipoEmissao, codigoNumerico, cDV, modelo);
    const emit = this.buildEmitente(nfe.emitente);
    const ambiente = (nfe.identificacao.ambiente ?? 2) as 1 | 2;
    const dest = this.buildDestinatario(nfe.destinatario, ambiente);
    const det = this.buildProdutos(nfe.produtos);
    const total = this.buildTotais(nfe);
    const transp = this.buildTransporte(nfe.transporte);
    const cobr = this.buildCobranca(nfe.cobranca);
    const pag = this.buildPagamento(nfe.pagamento);
    const infAdic = this.buildInformacoesAdicionais(
      nfe.informacoesComplementares,
      nfe.informacoesFisco
    );

    const infNFe =
      `<infNFe versao="${NFE_VERSION}" Id="NFe${chaveAcesso}">` +
      ide +
      emit +
      dest +
      det +
      total +
      transp +
      cobr +
      pag +
      infAdic +
      '</infNFe>';

    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<NFe xmlns="${NFE_NAMESPACE}">` +
      infNFe +
      '</NFe>'
    );
  }

  private buildIde(
    nfe: NFeProps,
    cUF: string,
    dataEmissao: Date,
    tipoEmissao: number,
    codigoNumerico: string,
    cDV: string,
    modelo: string
  ): string {
    const id = nfe.identificacao;
    const tipoImpressao = id.tipoImpressao ?? 1;
    const tpAmb = String(id.ambiente ?? 2);

    return tagGroup(
      'ide',
      tag('cUF', cUF) +
        tag('cNF', codigoNumerico) +
        tag('natOp', id.naturezaOperacao) +
        tag('mod', modelo) +
        tag('serie', String(id.serie)) +
        tag('nNF', String(id.numero)) +
        tag('dhEmi', formatDate(dataEmissao)) +
        tag('tpNF', String(id.tipoOperacao)) +
        tag('idDest', String(id.destinoOperacao)) +
        tag('cMunFG', id.municipio) +
        tag('tpImp', String(tipoImpressao)) +
        tag('tpEmis', String(tipoEmissao)) +
        tag('cDV', cDV) +
        tag('tpAmb', tpAmb) +
        tag('finNFe', String(id.finalidade)) +
        tag('indFinal', String(id.consumidorFinal)) +
        tag('indPres', String(id.presencaComprador)) +
        tag('procEmi', '0') +
        tag('verProc', 'brasil-fiscal-nfe')
    );
  }

  private buildEmitente(emit: EmitenteProps): string {
    const endereco = this.buildEndereco('enderEmit', emit.endereco);

    return tagGroup(
      'emit',
      tag('CNPJ', emit.cnpj) +
        tag('xNome', emit.razaoSocial) +
        tag('xFant', emit.nomeFantasia) +
        endereco +
        tag('IE', emit.inscricaoEstadual) +
        tag('IM', emit.inscricaoMunicipal) +
        tag('CNAE', emit.cnae) +
        tag('CRT', String(emit.regimeTributario))
    );
  }

  private buildDestinatario(dest: DestinatarioProps, tpAmb: 1 | 2): string {
    const doc = dest.cnpj ? tag('CNPJ', dest.cnpj) : tag('CPF', dest.cpf);
    const endereco = this.buildEndereco('enderDest', dest.endereco);
    const xNome = tpAmb === 2
      ? 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'
      : dest.nome;

    return tagGroup(
      'dest',
      doc +
        tag('xNome', xNome) +
        endereco +
        tag('indIEDest', String(dest.indicadorIE)) +
        tag('IE', dest.inscricaoEstadual) +
        tag('email', dest.email)
    );
  }

  private buildEndereco(tagName: string, end: EnderecoProps): string {
    return tagGroup(
      tagName,
      tag('xLgr', end.logradouro) +
        tag('nro', end.numero) +
        tag('xCpl', end.complemento) +
        tag('xBairro', end.bairro) +
        tag('cMun', end.codigoMunicipio) +
        tag('xMun', end.municipio) +
        tag('UF', end.uf) +
        tag('CEP', end.cep) +
        tag('cPais', end.codigoPais || '1058') +
        tag('xPais', end.pais || 'Brasil') +
        tag('fone', end.telefone)
    );
  }

  private buildProdutos(produtos: readonly ProdutoProps[]): string {
    return produtos.map((prod, index) => this.buildProduto(prod, index + 1)).join('');
  }

  private buildProduto(prod: ProdutoProps, nItem: number): string {
    const prodTag = tagGroup(
      'prod',
      tag('cProd', prod.codigo) +
        tag('cEAN', prod.ean || 'SEM GTIN') +
        tag('xProd', prod.descricao) +
        tag('NCM', prod.ncm) +
        tag('CEST', prod.cest) +
        tag('CFOP', prod.cfop) +
        tag('uCom', prod.unidade) +
        tag('qCom', formatNumber(prod.quantidade, 4)) +
        tag('vUnCom', formatNumber(prod.valorUnitario, 10)) +
        tag('vProd', formatNumber(prod.valorTotal, 2)) +
        tag('cEANTrib', prod.eanTributavel || 'SEM GTIN') +
        tag('uTrib', prod.unidade) +
        tag('qTrib', formatNumber(prod.quantidade, 4)) +
        tag('vUnTrib', formatNumber(prod.valorUnitario, 10)) +
        tag('vFrete', prod.valorFrete ? formatNumber(prod.valorFrete, 2) : undefined) +
        tag('vSeg', prod.valorSeguro ? formatNumber(prod.valorSeguro, 2) : undefined) +
        tag('vDesc', prod.valorDesconto ? formatNumber(prod.valorDesconto, 2) : undefined) +
        tag('vOutro', prod.outrasDespesas ? formatNumber(prod.outrasDespesas, 2) : undefined) +
        tag('indTot', '1')
    );

    const imposto = this.buildImpostos(prod);

    return tagGroup('det', prodTag + imposto, `nItem="${nItem}"`);
  }

  private buildImpostos(prod: ProdutoProps): string {
    const icms = this.buildICMS(prod);
    const ipi = this.buildIPI(prod);
    const pis = this.buildPIS(prod);
    const cofins = this.buildCOFINS(prod);

    return tagGroup('imposto', icms + ipi + pis + cofins);
  }

  private buildICMS(prod: ProdutoProps): string {
    const icms = prod.icms;

    if (icms.csosn) {
      return tagGroup(
        'ICMS',
        tagGroup(
          'ICMSSN' + icms.csosn,
          tag('orig', String(icms.origem)) +
            tag('CSOSN', icms.csosn) +
            (icms.baseCalculo !== undefined
              ? tag('vBC', formatNumber(icms.baseCalculo, 2))
              : '') +
            (icms.aliquota !== undefined ? tag('pICMS', formatNumber(icms.aliquota, 2)) : '') +
            (icms.valor !== undefined ? tag('vICMS', formatNumber(icms.valor, 2)) : '')
        )
      );
    }

    const cst = icms.cst || '00';
    return tagGroup(
      'ICMS',
      tagGroup(
        'ICMS' + cst,
        tag('orig', String(icms.origem)) +
          tag('CST', cst) +
          tag('modBC', '3') +
          (icms.baseCalculo !== undefined
            ? tag('vBC', formatNumber(icms.baseCalculo, 2))
            : tag('vBC', '0.00')) +
          (icms.aliquota !== undefined ? tag('pICMS', formatNumber(icms.aliquota, 2)) : '') +
          (icms.valor !== undefined ? tag('vICMS', formatNumber(icms.valor, 2)) : '')
      )
    );
  }

  private buildPIS(prod: ProdutoProps): string {
    const pis = prod.pis;

    const isNonTaxable = ['04', '05', '06', '07', '08', '09'].includes(pis.cst);

    if (isNonTaxable) {
      return tagGroup(
        'PIS',
        tagGroup('PISNT', tag('CST', pis.cst))
      );
    }

    const isOutr = ['49', '50', '51', '52', '53', '54', '55', '56',
      '60', '61', '62', '63', '64', '65', '66', '67',
      '70', '71', '72', '73', '74', '75', '98', '99'].includes(pis.cst);

    if (isOutr) {
      return tagGroup(
        'PIS',
        tagGroup(
          'PISOutr',
          tag('CST', pis.cst) +
            tag('vBC', formatNumber(pis.baseCalculo || 0, 2)) +
            tag('pPIS', formatNumber(pis.aliquota || 0, 4)) +
            tag('vPIS', formatNumber(pis.valor || 0, 2))
        )
      );
    }

    return tagGroup(
      'PIS',
      tagGroup(
        'PISAliq',
        tag('CST', pis.cst) +
          tag('vBC', formatNumber(pis.baseCalculo || 0, 2)) +
          tag('pPIS', formatNumber(pis.aliquota || 0, 4)) +
          tag('vPIS', formatNumber(pis.valor || 0, 2))
      )
    );
  }

  private buildCOFINS(prod: ProdutoProps): string {
    const cofins = prod.cofins;

    const isNonTaxable = ['04', '05', '06', '07', '08', '09'].includes(cofins.cst);

    if (isNonTaxable) {
      return tagGroup(
        'COFINS',
        tagGroup('COFINSNT', tag('CST', cofins.cst))
      );
    }

    const isOutr = ['49', '50', '51', '52', '53', '54', '55', '56',
      '60', '61', '62', '63', '64', '65', '66', '67',
      '70', '71', '72', '73', '74', '75', '98', '99'].includes(cofins.cst);

    if (isOutr) {
      return tagGroup(
        'COFINS',
        tagGroup(
          'COFINSOutr',
          tag('CST', cofins.cst) +
            tag('vBC', formatNumber(cofins.baseCalculo || 0, 2)) +
            tag('pCOFINS', formatNumber(cofins.aliquota || 0, 4)) +
            tag('vCOFINS', formatNumber(cofins.valor || 0, 2))
        )
      );
    }

    return tagGroup(
      'COFINS',
      tagGroup(
        'COFINSAliq',
        tag('CST', cofins.cst) +
          tag('vBC', formatNumber(cofins.baseCalculo || 0, 2)) +
          tag('pCOFINS', formatNumber(cofins.aliquota || 0, 4)) +
          tag('vCOFINS', formatNumber(cofins.valor || 0, 2))
      )
    );
  }

  private buildTotais(nfe: NFeProps): string {
    let vProd = 0;
    let vDesc = 0;
    let vFrete = 0;
    let vSeg = 0;
    let vOutro = 0;
    let vBC = 0;
    let vICMS = 0;
    let vIPI = 0;
    let vPIS = 0;
    let vCOFINS = 0;

    for (const prod of nfe.produtos) {
      vProd += prod.valorTotal;
      vDesc += prod.valorDesconto || 0;
      vFrete += prod.valorFrete || 0;
      vSeg += prod.valorSeguro || 0;
      vOutro += prod.outrasDespesas || 0;
      vBC += prod.icms.baseCalculo || 0;
      vICMS += prod.icms.valor || 0;
      vIPI += prod.ipi?.valor || 0;
      vPIS += prod.pis.valor || 0;
      vCOFINS += prod.cofins.valor || 0;
    }

    const vNF = vProd - vDesc + vFrete + vSeg + vIPI + vOutro;

    return tagGroup(
      'total',
      tagGroup(
        'ICMSTot',
        tag('vBC', formatNumber(vBC, 2)) +
          tag('vICMS', formatNumber(vICMS, 2)) +
          tag('vICMSDeson', '0.00') +
          tag('vFCPUFDest', '0.00') +
          tag('vICMSUFDest', '0.00') +
          tag('vICMSUFRemet', '0.00') +
          tag('vFCP', '0.00') +
          tag('vBCST', '0.00') +
          tag('vST', '0.00') +
          tag('vFCPST', '0.00') +
          tag('vFCPSTRet', '0.00') +
          tag('vProd', formatNumber(vProd, 2)) +
          tag('vFrete', formatNumber(vFrete, 2)) +
          tag('vSeg', formatNumber(vSeg, 2)) +
          tag('vDesc', formatNumber(vDesc, 2)) +
          tag('vII', '0.00') +
          tag('vIPI', formatNumber(vIPI, 2)) +
          tag('vIPIDevol', '0.00') +
          tag('vPIS', formatNumber(vPIS, 2)) +
          tag('vCOFINS', formatNumber(vCOFINS, 2)) +
          tag('vOutro', formatNumber(vOutro, 2)) +
          tag('vNF', formatNumber(vNF, 2))
      )
    );
  }

  private buildTransporte(transp: TransporteProps): string {
    let transportadora = '';
    if (transp.cnpjTransportadora) {
      transportadora = tagGroup(
        'transporta',
        tag('CNPJ', transp.cnpjTransportadora) +
          tag('xNome', transp.nomeTransportadora) +
          tag('IE', transp.inscricaoEstadual) +
          tag('xEnder', transp.endereco) +
          tag('xMun', transp.municipio) +
          tag('UF', transp.uf)
      );
    }

    let volumes = '';
    if (transp.volumes) {
      volumes = transp.volumes
        .map((vol) =>
          tagGroup(
            'vol',
            tag('qVol', vol.quantidade !== undefined ? String(vol.quantidade) : undefined) +
              tag('esp', vol.especie) +
              tag('marca', vol.marca) +
              tag('nVol', vol.numeracao) +
              tag('pesoL', vol.pesoLiquido !== undefined ? formatNumber(vol.pesoLiquido, 3) : undefined) +
              tag('pesoB', vol.pesoBruto !== undefined ? formatNumber(vol.pesoBruto, 3) : undefined)
          )
        )
        .join('');
    }

    let veiculo = '';
    if (transp.veiculo) {
      veiculo = tagGroup(
        'veicTransp',
        tag('placa', transp.veiculo.placa) +
          tag('UF', transp.veiculo.uf) +
          tag('RNTC', transp.veiculo.rntc)
      );
    }

    return tagGroup(
      'transp',
      tag('modFrete', String(transp.modalidadeFrete)) + transportadora + veiculo + volumes
    );
  }

  private buildIPI(prod: ProdutoProps): string {
    if (!prod.ipi) return '';

    const ipi = prod.ipi;
    const cEnq = ipi.cEnq || '999';
    const nonTaxable = ['01', '02', '03', '04', '05', '51', '52', '53', '54', '55'];

    if (nonTaxable.includes(ipi.cst)) {
      return tagGroup(
        'IPI',
        tag('cEnq', cEnq) +
          tagGroup('IPINT', tag('CST', ipi.cst))
      );
    }

    return tagGroup(
      'IPI',
      tag('cEnq', cEnq) +
        tagGroup(
          'IPITrib',
          tag('CST', ipi.cst) +
            tag('vBC', formatNumber(ipi.baseCalculo || 0, 2)) +
            tag('pIPI', formatNumber(ipi.aliquota || 0, 2)) +
            tag('vIPI', formatNumber(ipi.valor || 0, 2))
        )
    );
  }

  private buildCobranca(cobr?: CobrancaProps): string {
    if (!cobr) return '';

    let fat = '';
    if (cobr.fatura) {
      fat = tagGroup(
        'fat',
        tag('nFat', cobr.fatura.nFat) +
          tag('vOrig', cobr.fatura.vOrig !== undefined ? formatNumber(cobr.fatura.vOrig, 2) : undefined) +
          tag('vDesc', cobr.fatura.vDesc !== undefined ? formatNumber(cobr.fatura.vDesc, 2) : undefined) +
          tag('vLiq', cobr.fatura.vLiq !== undefined ? formatNumber(cobr.fatura.vLiq, 2) : undefined)
      );
    }

    let dups = '';
    if (cobr.duplicatas) {
      dups = cobr.duplicatas
        .map((dup) =>
          tagGroup(
            'dup',
            tag('nDup', dup.nDup) +
              tag('dVenc', dup.dVenc) +
              tag('vDup', formatNumber(dup.vDup, 2))
          )
        )
        .join('');
    }

    return tagGroup('cobr', fat + dups);
  }

  private buildPagamento(pag: PagamentoProps): string {
    const detPag = pag.pagamentos
      .map((p) => {
        let content =
          tag('tPag', p.formaPagamento) + tag('vPag', formatNumber(p.valor, 2));

        if (p.tipoIntegracao !== undefined) {
          let cardContent = tag('tpIntegra', String(p.tipoIntegracao));
          if (p.cnpjCredenciadora) cardContent += tag('CNPJ', p.cnpjCredenciadora);
          if (p.bandeira) cardContent += tag('tBand', p.bandeira);
          if (p.autorizacao) cardContent += tag('cAut', p.autorizacao);
          content += tagGroup('card', cardContent);
        }

        return tagGroup('detPag', content);
      })
      .join('');

    let troco = '';
    if (pag.troco && pag.troco > 0) {
      troco = tag('vTroco', formatNumber(pag.troco, 2));
    }

    return tagGroup('pag', detPag + troco);
  }

  private buildInformacoesAdicionais(
    complementar?: string,
    fisco?: string
  ): string {
    if (!complementar && !fisco) return '';

    return tagGroup(
      'infAdic',
      tag('infAdFisco', fisco) + tag('infCpl', complementar)
    );
  }
}
