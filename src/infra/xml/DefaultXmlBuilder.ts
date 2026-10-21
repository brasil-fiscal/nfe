import { createHash } from 'node:crypto';
import { XmlBuilder } from '@nfe/contracts/XmlBuilder';
import {
  NFeProps,
  NFeIdentificacao,
  NotaReferenciada,
  CompraGovernamentalProps,
  AutorizadoXml,
  ResponsavelTecnico
} from '@nfe/domain/entities/NFe';
import { EmitenteProps } from '@nfe/domain/entities/Emitente';
import { DestinatarioProps } from '@nfe/domain/entities/Destinatario';
import { EnderecoProps } from '@nfe/domain/entities/Endereco';
import { ProdutoProps } from '@nfe/domain/entities/Produto';
import { PagamentoProps } from '@nfe/domain/entities/Pagamento';
import { CobrancaProps } from '@nfe/domain/entities/Cobranca';
import { UF_CODES } from '@nfe/shared/constants/ibge-codes';
import { generateAccessKey, generateNumericCode } from '@nfe/shared/helpers/access-key';
import { tag, tagGroup, formatNumber, formatDate, formatDateOnly } from './xml-helper';
import {
  buildAvulsa,
  buildLocal,
  buildIntermediador,
  buildExportacao,
  buildCompra,
  buildCana,
  buildAgropecuario,
  buildInformacoesAdicionais,
  buildTransporte
} from './builders/nota-groups';
import {
  buildNve,
  buildCest,
  buildCreditosPresumidos,
  buildDeclaracoesImportacao,
  buildDetalhesExportacao,
  buildRastros,
  buildProdutoEspecifico,
  buildImpostoDevolvido,
  buildObservacaoItem,
  buildDFeReferenciado
} from './builders/produto-groups';
import { buildImpostos } from './builders/imposto-groups';
import { buildTotais } from './builders/total-groups';

const NFE_VERSION = '4.00';
const NFE_NAMESPACE = 'http://www.portalfiscal.inf.br/nfe';

export class DefaultXmlBuilder implements XmlBuilder {
  build(nfe: NFeProps): string {
    const uf = nfe.identificacao.uf;
    const cUF = UF_CODES[uf] || uf;
    const dataEmissao = nfe.identificacao.dataEmissao ?? new Date();
    const tipoEmissao = nfe.identificacao.tipoEmissao ?? 1;
    const codigoNumerico = generateNumericCode();
    const modelo = nfe.identificacao.modelo ?? '55';

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
    const total = buildTotais(nfe);
    const transp = buildTransporte(nfe.transporte);
    const cobr = this.buildCobranca(nfe.cobranca);
    const pag = this.buildPagamento(nfe.pagamento);
    const infAdic = buildInformacoesAdicionais({
      complementar: nfe.informacoesComplementares,
      fisco: nfe.informacoesFisco,
      observacoesContribuinte: nfe.observacoesContribuinte,
      observacoesFisco: nfe.observacoesFisco,
      processosReferenciados: nfe.processosReferenciados
    });

    const autXml = this.buildAutXml(nfe.autorizadosXml);
    const infRespTec = this.buildInfRespTec(nfe.responsavelTecnico, chaveAcesso);

    const infNFe =
      `<infNFe versao="${NFE_VERSION}" Id="NFe${chaveAcesso}">` +
      ide +
      emit +
      buildAvulsa(nfe.avulsa) +
      dest +
      buildLocal('retirada', nfe.retirada) +
      buildLocal('entrega', nfe.entrega) +
      autXml +
      det +
      total +
      transp +
      cobr +
      pag +
      buildIntermediador(nfe.intermediador) +
      infAdic +
      buildExportacao(nfe.exportacao) +
      buildCompra(nfe.compra) +
      buildCana(nfe.cana) +
      infRespTec +
      (nfe.solicitacaoNFF ? tagGroup('infSolicNFF', tag('xSolic', nfe.solicitacaoNFF)) : '') +
      buildAgropecuario(nfe.agropecuario) +
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
        tag('dhSaiEnt', id.dataSaidaEntrada ? formatDate(id.dataSaidaEntrada) : undefined) +
        tag(
          'dPrevEntrega',
          id.dataPrevistaEntrega ? formatDateOnly(id.dataPrevistaEntrega) : undefined
        ) +
        tag('tpNF', String(id.tipoOperacao)) +
        tag('idDest', String(id.destinoOperacao)) +
        tag('cMunFG', id.municipio) +
        tag('cMunFGIBS', id.municipioFatoGeradorIbs) +
        tag('tpImp', String(tipoImpressao)) +
        tag('tpEmis', String(tipoEmissao)) +
        tag('cDV', cDV) +
        tag('tpAmb', tpAmb) +
        tag('finNFe', String(id.finalidade)) +
        tag('tpNFDebito', id.tipoNotaDebito) +
        tag('tpNFCredito', id.tipoNotaCredito) +
        tag('indFinal', String(id.consumidorFinal)) +
        tag('indPres', String(id.presencaComprador)) +
        tag('indIntermed', String(id.indicadorIntermediador ?? 0)) +
        tag('procEmi', '0') +
        tag('verProc', 'brasil-fiscal-nfe') +
        this.buildContingencia(id) +
        this.buildNFref(id.notasReferenciadas) +
        this.buildCompraGovernamental(id.compraGovernamental) +
        this.buildPagAntecipado(id.pagamentosAntecipados)
    );
  }

  /**
   * Entrada em contingencia (dhCont + xJust). Sequencia opcional: os dois campos
   * andam juntos, e sao exigidos quando `tipoEmissao` indica contingencia.
   */
  private buildContingencia(id: NFeIdentificacao): string {
    if (!id.dataHoraContingencia || !id.justificativaContingencia) return '';

    return (
      tag('dhCont', formatDate(id.dataHoraContingencia)) +
      tag('xJust', id.justificativaContingencia)
    );
  }

  /**
   * Compra governamental (gCompraGov), com o redutor de IBS/CBS do ente publico.
   */
  private buildCompraGovernamental(compra?: CompraGovernamentalProps): string {
    if (!compra) return '';

    return tagGroup(
      'gCompraGov',
      tag('tpEnteGov', String(compra.tipoEnte)) +
        tag('pRedutor', formatNumber(compra.percentualRedutor, 4)) +
        tag('tpOperGov', String(compra.tipoOperacao))
    );
  }

  /**
   * NFe de antecipacao de pagamento liquidadas por esta nota (gPagAntecipado).
   * Fica depois do NFref, no fim do `ide`.
   */
  private buildPagAntecipado(chaves?: readonly string[]): string {
    if (!chaves || chaves.length === 0) return '';

    return tagGroup(
      'gPagAntecipado',
      chaves
        .slice(0, 99)
        .map((chave) => tag('refNFe', chave))
        .join('')
    );
  }

  /**
   * Documentos referenciados (grupo NFref). Fica no fim do `ide`, conforme a
   * sequencia do leiaute 4.00.
   */
  private buildNFref(refs?: readonly NotaReferenciada[]): string {
    if (!refs || refs.length === 0) return '';

    return refs
      .map((ref) => {
        switch (ref.tipo) {
          case 'nfe':
            return tagGroup('NFref', tag('refNFe', ref.chaveAcesso));

          case 'nfeSigilosa':
            return tagGroup('NFref', tag('refNFeSig', ref.chaveAcesso));

          case 'cte':
            return tagGroup('NFref', tag('refCTe', ref.chaveAcesso));

          case 'nf':
            return tagGroup(
              'NFref',
              tagGroup(
                'refNF',
                tag('cUF', UF_CODES[ref.uf] || ref.uf) +
                  tag('AAMM', ref.anoMes) +
                  tag('CNPJ', ref.cnpj) +
                  tag('mod', ref.modelo) +
                  tag('serie', String(ref.serie)) +
                  tag('nNF', String(ref.numero))
              )
            );

          case 'produtorRural':
            return tagGroup(
              'NFref',
              tagGroup(
                'refNFP',
                tag('cUF', UF_CODES[ref.uf] || ref.uf) +
                  tag('AAMM', ref.anoMes) +
                  (ref.cnpj ? tag('CNPJ', ref.cnpj) : tag('CPF', ref.cpf)) +
                  tag('IE', ref.inscricaoEstadual) +
                  tag('mod', ref.modelo) +
                  tag('serie', String(ref.serie)) +
                  tag('nNF', String(ref.numero))
              )
            );

          case 'ecf':
            return tagGroup(
              'NFref',
              tagGroup(
                'refECF',
                tag('mod', ref.modelo) +
                  tag('nECF', ref.numeroEcf) +
                  tag('nCOO', ref.numeroContadorOrdem)
              )
            );
        }
      })
      .join('');
  }

  /**
   * Pessoas autorizadas a baixar o XML (grupo autXML), limitado a 10 pelo leiaute.
   */
  private buildAutXml(autorizados?: readonly AutorizadoXml[]): string {
    if (!autorizados || autorizados.length === 0) return '';

    return autorizados
      .slice(0, 10)
      .map((aut) =>
        aut.cnpj
          ? tagGroup('autXML', tag('CNPJ', aut.cnpj))
          : tagGroup('autXML', tag('CPF', aut.cpf))
      )
      .join('');
  }

  /**
   * Responsavel tecnico (grupo infRespTec). Quando o CSRT e informado, o
   * `hashCSRT` e o SHA-1 de `CSRT + chave de acesso`, em base64.
   */
  private buildInfRespTec(resp: ResponsavelTecnico | undefined, chaveAcesso: string): string {
    if (!resp) return '';

    const csrt =
      resp.csrt && resp.idCSRT
        ? tag('idCSRT', resp.idCSRT) +
          tag(
            'hashCSRT',
            createHash('sha1')
              .update(resp.csrt + chaveAcesso, 'utf8')
              .digest('base64')
          )
        : '';

    return tagGroup(
      'infRespTec',
      tag('CNPJ', resp.cnpj) +
        tag('xContato', resp.contato) +
        tag('email', resp.email) +
        tag('fone', resp.telefone) +
        csrt
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
        tag('IEST', emit.inscricaoEstadualST) +
        tag('IM', emit.inscricaoMunicipal) +
        tag('CNAE', emit.cnae) +
        tag('CRT', String(emit.regimeTributario))
    );
  }

  private buildDestinatario(dest: DestinatarioProps | undefined, tpAmb: 1 | 2): string {
    if (!dest) return '';
    const doc = dest.cnpj
      ? tag('CNPJ', dest.cnpj)
      : dest.cpf
        ? tag('CPF', dest.cpf)
        : dest.idEstrangeiro
          ? tag('idEstrangeiro', dest.idEstrangeiro)
          : '';
    if (!doc) return '';
    const endereco = dest.endereco ? this.buildEndereco('enderDest', dest.endereco) : '';
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
        tag('ISUF', dest.inscricaoSuframa) +
        tag('IM', dest.inscricaoMunicipal) +
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
    // A ordem dos campos segue a sequencia do leiaute 4.00 — o XSD rejeita
    // qualquer elemento fora de posicao.
    const prodTag = tagGroup(
      'prod',
      tag('cProd', prod.codigo) +
        tag('cEAN', prod.ean || 'SEM GTIN') +
        tag('cBarra', prod.codigoBarras) +
        tag('xProd', prod.descricao) +
        tag('NCM', prod.ncm) +
        buildNve(prod.nve) +
        buildCest(prod) +
        tag('cBenef', prod.codigoBeneficioFiscal) +
        buildCreditosPresumidos(prod.creditosPresumidos) +
        tag('tpCredPresIBSZFM', prod.tipoCreditoPresumidoIbsZfm) +
        tag('EXTIPI', prod.extipi) +
        tag('CFOP', prod.cfop) +
        tag('uCom', prod.unidade) +
        tag('qCom', formatNumber(prod.quantidade, 4)) +
        tag('vUnCom', formatNumber(prod.valorUnitario, 10)) +
        tag('vProd', formatNumber(prod.valorTotal, 2)) +
        tag('cEANTrib', prod.eanTributavel || 'SEM GTIN') +
        tag('cBarraTrib', prod.codigoBarrasTributavel) +
        tag('uTrib', prod.unidade) +
        tag('qTrib', formatNumber(prod.quantidade, 4)) +
        tag('vUnTrib', formatNumber(prod.valorUnitario, 10)) +
        tag('vFrete', prod.valorFrete ? formatNumber(prod.valorFrete, 2) : undefined) +
        tag('vSeg', prod.valorSeguro ? formatNumber(prod.valorSeguro, 2) : undefined) +
        tag('vDesc', prod.valorDesconto ? formatNumber(prod.valorDesconto, 2) : undefined) +
        tag('vOutro', prod.outrasDespesas ? formatNumber(prod.outrasDespesas, 2) : undefined) +
        tag('indTot', '1') +
        tag('indBemMovelUsado', prod.bemMovelUsado ? '1' : undefined) +
        buildDeclaracoesImportacao(prod.declaracoesImportacao) +
        buildDetalhesExportacao(prod.detalhesExportacao) +
        tag('xPed', prod.pedido) +
        tag('nItemPed', prod.itemPedido !== undefined ? String(prod.itemPedido) : undefined) +
        tag('nFCI', prod.fci) +
        buildRastros(prod.rastros) +
        (prod.produtoNFF
          ? tagGroup(
              'infProdNFF',
              tag('cProdFisco', prod.produtoNFF.codigoFisco) +
                tag('cOperNFF', prod.produtoNFF.codigoOperacao)
            )
          : '') +
        (prod.embalagem
          ? tagGroup(
              'infProdEmb',
              tag('xEmb', prod.embalagem.identificacao) +
                tag('qVolEmb', formatNumber(prod.embalagem.volume, 3)) +
                tag('uEmb', prod.embalagem.unidade)
            )
          : '') +
        buildProdutoEspecifico(prod)
    );

    const imposto = buildImpostos(prod);

    return tagGroup(
      'det',
      prodTag +
        imposto +
        buildImpostoDevolvido(prod.impostoDevolvido) +
        tag('infAdProd', prod.informacoesAdicionais) +
        buildObservacaoItem(prod.observacaoItem) +
        tag('vItem', prod.valorItem !== undefined ? formatNumber(prod.valorItem, 2) : undefined) +
        buildDFeReferenciado(prod.dfeReferenciado),
      `nItem="${nItem}"`
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
        // Ordem exigida pelo leiaute: indPag, tPag, xPag, vPag, dPag,
        // (CNPJPag + UFPag), card.
        let content =
          tag('indPag', p.indicadorPagamento !== undefined ? String(p.indicadorPagamento) : undefined) +
          tag('tPag', p.formaPagamento) +
          tag('xPag', p.descricao) +
          tag('vPag', formatNumber(p.valor, 2)) +
          tag('dPag', p.dataPagamento ? formatDateOnly(p.dataPagamento) : undefined);

        // CNPJPag e UFPag formam uma sequencia opcional: ou os dois, ou nenhum.
        if (p.cnpjPagador && p.ufPagador) {
          content += tag('CNPJPag', p.cnpjPagador) + tag('UFPag', p.ufPagador);
        }

        if (p.tipoIntegracao !== undefined) {
          let cardContent = tag('tpIntegra', String(p.tipoIntegracao));
          if (p.cnpjCredenciadora) cardContent += tag('CNPJ', p.cnpjCredenciadora);
          if (p.bandeira) cardContent += tag('tBand', p.bandeira);
          if (p.autorizacao) cardContent += tag('cAut', p.autorizacao);
          if (p.cnpjRecebedor) cardContent += tag('CNPJReceb', p.cnpjRecebedor);
          if (p.idTerminalPagamento) cardContent += tag('idTermPag', p.idTerminalPagamento);
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

}
