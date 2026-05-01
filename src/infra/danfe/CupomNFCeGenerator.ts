import { DanfeData } from './xml-parser';
import { NFeError } from '@nfe/shared/errors/NFeError';

type PdfDoc = {
  pipe(stream: NodeJS.WritableStream): PdfDoc;
  on(event: string, callback: (...args: unknown[]) => void): PdfDoc;
  end(): void;
  addPage(): PdfDoc;
  text(text: string, x: number, y: number, options?: Record<string, unknown>): PdfDoc;
  fontSize(size: number): PdfDoc;
  font(name: string): PdfDoc;
  fillColor(color: string): PdfDoc;
  rect(x: number, y: number, w: number, h: number): PdfDoc;
  fill(color?: string): PdfDoc;
  stroke(): PdfDoc;
  moveTo(x: number, y: number): PdfDoc;
  lineTo(x: number, y: number): PdfDoc;
  dash(length: number, options?: Record<string, unknown>): PdfDoc;
  undash(): PdfDoc;
  lineWidth(width: number): PdfDoc;
  image(src: string | Buffer, x: number, y: number, options?: Record<string, unknown>): PdfDoc;
  strokeColor(color: string): PdfDoc;
};

// 80mm = 226.77pt, margins 5pt each side
const PAGE_W = 226.77;
const M = 5;
const W = PAGE_W - M * 2;
const F = 7;
const FS = 6;
const FL = 9;
const LH = 9;
const LHS = 7;

async function loadPdfKit(): Promise<new (options: Record<string, unknown>) => PdfDoc> {
  try {
    const mod = await import('pdfkit');
    return mod.default ?? mod;
  } catch {
    throw new NFeError('pdfkit nao esta instalado. Instale com: npm install pdfkit');
  }
}

async function loadQRCode(): Promise<{
  toBuffer: (text: string, options?: Record<string, unknown>) => Promise<Buffer>;
}> {
  try {
    const mod = await import('qrcode');
    return mod.default ?? mod;
  } catch {
    throw new NFeError('qrcode nao esta instalado. Instale com: npm install qrcode');
  }
}

export type CupomData = DanfeData & {
  readonly qrCodeUrl?: string;
  readonly urlChave?: string;
};

/**
 * Extrai dados do infNFeSupl do XML (qrCode e urlChave).
 */
export function extractInfNFeSupl(xml: string): { qrCodeUrl?: string; urlChave?: string } {
  const suplBlock = xml.match(/<infNFeSupl>([\s\S]*?)<\/infNFeSupl>/);
  if (!suplBlock) return {};

  // qrCode pode estar em CDATA
  const qrMatch = suplBlock[1].match(
    /<qrCode>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*<\/qrCode>/
  );
  const urlMatch = suplBlock[1].match(/<urlChave>\s*(.*?)\s*<\/urlChave>/);

  return {
    qrCodeUrl: qrMatch?.[1],
    urlChave: urlMatch?.[1]
  };
}

export class CupomNFCeGenerator {
  async generate(data: CupomData): Promise<Buffer> {
    const PdfDocument = await loadPdfKit();

    const estimatedHeight = this.estimateHeight(data);

    const doc = new PdfDocument({
      size: [PAGE_W, estimatedHeight],
      margin: M,
      bufferPages: true
    }) as unknown as PdfDoc;

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: unknown) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.render(doc, data).then(() => doc.end()).catch(reject);
    });
  }

  private async render(doc: PdfDoc, d: CupomData): Promise<void> {
    let y = M;

    y = this.header(doc, d, y);
    y = this.separator(doc, y);
    y = this.produtos(doc, d, y);
    y = this.totais(doc, d, y);
    y = this.separator(doc, y);
    y = this.pagamento(doc, d, y);
    y = this.separator(doc, y);
    y = this.infoFiscal(doc, d, y);
    y = await this.qrCode(doc, d, y);
    this.rodape(doc, d, y);
  }

  private header(doc: PdfDoc, d: CupomData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FL).fillColor('black');
    doc.text('DOCUMENTO AUXILIAR DA NFC-e', M, y, { width: W, align: 'center' });
    y += LH + 2;

    doc.font('Helvetica-Bold').fontSize(FS);
    doc.text('DANFE NFC-e', M, y, { width: W, align: 'center' });
    y += LHS + 4;

    // Emitente
    doc.font('Helvetica-Bold').fontSize(F);
    doc.text(d.emitente.nome, M, y, { width: W, align: 'center' });
    y += LH;

    doc.font('Helvetica').fontSize(FS);
    const cnpjFormatado = this.fmtDoc(d.emitente.cnpj);
    doc.text(`CNPJ: ${cnpjFormatado}`, M, y, { width: W, align: 'center' });
    y += LHS;

    if (d.emitente.ie) {
      doc.text(`IE: ${d.emitente.ie}`, M, y, { width: W, align: 'center' });
      y += LHS;
    }

    const endereco = [
      d.emitente.endereco,
      d.emitente.bairro,
      `${d.emitente.cidade}-${d.emitente.uf}`,
      d.emitente.cep ? `CEP: ${d.emitente.cep}` : ''
    ].filter(Boolean).join(', ');

    doc.text(endereco, M, y, { width: W, align: 'center' });
    y += LHS * 2;

    if (d.emitente.fone) {
      doc.text(`Fone: ${d.emitente.fone}`, M, y, { width: W, align: 'center' });
      y += LHS;
    }

    return y + 2;
  }

  private separator(doc: PdfDoc, y: number): number {
    doc.strokeColor('#000000').lineWidth(0.5);
    doc.dash(2, { space: 2 });
    doc.moveTo(M, y).lineTo(M + W, y).stroke();
    doc.undash();
    return y + 4;
  }

  private produtos(doc: PdfDoc, d: CupomData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FS).fillColor('black');
    doc.text('#', M, y, { width: 15 });
    doc.text('Descricao', M + 15, y, { width: W - 70 });
    doc.text('Vl.Total', M + W - 55, y, { width: 55, align: 'right' });
    y += LHS;

    doc.font('Helvetica').fontSize(FS);

    for (let i = 0; i < d.produtos.length; i++) {
      const p = d.produtos[i];
      const num = String(i + 1);
      const desc = this.trunc(p.descricao, 25);
      doc.text(num, M, y, { width: 15 });
      doc.text(desc, M + 15, y, { width: W - 70 });
      doc.text(this.fmtNum(p.valorTotal), M + W - 55, y, { width: 55, align: 'right' });
      y += LHS;

      // Linha 2: qtd x valor unitario
      doc.fillColor('#666666');
      doc.text(
        `${p.quantidade} ${p.unidade} x ${this.fmtNum(p.valorUnitario)}`,
        M + 15, y, { width: W - 15 }
      );
      doc.fillColor('black');
      y += LHS;
    }

    return y + 2;
  }

  private totais(doc: PdfDoc, d: CupomData, y: number): number {
    doc.font('Helvetica').fontSize(F);

    y = this.lineKeyValue(doc, 'Qtd. Itens', String(d.produtos.length), y);
    y = this.lineKeyValue(doc, 'Subtotal', this.fmtNum(d.totais.valorProdutos), y);

    if (d.totais.desconto && d.totais.desconto !== '0.00') {
      y = this.lineKeyValue(doc, 'Desconto', `- ${this.fmtNum(d.totais.desconto)}`, y);
    }
    if (d.totais.valorFrete && d.totais.valorFrete !== '0.00') {
      y = this.lineKeyValue(doc, 'Frete', this.fmtNum(d.totais.valorFrete), y);
    }
    if (d.totais.outrasDespesas && d.totais.outrasDespesas !== '0.00') {
      y = this.lineKeyValue(
        doc, 'Outras despesas', this.fmtNum(d.totais.outrasDespesas), y
      );
    }

    // Total
    doc.font('Helvetica-Bold').fontSize(FL);
    y = this.lineKeyValue(doc, 'TOTAL', `R$ ${this.fmtNum(d.totais.valorNfe)}`, y);
    doc.font('Helvetica').fontSize(F);

    return y + 2;
  }

  private pagamento(doc: PdfDoc, d: CupomData, y: number): number {
    doc.font('Helvetica-Bold').fontSize(FS);
    doc.text('FORMA DE PAGAMENTO', M, y, { width: W, align: 'center' });
    y += LHS + 2;

    doc.font('Helvetica').fontSize(FS);
    for (const pag of d.pagamentos) {
      y = this.lineKeyValue(doc, pag.forma, `R$ ${this.fmtNum(pag.valor)}`, y);
    }

    // Troco
    const total = parseFloat(d.totais.valorNfe) || 0;
    const totalPago = d.pagamentos.reduce(
      (sum, p) => sum + (parseFloat(p.valor) || 0), 0
    );
    const troco = totalPago - total;
    if (troco > 0.01) {
      y = this.lineKeyValue(doc, 'Troco', `R$ ${this.fmtNum(troco.toFixed(2))}`, y);
    }

    return y + 2;
  }

  private infoFiscal(doc: PdfDoc, d: CupomData, y: number): number {
    doc.font('Helvetica').fontSize(FS).fillColor('black');

    // Chave de acesso
    doc.font('Helvetica-Bold').fontSize(FS);
    doc.text('Consulte pela Chave de Acesso em', M, y, { width: W, align: 'center' });
    y += LHS;

    if (d.urlChave) {
      doc.font('Helvetica').fontSize(5);
      doc.text(d.urlChave, M, y, { width: W, align: 'center' });
      y += LHS;
    }

    doc.font('Helvetica').fontSize(5);
    const chaveFormatada = (d.chaveAcesso || '').replace(/(\d{4})/g, '$1 ').trim();
    doc.text(chaveFormatada, M, y, { width: W, align: 'center' });
    y += LHS + 2;

    // Destinatario / Consumidor
    if (d.destinatario && d.destinatario.nome) {
      doc.font('Helvetica-Bold').fontSize(FS);
      doc.text('CONSUMIDOR', M, y, { width: W, align: 'center' });
      y += LHS;

      doc.font('Helvetica').fontSize(FS);
      const docConsumidor = d.destinatario.cnpjCpf
        ? `CPF/CNPJ: ${this.fmtDoc(d.destinatario.cnpjCpf)}`
        : '';
      if (docConsumidor) {
        doc.text(docConsumidor, M, y, { width: W, align: 'center' });
        y += LHS;
      }
      doc.text(d.destinatario.nome, M, y, { width: W, align: 'center' });
      y += LHS;
    } else {
      doc.font('Helvetica').fontSize(FS);
      doc.text('CONSUMIDOR NAO IDENTIFICADO', M, y, { width: W, align: 'center' });
      y += LHS;
    }

    y += 2;

    // Numero e serie
    doc.font('Helvetica-Bold').fontSize(FS);
    doc.text(`NFC-e no ${d.numero} Serie ${d.serie}`, M, y, {
      width: W, align: 'center'
    });
    y += LHS;

    // Data emissao
    doc.font('Helvetica').fontSize(FS);
    doc.text(`Emissao: ${d.dataEmissao}`, M, y, { width: W, align: 'center' });
    y += LHS;

    // Protocolo
    if (d.protocolo) {
      doc.text(`Protocolo: ${d.protocolo}`, M, y, { width: W, align: 'center' });
      y += LHS;
    }
    if (d.dataAutorizacao) {
      doc.text(`Autorizacao: ${d.dataAutorizacao}`, M, y, { width: W, align: 'center' });
      y += LHS;
    }

    return y + 4;
  }

  private async qrCode(doc: PdfDoc, d: CupomData, y: number): Promise<number> {
    if (!d.qrCodeUrl) return y;

    try {
      const qrLib = await loadQRCode();
      const qrBuffer = await qrLib.toBuffer(d.qrCodeUrl, {
        type: 'png',
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M'
      });

      const qrSize = 130;
      const x = M + (W - qrSize) / 2;
      doc.image(qrBuffer, x, y, { width: qrSize, height: qrSize });
      y += qrSize + 4;
    } catch {
      // Se qrcode nao esta instalado, mostra URL como texto
      doc.font('Helvetica').fontSize(4);
      doc.text(d.qrCodeUrl, M, y, { width: W, align: 'center' });
      y += 10;
    }

    return y;
  }

  private rodape(doc: PdfDoc, d: CupomData, y: number): void {
    doc.font('Helvetica').fontSize(5).fillColor('#666666');

    if (d.informacoesComplementares) {
      const info = d.informacoesComplementares.substring(0, 200);
      doc.text(info, M, y, { width: W, align: 'center' });
      y += Math.ceil(info.length / 40) * 6 + 2;
    }
  }

  private lineKeyValue(doc: PdfDoc, key: string, value: string, y: number): number {
    doc.text(key, M, y, { width: W / 2 });
    doc.text(value, M + W / 2, y, { width: W / 2, align: 'right' });
    return y + LH;
  }

  private estimateHeight(d: CupomData): number {
    let h = 0;
    h += 80;  // header
    h += d.produtos.length * 20; // products (2 lines each)
    h += 60;  // totals
    h += (d.pagamentos?.length ?? 1) * 12; // payments
    h += 120; // fiscal info
    h += d.qrCodeUrl ? 150 : 0; // qr code
    h += 60;  // footer
    h += 40;  // margins/padding
    return Math.max(h, 300);
  }

  private fmtDoc(doc: string): string {
    if (doc.length === 14) {
      return doc.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      );
    }
    if (doc.length === 11) {
      return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return doc;
  }

  private fmtNum(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private trunc(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars - 1) + '.';
  }
}
