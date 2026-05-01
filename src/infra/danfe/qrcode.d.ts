declare module 'qrcode' {
  export function toBuffer(
    text: string,
    options?: {
      type?: 'png';
      width?: number;
      margin?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
      color?: { dark?: string; light?: string };
    }
  ): Promise<Buffer>;
}
