import { NFeError } from '@nfe/shared/errors/NFeError';
import { parseNFeXml } from '@nfe/infra/danfe/xml-parser';
import { CupomNFCeGenerator, extractInfNFeSupl } from '@nfe/infra/danfe/CupomNFCeGenerator';
import type { CupomData } from '@nfe/infra/danfe/CupomNFCeGenerator';

export type { CupomData };

export class GerarCupomUseCase {
  private readonly generator: CupomNFCeGenerator;

  constructor() {
    this.generator = new CupomNFCeGenerator();
  }

  /**
   * Gera PDF do cupom termico NFC-e a partir do XML autorizado.
   * Requer pdfkit e qrcode instalados.
   */
  async execute(xml: string): Promise<Buffer> {
    if (!xml || !xml.includes('<infNFe')) {
      throw new NFeError('XML invalido: esperado XML de NFC-e autorizada com <infNFe>');
    }

    const danfeData = parseNFeXml(xml);
    const { qrCodeUrl, urlChave } = extractInfNFeSupl(xml);

    const cupomData: CupomData = {
      ...danfeData,
      qrCodeUrl,
      urlChave
    };

    return this.generator.generate(cupomData);
  }
}
