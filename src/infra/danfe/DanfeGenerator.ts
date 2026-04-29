import { DanfeData } from './xml-parser';
import { encodeCode128C, getBarcodeWidth } from './barcode128';
import { NFeError } from '@nfe/shared/errors/NFeError';

/**
 * Interface minima do PDFDocument do pdfkit que usamos.
 * Evita depender dos tipos do pdfkit em compile-time.
 */
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
}

const PAGE_HEIGHT = 841.89;
const MARGIN = 28;
const CONTENT_WIDTH = 595.28 - MARGIN * 2;
const FONT_SIZE = 7;
const FONT_SIZE_SMALL = 6;
const FONT_SIZE_TITLE = 10;
const FONT_SIZE_LARGE = 14;
const LINE_HEIGHT = 10;
const BOX_PADDING = 3;
const LABEL_COLOR = '#666666';

async function loadPdfKit(): Promise<new (options: Record<string, unknown>) => PdfDoc> {
  try {
    const mod = await import('pdfkit');
    return mod.default ?? mod;
  } catch {
    throw new NFeError(
      'pdfkit nao esta instalado. Instale com: npm install pdfkit'
    );
  }
}

export class DanfeGenerator {
  async generate(data: DanfeData): Promise<Buffer> {
    const PDFDocument = await loadPdfKit();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: MARGIN,
        bufferPages: true
      });

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

  private renderPage(doc: PdfDoc, data: DanfeData): void {
    let y = MARGIN;

    y = this.renderCabecalho(doc, data, y);
    y = this.renderNaturezaProtocolo(doc, data, y);
    y = this.renderEmitente(doc, data, y);
    y = this.renderDestinatario(doc, data, y);
    y = this.renderProdutos(doc, data, y);
    y = this.renderTotais(doc, data, y);
    y = this.renderTransporte(doc, data, y);
    this.renderInformacoesComplementares(doc, data, y);
  }

  private renderCabecalho(doc: PdfDoc, data: DanfeData, y: number): number {
    const boxHeight = 80;
    const col1Width = CONTENT_WIDTH * 0.4;
    const col2Width = CONTENT_WIDTH * 0.2;
    const col3Width = CONTENT_WIDTH * 0.4;

    this.drawBox(doc, MARGIN, y, col1Width, boxHeight);
    doc.fontSize(FONT_SIZE_TITLE).font('Helvetica-Bold');
    doc.text(data.emitente.nome, MARGIN + BOX_PADDING, y + BOX_PADDING, {
      width: col1Width - BOX_PADDING * 2
    });
    doc.fontSize(FONT_SIZE).font('Helvetica');
    const enderEmit = [
      data.emitente.endereco,
      `${data.emitente.bairro} - ${data.emitente.cidade}/${data.emitente.uf}`,
      `CEP: ${data.emitente.cep}${data.emitente.fone ? ' - Fone: ' + data.emitente.fone : ''}`
    ].join('\n');
    doc.text(enderEmit, MARGIN + BOX_PADDING, y + 25, {
      width: col1Width - BOX_PADDING * 2
    });

    const x2 = MARGIN + col1Width;
    this.drawBox(doc, x2, y, col2Width, boxHeight);
    doc.fontSize(FONT_SIZE_LARGE).font('Helvetica-Bold');
    doc.text('DANFE', x2, y + 8, { width: col2Width, align: 'center' });
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text('Documento Auxiliar da\nNota Fiscal Eletronica', x2, y + 28, {
      width: col2Width,
      align: 'center'
    });
    doc.fontSize(FONT_SIZE).font('Helvetica-Bold');
    const tipoOp = data.tipoOperacao === 'ENTRADA' ? '0 - ENTRADA' : '1 - SAIDA';
    doc.text(tipoOp, x2, y + 55, { width: col2Width, align: 'center' });
    doc.text(`N. ${data.numero}\nSerie ${data.serie}`, x2, y + 65, {
      width: col2Width,
      align: 'center'
    });

    const x3 = MARGIN + col1Width + col2Width;
    this.drawBox(doc, x3, y, col3Width, boxHeight);
    this.renderBarcode(doc, data.chaveAcesso, x3 + 10, y + 8, col3Width - 20, 30);

    doc.fontSize(FONT_SIZE_SMALL).font('Helvetica');
    this.drawLabel(doc, 'CHAVE DE ACESSO', x3 + BOX_PADDING, y + 42);
    doc.fontSize(FONT_SIZE).font('Helvetica-Bold');
    const chaveFormatada = data.chaveAcesso.replace(/(\d{4})/g, '$1 ').trim();
    doc.text(chaveFormatada, x3 + BOX_PADDING, y + 52, {
      width: col3Width - BOX_PADDING * 2
    });

    return y + boxHeight;
  }

  private renderNaturezaProtocolo(doc: PdfDoc, data: DanfeData, y: number): number {
    const boxHeight = 25;
    const col1Width = CONTENT_WIDTH * 0.6;
    const col2Width = CONTENT_WIDTH * 0.4;

    this.drawBox(doc, MARGIN, y, col1Width, boxHeight);
    this.drawLabel(doc, 'NATUREZA DA OPERACAO', MARGIN + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.naturezaOperacao, MARGIN + BOX_PADDING, y + 14, {});

    const x2 = MARGIN + col1Width;
    this.drawBox(doc, x2, y, col2Width, boxHeight);
    this.drawLabel(doc, 'PROTOCOLO DE AUTORIZACAO', x2 + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(`${data.protocolo} - ${data.dataAutorizacao}`, x2 + BOX_PADDING, y + 14, {
      width: col2Width - BOX_PADDING * 2
    });

    return y + boxHeight;
  }

  private renderEmitente(doc: PdfDoc, data: DanfeData, y: number): number {
    const boxHeight = 25;

    this.drawSectionTitle(doc, 'EMITENTE', MARGIN, y, CONTENT_WIDTH);
    y += 12;

    const cw = [CONTENT_WIDTH * 0.35, CONTENT_WIDTH * 0.25, CONTENT_WIDTH * 0.2, CONTENT_WIDTH * 0.2];

    this.drawBox(doc, MARGIN, y, cw[0], boxHeight);
    this.drawLabel(doc, 'CNPJ', MARGIN + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(this.formatCnpj(data.emitente.cnpj), MARGIN + BOX_PADDING, y + 14, {});

    let x = MARGIN + cw[0];
    this.drawBox(doc, x, y, cw[1], boxHeight);
    this.drawLabel(doc, 'INSCRICAO ESTADUAL', x + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.emitente.ie, x + BOX_PADDING, y + 14, {});

    x += cw[1];
    this.drawBox(doc, x, y, cw[2], boxHeight);
    this.drawLabel(doc, 'DATA EMISSAO', x + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.dataEmissao, x + BOX_PADDING, y + 14, {});

    x += cw[2];
    this.drawBox(doc, x, y, cw[3], boxHeight);
    this.drawLabel(doc, 'DATA SAIDA/ENTRADA', x + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.dataSaida ?? '', x + BOX_PADDING, y + 14, {});

    return y + boxHeight;
  }

  private renderDestinatario(doc: PdfDoc, data: DanfeData, y: number): number {
    const boxHeight = 25;

    this.drawSectionTitle(doc, 'DESTINATARIO/REMETENTE', MARGIN, y, CONTENT_WIDTH);
    y += 12;

    const cw = [CONTENT_WIDTH * 0.45, CONTENT_WIDTH * 0.25, CONTENT_WIDTH * 0.15, CONTENT_WIDTH * 0.15];

    this.drawBox(doc, MARGIN, y, cw[0], boxHeight);
    this.drawLabel(doc, 'NOME/RAZAO SOCIAL', MARGIN + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.destinatario.nome, MARGIN + BOX_PADDING, y + 14, {
      width: cw[0] - BOX_PADDING * 2
    });

    let x = MARGIN + cw[0];
    this.drawBox(doc, x, y, cw[1], boxHeight);
    this.drawLabel(doc, 'CNPJ/CPF', x + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    const cnpjCpf = data.destinatario.cnpjCpf.length === 14
      ? this.formatCnpj(data.destinatario.cnpjCpf)
      : this.formatCpf(data.destinatario.cnpjCpf);
    doc.text(cnpjCpf, x + BOX_PADDING, y + 14, {});

    x += cw[1];
    this.drawBox(doc, x, y, cw[2], boxHeight);
    this.drawLabel(doc, 'IE', x + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.destinatario.ie ?? '', x + BOX_PADDING, y + 14, {});

    x += cw[2];
    this.drawBox(doc, x, y, cw[3], boxHeight);
    this.drawLabel(doc, 'UF', x + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.destinatario.uf, x + BOX_PADDING, y + 14, {});

    y += boxHeight;

    this.drawBox(doc, MARGIN, y, CONTENT_WIDTH * 0.5, boxHeight);
    this.drawLabel(doc, 'ENDERECO', MARGIN + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.destinatario.endereco, MARGIN + BOX_PADDING, y + 14, {
      width: CONTENT_WIDTH * 0.5 - BOX_PADDING * 2
    });

    x = MARGIN + CONTENT_WIDTH * 0.5;
    this.drawBox(doc, x, y, CONTENT_WIDTH * 0.25, boxHeight);
    this.drawLabel(doc, 'BAIRRO/DISTRITO', x + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.destinatario.bairro, x + BOX_PADDING, y + 14, {});

    x += CONTENT_WIDTH * 0.25;
    this.drawBox(doc, x, y, CONTENT_WIDTH * 0.25, boxHeight);
    this.drawLabel(doc, 'MUNICIPIO', x + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.destinatario.cidade, x + BOX_PADDING, y + 14, {});

    return y + boxHeight;
  }

  private renderProdutos(doc: PdfDoc, data: DanfeData, y: number): number {
    this.drawSectionTitle(doc, 'DADOS DOS PRODUTOS/SERVICOS', MARGIN, y, CONTENT_WIDTH);
    y += 12;

    const cols = [
      { label: 'CODIGO', width: 50 },
      { label: 'DESCRICAO', width: 160 },
      { label: 'NCM', width: 40 },
      { label: 'CFOP', width: 30 },
      { label: 'UN', width: 25 },
      { label: 'QTD', width: 45 },
      { label: 'V.UNIT', width: 50 },
      { label: 'V.TOTAL', width: 50 },
      { label: 'BC ICMS', width: 45 },
      { label: 'V.ICMS', width: 40 },
      { label: 'ALIQ', width: 30 }
    ];

    const totalWidth = cols.reduce((sum, c) => sum + c.width, 0);
    const scale = CONTENT_WIDTH / totalWidth;
    for (const col of cols) {
      col.width = col.width * scale;
    }

    const headerHeight = 15;
    this.drawBox(doc, MARGIN, y, CONTENT_WIDTH, headerHeight);
    doc.fontSize(FONT_SIZE_SMALL).font('Helvetica-Bold');

    let colX = MARGIN;
    for (const col of cols) {
      doc.text(col.label, colX + 2, y + 4, { width: col.width - 4, align: 'center' });
      colX += col.width;
    }
    y += headerHeight;

    doc.font('Helvetica').fontSize(FONT_SIZE_SMALL);

    for (const prod of data.produtos) {
      if (y + LINE_HEIGHT > PAGE_HEIGHT - MARGIN - 120) {
        doc.addPage();
        y = MARGIN;
      }

      this.drawBox(doc, MARGIN, y, CONTENT_WIDTH, LINE_HEIGHT);
      colX = MARGIN;

      const values = [
        prod.codigo, prod.descricao, prod.ncm, prod.cfop, prod.unidade,
        this.formatNumber(prod.quantidade, 4),
        this.formatNumber(prod.valorUnitario, 4),
        this.formatNumber(prod.valorTotal, 2),
        this.formatNumber(prod.bcIcms, 2),
        this.formatNumber(prod.valorIcms, 2),
        this.formatNumber(prod.aliqIcms, 2)
      ];

      for (let i = 0; i < cols.length; i++) {
        const align = i <= 1 ? 'left' : 'right';
        doc.text(values[i], colX + 2, y + 2, {
          width: cols[i].width - 4,
          align,
          lineBreak: false
        });
        colX += cols[i].width;
      }
      y += LINE_HEIGHT;
    }

    return y;
  }

  private renderTotais(doc: PdfDoc, data: DanfeData, y: number): number {
    this.drawSectionTitle(doc, 'CALCULO DO IMPOSTO', MARGIN, y, CONTENT_WIDTH);
    y += 12;

    const boxHeight = 25;
    const colWidth = CONTENT_WIDTH / 4;

    const row1: [string, string][] = [
      ['BASE DE CALCULO ICMS', data.totais.bcIcms],
      ['VALOR DO ICMS', data.totais.valorIcms],
      ['VALOR DOS PRODUTOS', data.totais.valorProdutos],
      ['VALOR TOTAL DA NF-e', data.totais.valorNfe]
    ];

    this.renderFieldRow(doc, row1, y, colWidth, boxHeight, true);
    y += boxHeight;

    const row2: [string, string][] = [
      ['VALOR DO FRETE', data.totais.valorFrete],
      ['VALOR DO SEGURO', data.totais.valorSeguro],
      ['DESCONTO', data.totais.desconto],
      ['OUTRAS DESPESAS', data.totais.outrasDespesas]
    ];

    this.renderFieldRow(doc, row2, y, colWidth, boxHeight, false);

    return y + boxHeight;
  }

  private renderFieldRow(
    doc: PdfDoc,
    fields: [string, string][],
    y: number,
    colWidth: number,
    boxHeight: number,
    bold: boolean
  ): void {
    for (let i = 0; i < fields.length; i++) {
      const x = MARGIN + colWidth * i;
      this.drawBox(doc, x, y, colWidth, boxHeight);
      this.drawLabel(doc, fields[i][0], x + BOX_PADDING, y + BOX_PADDING);
      doc.fontSize(FONT_SIZE).font(bold ? 'Helvetica-Bold' : 'Helvetica');
      doc.text(this.formatNumber(fields[i][1], 2), x + BOX_PADDING, y + 14, {
        width: colWidth - BOX_PADDING * 2,
        align: 'right'
      });
    }
  }

  private renderTransporte(doc: PdfDoc, data: DanfeData, y: number): number {
    this.drawSectionTitle(doc, 'TRANSPORTADOR/VOLUMES TRANSPORTADOS', MARGIN, y, CONTENT_WIDTH);
    y += 12;

    const boxHeight = 25;
    this.drawBox(doc, MARGIN, y, CONTENT_WIDTH, boxHeight);
    this.drawLabel(doc, 'MODALIDADE DO FRETE', MARGIN + BOX_PADDING, y + BOX_PADDING);
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text(data.transporte.modalidade, MARGIN + BOX_PADDING, y + 14, {
      width: CONTENT_WIDTH - BOX_PADDING * 2
    });

    return y + boxHeight;
  }

  private renderInformacoesComplementares(doc: PdfDoc, data: DanfeData, y: number): void {
    if (!data.informacoesComplementares && !data.informacoesFisco) return;

    this.drawSectionTitle(doc, 'DADOS ADICIONAIS', MARGIN, y, CONTENT_WIDTH);
    y += 12;

    const boxHeight = 50;
    this.drawBox(doc, MARGIN, y, CONTENT_WIDTH, boxHeight);

    if (data.informacoesFisco) {
      this.drawLabel(doc, 'INFORMACOES ADICIONAIS DE INTERESSE DO FISCO', MARGIN + BOX_PADDING, y + BOX_PADDING);
      doc.fontSize(FONT_SIZE_SMALL).font('Helvetica');
      doc.text(data.informacoesFisco, MARGIN + BOX_PADDING, y + 14, {
        width: CONTENT_WIDTH - BOX_PADDING * 2
      });
    }

    if (data.informacoesComplementares) {
      const startY = data.informacoesFisco ? y + 30 : y + BOX_PADDING;
      if (!data.informacoesFisco) {
        this.drawLabel(doc, 'INFORMACOES COMPLEMENTARES', MARGIN + BOX_PADDING, startY);
      }
      doc.fontSize(FONT_SIZE_SMALL).font('Helvetica');
      doc.text(data.informacoesComplementares, MARGIN + BOX_PADDING, startY + 10, {
        width: CONTENT_WIDTH - BOX_PADDING * 2
      });
    }
  }

  private renderBarcode(doc: PdfDoc, chave: string, x: number, y: number, maxWidth: number, height: number): void {
    try {
      const bars = encodeCode128C(chave);
      const totalWidth = getBarcodeWidth(bars);
      const barcodeScale = maxWidth / totalWidth;

      for (const bar of bars) {
        if (bar.isBar) {
          doc.rect(x + bar.x * barcodeScale, y, bar.width * barcodeScale, height).fill('black');
        }
      }
    } catch {
      doc.fontSize(FONT_SIZE_SMALL).font('Helvetica');
      doc.text('CODIGO DE BARRAS INDISPONIVEL', x, y + height / 2, {
        width: maxWidth,
        align: 'center'
      });
    }
  }

  private drawBox(doc: PdfDoc, x: number, y: number, width: number, height: number): void {
    doc.lineWidth(0.5).rect(x, y, width, height).stroke('#000000');
  }

  private drawSectionTitle(doc: PdfDoc, title: string, x: number, y: number, width: number): void {
    doc.fontSize(FONT_SIZE_SMALL).font('Helvetica-Bold').fillColor('#000000');
    doc.text(title, x + BOX_PADDING, y + 2, { width });
  }

  private drawLabel(doc: PdfDoc, label: string, x: number, y: number): void {
    doc.fontSize(FONT_SIZE_SMALL).font('Helvetica').fillColor(LABEL_COLOR);
    doc.text(label, x, y, {});
    doc.fillColor('#000000');
  }

  private formatCnpj(cnpj: string): string {
    if (cnpj.length !== 14) return cnpj;
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  private formatCpf(cpf: string): string {
    if (cpf.length !== 11) return cpf;
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  private formatNumber(value: string, decimals: number): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
}
