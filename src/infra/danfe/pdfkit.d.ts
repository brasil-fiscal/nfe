declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: Record<string, unknown>);
    on(event: string, handler: (...args: never[]) => void): this;
    end(): void;
    addPage(): this;
    fontSize(size: number): this;
    font(name: string): this;
    fillColor(color: string): this;
    lineWidth(width: number): this;
    text(text: string, x: number, y: number, options?: Record<string, unknown>): this;
    rect(x: number, y: number, w: number, h: number): this;
    stroke(color: string): this;
    fill(color: string): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    dash(length: number, options?: Record<string, unknown>): this;
    undash(): this;
  }
  export default PDFDocument;
}
