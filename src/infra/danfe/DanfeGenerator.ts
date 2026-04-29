import { DanfeData } from './xml-parser';
import { encodeCode128C, getBarcodeWidth } from './barcode128';
import { NFeError } from '@nfe/shared/errors/NFeError';

interface PdfDoc {
  on(event: string, handler: (...args: never[]) => void): PdfDoc;
  end(): void;
  addPage(): PdfDoc;
  fontSize(size: number): PdfDoc;
  font(name: string): PdfDoc;
  fillColor(color: string): PdfDoc;
  lineWidth(width: number): PdfDoc;
  text(text: string, x: number, y: number, options?: Record<string, unknown>): PdfDoc;
  rect(x: number, y: number, w: number, h: number): PdfDoc;
  stroke(color: string): PdfDoc;
  fill(color: string): PdfDoc;
  moveTo(x: number, y: number): PdfDoc;
  lineTo(x: number, y: number): PdfDoc;
  dash(length: number, options?: Record<string, unknown>): PdfDoc;
  undash(): PdfDoc;
}

const M = 28;
const W = 595.28 - M * 2;
const PH = 841.89;
const F = 7;
const FS = 6;
const FL = 14;
const FT = 10;
const P = 3;
const RH = 22;
const LH = 10;
const LC = '#666666';

async function loadPdfKit(): Promise<new (options: Record<string, unknown>) => PdfDoc> {
  try {
    const mod = await import('pdfkit');
    return mod.default ?? mod;
  } catch {
    throw new NFeError('pdfkit nao esta instalado. Instale com: npm install pdfkit');
  }
}

export class DanfeGenerator {
  async generate(data: DanfeData): Promise<Buffer> {
    const PDFDocument = await loadPdfKit();
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: M, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      try {
        this.renderPage(doc, data);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private renderPage(doc: PdfDoc, d: DanfeData): void {
    let y = M;
    y = this.canhoto(doc, d, y);
    y = this.cabecalho(doc, d, y);
    y = this.naturezaProtocolo(doc, d, y);
    y = this.ieRow(doc, d, y);
    y = this.destinatario(doc, d, y);
    if (d.fatura) { y += 2; y = this.fatura(doc, d, y); }
    if (d.duplicatas && d.duplicatas.length > 0) { y += 2; y = this.duplicatas(doc, d, y); }
    if (d.pagamentos.length > 0) { y += 2; y = this.pagamento(doc, d, y); }
    y += 2; y = this.impostos(doc, d, y);
    y += 2; y = this.transportador(doc, d, y);
    y += 2; y = this.produtos(doc, d, y);
    y += 2; this.dadosAdicionais(doc, d, y);
  }

  // === CANHOTO ===
  private canhoto(doc: PdfDoc, d: DanfeData, y: number): number {
    const h = 55;
    this.box(doc, M, y, W * 0.82, h);
    doc.fontSize(FS).font('Helvetica');
    doc.text(
      `RECEBEMOS DE ${d.emitente.nome} OS PRODUTOS E/OU SERVICOS CONSTANTES DA NOTA FISCAL ELETRONICA INDICADA ABAIXO.`,
      M + P, y + P, { width: W * 0.82 - P * 2 }
    );
    doc.text(`EMISSAO: ${d.dataEmissao}  VALOR TOTAL: R$ ${this.fmtNum(d.totais.valorNfe, 2)}  DESTINATARIO: ${d.destinatario.nome}`,
      M + P, y + 20, { width: W * 0.82 - P * 2 }
    );

    const x2 = M + W * 0.82;
    this.box(doc, x2, y, W * 0.18, h);
    doc.fontSize(FT).font('Helvetica-Bold');
    doc.text('NF-e', x2, y + 4, { width: W * 0.18, align: 'center' });
    doc.fontSize(F).font('Helvetica-Bold');
    const numFmt = d.numero.padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    doc.text(`N. ${numFmt}`, x2, y + 20, { width: W * 0.18, align: 'center' });
    doc.text(`Serie ${d.serie.padStart(3, '0')}`, x2, y + 30, { width: W * 0.18, align: 'center' });

    y += h;
    const rh = 18;
    this.box(doc, M, y, W * 0.3, rh);
    this.label(doc, 'DATA DE RECEBIMENTO', M + P, y + P);
    this.box(doc, M + W * 0.3, y, W * 0.7, rh);
    this.label(doc, 'IDENTIFICACAO E ASSINATURA DO RECEBEDOR', M + W * 0.3 + P, y + P);
    y += rh;

    doc.dash(4, { space: 2 }).lineWidth(0.5);
    doc.moveTo(M, y + 4).lineTo(M + W, y + 4).stroke('#000000');
    doc.undash();

    return y + 10;
  }

  // === CABECALHO ===
  private cabecalho(doc: PdfDoc, d: DanfeData, y: number): number {
    const h = 90;
    const c1 = W * 0.35, c2 = W * 0.25, c3 = W * 0.40;

    // Col 1: Emitente
    this.box(doc, M, y, c1, h);
    doc.fontSize(FS).font('Helvetica').fillColor(LC);
    doc.text('IDENTIFICACAO DO EMITENTE', M + P, y + P, { width: c1 - P * 2 });
    doc.fillColor('#000000');
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text(d.emitente.nome, M + P, y + 14, { width: c1 - P * 2 });
    doc.fontSize(F).font('Helvetica');
    const emitEnder = [
      d.emitente.fantasia ?? d.emitente.nome,
      d.emitente.endereco,
      d.emitente.bairro,
      `${d.emitente.cidade} - ${d.emitente.uf} - ${this.fmtCep(d.emitente.cep)}`,
      d.emitente.fone ? `Fone/Fax: ${d.emitente.fone}` : ''
    ].filter(Boolean).join('\n');
    doc.text(emitEnder, M + P, y + 28, { width: c1 - P * 2 });

    // Col 2: DANFE
    const x2 = M + c1;
    this.box(doc, x2, y, c2, h);
    doc.fontSize(FL).font('Helvetica-Bold');
    doc.text('DANFE', x2, y + 6, { width: c2, align: 'center' });
    doc.fontSize(FS).font('Helvetica');
    doc.text('Documento Auxiliar da Nota\nFiscal Eletronica', x2, y + 22, { width: c2, align: 'center' });

    doc.fontSize(F).font('Helvetica');
    const isEntrada = d.tipoOperacao === 'ENTRADA';
    doc.text('0 - ENTRADA', x2 + 8, y + 42, {});
    doc.text('1 - SAIDA', x2 + 8, y + 52, {});
    const boxY = isEntrada ? y + 42 : y + 52;
    doc.rect(x2 + c2 - 25, boxY - 1, 14, 10).stroke('#000000');
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text(isEntrada ? '0' : '1', x2 + c2 - 25, boxY, { width: 14, align: 'center' });

    doc.fontSize(F).font('Helvetica-Bold');
    doc.text(`N. ${numFmt(d.numero)}`, x2, y + 66, { width: c2, align: 'center' });
    doc.text(`Serie ${d.serie.padStart(3, '0')}`, x2, y + 76, { width: c2, align: 'center' });
    doc.fontSize(FS).font('Helvetica');
    doc.text('Folha 1/1', x2, y + 84, { width: c2, align: 'center' });

    // Col 3: Barcode + Chave
    const x3 = M + c1 + c2;
    this.box(doc, x3, y, c3, h);
    this.renderBarcode(doc, d.chaveAcesso, x3 + 10, y + 6, c3 - 20, 28);

    doc.fontSize(FS).font('Helvetica-Bold');
    doc.text('CHAVE DE ACESSO', x3 + P, y + 38, {});
    doc.fontSize(F).font('Helvetica');
    const chave = d.chaveAcesso.replace(/(\d{4})/g, '$1 ').trim();
    doc.text(chave, x3 + P, y + 48, { width: c3 - P * 2 });

    doc.fontSize(FS).font('Helvetica');
    doc.text('Consulta de autenticidade no portal nacional da NF-e', x3 + P, y + 62, { width: c3 - P * 2 });
    doc.text('www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora', x3 + P, y + 72, { width: c3 - P * 2 });

    return y + h;
  }

  // === NATUREZA + PROTOCOLO ===
  private naturezaProtocolo(doc: PdfDoc, d: DanfeData, y: number): number {
    const c1 = W * 0.55, c2 = W * 0.45;
    this.box(doc, M, y, c1, RH);
    this.label(doc, 'NATUREZA DA OPERACAO', M + P, y + P);
    this.val(doc, d.naturezaOperacao, M + P, y + 12, c1 - P * 2, true);

    this.box(doc, M + c1, y, c2, RH);
    this.label(doc, 'PROTOCOLO DE AUTORIZACAO DE USO', M + c1 + P, y + P);
    this.val(doc, `${d.protocolo} - ${d.dataAutorizacao}`, M + c1 + P, y + 12, c2 - P * 2);

    return y + RH;
  }

  // === IE / IM / IE ST / CNPJ ===
  private ieRow(doc: PdfDoc, d: DanfeData, y: number): number {
    const cw = [W * 0.25, W * 0.25, W * 0.25, W * 0.25];
    let x = M;

    this.box(doc, x, y, cw[0], RH);
    this.label(doc, 'INSCRICAO ESTADUAL', x + P, y + P);
    this.val(doc, d.emitente.ie, x + P, y + 12);
    x += cw[0];

    this.box(doc, x, y, cw[1], RH);
    this.label(doc, 'INSCRICAO MUNICIPAL', x + P, y + P);
    this.val(doc, d.emitente.im ?? '', x + P, y + 12);
    x += cw[1];

    this.box(doc, x, y, cw[2], RH);
    this.label(doc, 'INSCRICAO ESTADUAL DO SUBST. TRIBUT.', x + P, y + P);
    this.val(doc, d.emitente.ieSt ?? '', x + P, y + 12);
    x += cw[2];

    this.box(doc, x, y, cw[3], RH);
    this.label(doc, 'CNPJ / CPF', x + P, y + P);
    this.val(doc, this.fmtDoc(d.emitente.cnpj), x + P, y + 12);

    return y + RH;
  }

  // === DESTINATARIO ===
  private destinatario(doc: PdfDoc, d: DanfeData, y: number): number {
    this.sectionTitle(doc, 'DESTINATARIO / REMETENTE', y);
    y += 10;

    // Linha 1
    const r1 = [W * 0.50, W * 0.25, W * 0.25];
    let x = M;
    this.box(doc, x, y, r1[0], RH);
    this.label(doc, 'NOME / RAZAO SOCIAL', x + P, y + P);
    this.val(doc, d.destinatario.nome, x + P, y + 12, r1[0] - P * 2);
    x += r1[0];

    this.box(doc, x, y, r1[1], RH);
    this.label(doc, 'CNPJ / CPF', x + P, y + P);
    this.val(doc, this.fmtDoc(d.destinatario.cnpjCpf), x + P, y + 12);
    x += r1[1];

    this.box(doc, x, y, r1[2], RH);
    this.label(doc, 'DATA DA EMISSAO', x + P, y + P);
    this.val(doc, d.dataEmissao.split(' ')[0] ?? d.dataEmissao, x + P, y + 12);
    y += RH;

    // Linha 2
    const r2 = [W * 0.40, W * 0.25, W * 0.15, W * 0.20];
    x = M;
    this.box(doc, x, y, r2[0], RH);
    this.label(doc, 'ENDERECO', x + P, y + P);
    this.val(doc, d.destinatario.endereco, x + P, y + 12, r2[0] - P * 2);
    x += r2[0];

    this.box(doc, x, y, r2[1], RH);
    this.label(doc, 'BAIRRO / DISTRITO', x + P, y + P);
    this.val(doc, d.destinatario.bairro, x + P, y + 12);
    x += r2[1];

    this.box(doc, x, y, r2[2], RH);
    this.label(doc, 'CEP', x + P, y + P);
    this.val(doc, this.fmtCep(d.destinatario.cep), x + P, y + 12);
    x += r2[2];

    this.box(doc, x, y, r2[3], RH);
    this.label(doc, 'DATA DA SAIDA/ENTRADA', x + P, y + P);
    this.val(doc, d.dataSaida?.split(' ')[0] ?? '', x + P, y + 12);
    y += RH;

    // Linha 3
    const r3 = [W * 0.30, W * 0.08, W * 0.22, W * 0.20, W * 0.20];
    x = M;
    this.box(doc, x, y, r3[0], RH);
    this.label(doc, 'MUNICIPIO', x + P, y + P);
    this.val(doc, d.destinatario.cidade, x + P, y + 12);
    x += r3[0];

    this.box(doc, x, y, r3[1], RH);
    this.label(doc, 'UF', x + P, y + P);
    this.val(doc, d.destinatario.uf, x + P, y + 12);
    x += r3[1];

    this.box(doc, x, y, r3[2], RH);
    this.label(doc, 'FONE / FAX', x + P, y + P);
    this.val(doc, d.destinatario.fone ?? '', x + P, y + 12);
    x += r3[2];

    this.box(doc, x, y, r3[3], RH);
    this.label(doc, 'INSCRICAO ESTADUAL', x + P, y + P);
    this.val(doc, d.destinatario.ie ?? '', x + P, y + 12);
    x += r3[3];

    this.box(doc, x, y, r3[4], RH);
    this.label(doc, 'HORA DA SAIDA/ENTRADA', x + P, y + P);
    const horaSaida = d.dataSaida ? d.dataSaida.split(' ')[1] ?? '' : '';
    this.val(doc, horaSaida, x + P, y + 12);

    return y + RH;
  }

  // === FATURA ===
  private fatura(doc: PdfDoc, d: DanfeData, y: number): number {
    if (!d.fatura) return y;
    this.sectionTitle(doc, 'FATURA', y);
    y += 10;

    const cw = [W * 0.05, W * 0.25, W * 0.25, W * 0.20, W * 0.25];
    let x = M;

    this.box(doc, M, y, W, RH + 8);
    this.label(doc, 'DADOS DA FATURA', M + P, y + P);
    y += 8;

    x = M;
    this.label(doc, 'NUMERO', x + P + cw[0], y + P);
    this.val(doc, d.fatura.numero, x + P + cw[0], y + 12, cw[1] - P * 2, true);
    x += cw[0] + cw[1];

    this.label(doc, 'VALOR ORIGINAL', x + P, y + P);
    this.valRight(doc, this.fmtNum(d.fatura.valorOriginal, 2), x + P, y + 12, cw[2] - P * 2);
    x += cw[2];

    this.label(doc, 'VALOR DESCONTO', x + P, y + P);
    this.valRight(doc, this.fmtNum(d.fatura.valorDesconto, 2), x + P, y + 12, cw[3] - P * 2);
    x += cw[3];

    this.label(doc, 'VALOR LIQUIDO', x + P, y + P);
    this.valRight(doc, this.fmtNum(d.fatura.valorLiquido, 2), x + P, y + 12, cw[4] - P * 2);

    return y + RH;
  }

  // === DUPLICATAS ===
  private duplicatas(doc: PdfDoc, d: DanfeData, y: number): number {
    if (!d.duplicatas || d.duplicatas.length === 0) return y;
    this.sectionTitle(doc, 'DUPLICATAS', y);
    y += 10;

    this.box(doc, M, y, W, RH);
    doc.fontSize(FS).font('Helvetica');
    let x = M + P;
    for (const dup of d.duplicatas) {
      const txt = `Num. ${dup.numero}  Venc. ${dup.vencimento}  Valor R$ ${this.fmtNum(dup.valor, 2)}`;
      doc.text(txt, x, y + 4, { width: W / 3 - P * 2 });
      x += W / 3;
      if (x > M + W - 50) break;
    }

    return y + RH;
  }

  // === PAGAMENTO ===
  private pagamento(doc: PdfDoc, d: DanfeData, y: number): number {
    this.sectionTitle(doc, 'PAGAMENTO', y);
    y += 10;

    this.box(doc, M, y, W, RH);
    doc.fontSize(FS).font('Helvetica');
    let x = M + P;
    const colW = W / Math.min(d.pagamentos.length, 4);
    for (const pg of d.pagamentos) {
      doc.text(`Forma`, x, y + P, {});
      doc.font('Helvetica-Bold').text(pg.forma, x + 30, y + P, {});
      doc.font('Helvetica').text(`Valor`, x, y + P + 8, {});
      doc.font('Helvetica-Bold').text(`R$ ${this.fmtNum(pg.valor, 2)}`, x + 30, y + P + 8, {});
      x += colW;
    }

    return y + RH;
  }

  // === CALCULO DO IMPOSTO ===
  private impostos(doc: PdfDoc, d: DanfeData, y: number): number {
    this.sectionTitle(doc, 'CALCULO DO IMPOSTO', y);
    y += 10;

    const t = d.totais;
    const c6 = W / 6;

    // Linha 1
    const row1: [string, string][] = [
      ['BASE DE CALC. DO ICMS', t.bcIcms],
      ['VALOR DO ICMS', t.valorIcms],
      ['BASE DE CALC. ICMS S.T.', t.bcIcmsSt],
      ['VALOR DO ICMS SUBST.', t.valorIcmsSt],
      ['V. IMP. IMPORTACAO', t.valorImportacao],
      ['V. TOTAL PRODUTOS', t.valorProdutos]
    ];
    this.fieldRow(doc, row1, y, c6, RH);
    y += RH;

    // Linha 2
    const row2: [string, string][] = [
      ['VALOR DO FRETE', t.valorFrete],
      ['VALOR DO SEGURO', t.valorSeguro],
      ['DESCONTO', t.desconto],
      ['OUTRAS DESPESAS', t.outrasDespesas],
      ['VALOR TOTAL IPI', t.valorIpi],
      ['V. TOTAL DA NOTA', t.valorNfe]
    ];
    this.fieldRow(doc, row2, y, c6, RH);

    return y + RH;
  }

  // === TRANSPORTADOR ===
  private transportador(doc: PdfDoc, d: DanfeData, y: number): number {
    this.sectionTitle(doc, 'TRANSPORTADOR / VOLUMES TRANSPORTADOS', y);
    y += 10;
    const t = d.transporte;

    // Linha 1
    const r1 = [W * 0.30, W * 0.15, W * 0.12, W * 0.15, W * 0.08, W * 0.20];
    let x = M;
    this.box(doc, x, y, r1[0], RH);
    this.label(doc, 'NOME / RAZAO SOCIAL', x + P, y + P);
    this.val(doc, t.nome ?? '', x + P, y + 12, r1[0] - P * 2);
    x += r1[0];

    this.box(doc, x, y, r1[1], RH);
    this.label(doc, 'FRETE', x + P, y + P);
    doc.fontSize(FS).font('Helvetica-Bold').fillColor('#000000');
    doc.text(t.freteTexto, x + P, y + 12, { width: r1[1] - P * 2, lineBreak: false });
    x += r1[1];

    this.box(doc, x, y, r1[2], RH);
    this.label(doc, 'CODIGO ANTT', x + P, y + P);
    this.val(doc, t.codigoAntt ?? '', x + P, y + 12);
    x += r1[2];

    this.box(doc, x, y, r1[3], RH);
    this.label(doc, 'PLACA DO VEICULO', x + P, y + P);
    this.val(doc, t.placa ?? '', x + P, y + 12);
    x += r1[3];

    this.box(doc, x, y, r1[4], RH);
    this.label(doc, 'UF', x + P, y + P);
    this.val(doc, t.ufVeiculo ?? '', x + P, y + 12);
    x += r1[4];

    this.box(doc, x, y, r1[5], RH);
    this.label(doc, 'CNPJ / CPF', x + P, y + P);
    this.val(doc, t.cnpjCpf ? this.fmtDoc(t.cnpjCpf) : '', x + P, y + 12);
    y += RH;

    // Linha 2
    const r2 = [W * 0.45, W * 0.27, W * 0.08, W * 0.20];
    x = M;
    this.box(doc, x, y, r2[0], RH);
    this.label(doc, 'ENDERECO', x + P, y + P);
    this.val(doc, t.endereco ?? '', x + P, y + 12, r2[0] - P * 2);
    x += r2[0];

    this.box(doc, x, y, r2[1], RH);
    this.label(doc, 'MUNICIPIO', x + P, y + P);
    this.val(doc, t.cidade ?? '', x + P, y + 12);
    x += r2[1];

    this.box(doc, x, y, r2[2], RH);
    this.label(doc, 'UF', x + P, y + P);
    this.val(doc, t.uf ?? '', x + P, y + 12);
    x += r2[2];

    this.box(doc, x, y, r2[3], RH);
    this.label(doc, 'INSCRICAO ESTADUAL', x + P, y + P);
    this.val(doc, t.ie ?? '', x + P, y + 12);
    y += RH;

    // Linha 3 - Volumes
    const r3 = [W * 0.12, W * 0.18, W * 0.18, W * 0.12, W * 0.20, W * 0.20];
    x = M;
    this.box(doc, x, y, r3[0], RH);
    this.label(doc, 'QUANTIDADE', x + P, y + P);
    this.val(doc, t.quantidade ?? '', x + P, y + 12);
    x += r3[0];

    this.box(doc, x, y, r3[1], RH);
    this.label(doc, 'ESPECIE', x + P, y + P);
    this.val(doc, t.especie ?? '', x + P, y + 12);
    x += r3[1];

    this.box(doc, x, y, r3[2], RH);
    this.label(doc, 'MARCA', x + P, y + P);
    this.val(doc, t.marca ?? '', x + P, y + 12);
    x += r3[2];

    this.box(doc, x, y, r3[3], RH);
    this.label(doc, 'NUMERACAO', x + P, y + P);
    this.val(doc, t.numeracao ?? '', x + P, y + 12);
    x += r3[3];

    this.box(doc, x, y, r3[4], RH);
    this.label(doc, 'PESO BRUTO', x + P, y + P);
    this.val(doc, t.pesoBruto ?? '', x + P, y + 12);
    x += r3[4];

    this.box(doc, x, y, r3[5], RH);
    this.label(doc, 'PESO LIQUIDO', x + P, y + P);
    this.val(doc, t.pesoLiquido ?? '', x + P, y + 12);

    return y + RH;
  }

  // === PRODUTOS ===
  private produtos(doc: PdfDoc, d: DanfeData, y: number): number {
    this.sectionTitle(doc, 'DADOS DOS PRODUTOS / SERVICOS', y);
    y += 10;

    const cols = [
      { label: 'CODIGO\nPRODUTO', width: 42 },
      { label: 'DESCRICAO DO PRODUTO / SERVICO', width: 130 },
      { label: 'NCM/SH', width: 38 },
      { label: 'O/CSOSN', width: 32 },
      { label: 'CFOP', width: 25 },
      { label: 'UN', width: 20 },
      { label: 'QUANT', width: 40 },
      { label: 'VALOR\nUNIT', width: 38 },
      { label: 'VALOR\nTOTAL', width: 38 },
      { label: 'VALOR\nDESC', width: 32 },
      { label: 'B.CALC\nICMS', width: 36 },
      { label: 'VALOR\nICMS', width: 32 },
      { label: 'VALOR\nIPI', width: 32 },
      { label: 'ALIQ.\nICMS', width: 28 },
      { label: 'ALIQ.\nIPI', width: 26 }
    ];

    const totalW = cols.reduce((s, c) => s + c.width, 0);
    const scale = W / totalW;
    for (const c of cols) c.width *= scale;

    // Header
    const hh = 18;
    this.box(doc, M, y, W, hh);
    doc.fontSize(FS).font('Helvetica-Bold').fillColor('#000000');
    let cx = M;
    for (const c of cols) {
      doc.text(c.label, cx + 1, y + 2, { width: c.width - 2, align: 'center' });
      cx += c.width;
    }
    y += hh;

    // Rows
    doc.font('Helvetica').fontSize(FS);
    for (const prod of d.produtos) {
      if (y + LH > PH - M - 80) {
        doc.addPage();
        y = M;
      }

      this.box(doc, M, y, W, LH);
      cx = M;
      const vals = [
        prod.codigo,
        this.trunc(prod.descricao, cols[1].width - 4, FS),
        prod.ncm,
        prod.origemCsosn,
        prod.cfop,
        prod.unidade,
        this.fmtNum(prod.quantidade, 4),
        this.fmtNum(prod.valorUnitario, 2),
        this.fmtNum(prod.valorTotal, 2),
        this.fmtNum(prod.valorDesconto, 2),
        this.fmtNum(prod.bcIcms, 2),
        this.fmtNum(prod.valorIcms, 2),
        this.fmtNum(prod.valorIpi, 2),
        this.fmtNum(prod.aliqIcms, 2),
        this.fmtNum(prod.aliqIpi, 2)
      ];

      for (let i = 0; i < cols.length; i++) {
        const align = i <= 1 ? 'left' : 'right';
        doc.text(vals[i], cx + 2, y + 2, {
          width: cols[i].width - 4, align, lineBreak: false, ellipsis: true, height: LH - 2
        });
        cx += cols[i].width;
      }
      y += LH;
    }

    return y;
  }

  // === DADOS ADICIONAIS ===
  private dadosAdicionais(doc: PdfDoc, d: DanfeData, y: number): void {
    this.sectionTitle(doc, 'DADOS ADICIONAIS', y);
    y += 10;

    const h = 55;
    const c1 = W * 0.60, c2 = W * 0.40;

    this.box(doc, M, y, c1, h);
    this.label(doc, 'INFORMACOES COMPLEMENTARES', M + P, y + P);
    doc.fontSize(FS).font('Helvetica');
    doc.text(d.informacoesComplementares ?? '', M + P, y + 12, { width: c1 - P * 2, height: h - 14 });

    this.box(doc, M + c1, y, c2, h);
    this.label(doc, 'RESERVADO AO FISCO', M + c1 + P, y + P);
    doc.fontSize(FS).font('Helvetica');
    doc.text(d.informacoesFisco ?? '', M + c1 + P, y + 12, { width: c2 - P * 2, height: h - 14 });
  }

  // === BARCODE ===
  private renderBarcode(doc: PdfDoc, chave: string, x: number, y: number, maxW: number, h: number): void {
    try {
      const bars = encodeCode128C(chave);
      const totalW = getBarcodeWidth(bars);
      const s = maxW / totalW;
      for (const bar of bars) {
        if (bar.isBar) doc.rect(x + bar.x * s, y, bar.width * s, h).fill('black');
      }
    } catch {
      doc.fontSize(FS).font('Helvetica');
      doc.text('CODIGO DE BARRAS INDISPONIVEL', x, y + h / 2, { width: maxW, align: 'center' });
    }
  }

  // === HELPERS ===
  private box(doc: PdfDoc, x: number, y: number, w: number, h: number): void {
    doc.lineWidth(0.5).rect(x, y, w, h).stroke('#000000');
  }

  private sectionTitle(doc: PdfDoc, title: string, y: number): void {
    doc.rect(M, y, W, 10).fill('#E0E0E0');
    doc.fontSize(FS).font('Helvetica-Bold').fillColor('#000000');
    doc.text(title, M + P, y + 2, { width: W });
  }

  private label(doc: PdfDoc, text: string, x: number, y: number): void {
    doc.fontSize(FS).font('Helvetica').fillColor(LC);
    doc.text(text, x, y, { lineBreak: false });
    doc.fillColor('#000000');
  }

  private val(doc: PdfDoc, text: string, x: number, y: number, w?: number, bold?: boolean): void {
    doc.fontSize(F).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#000000');
    doc.text(text, x, y, w ? { width: w, lineBreak: false } : { lineBreak: false });
  }

  private valRight(doc: PdfDoc, text: string, x: number, y: number, w: number): void {
    doc.fontSize(F).font('Helvetica-Bold').fillColor('#000000');
    doc.text(text, x, y, { width: w, align: 'right' });
  }

  private fieldRow(doc: PdfDoc, fields: [string, string][], y: number, colW: number, h: number): void {
    for (let i = 0; i < fields.length; i++) {
      const x = M + colW * i;
      this.box(doc, x, y, colW, h);
      this.label(doc, fields[i][0], x + P, y + P);
      doc.fontSize(F).font('Helvetica-Bold').fillColor('#000000');
      doc.text(this.fmtNum(fields[i][1], 2), x + P, y + 12, { width: colW - P * 2, align: 'right' });
    }
  }

  private fmtDoc(doc: string): string {
    if (doc.length === 14) return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    if (doc.length === 11) return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return doc;
  }

  private fmtCep(cep: string): string {
    if (cep.length === 8) return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    return cep;
  }

  private fmtNum(value: string, decimals: number): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  private trunc(text: string, maxW: number, fontSize: number): string {
    const maxChars = Math.floor(maxW / (fontSize * 0.48));
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars - 3) + '...';
  }
}

function numFmt(n: string): string {
  return n.padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
}
