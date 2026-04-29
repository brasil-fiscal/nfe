import { NFeError } from '@nfe/shared/errors/NFeError';
import { parseNFeXml } from '@nfe/infra/danfe/xml-parser';
import { DanfeGenerator } from '@nfe/infra/danfe/DanfeGenerator';

export type { DanfeData } from '@nfe/infra/danfe/xml-parser';

export class GerarDanfeUseCase {
  private readonly generator: DanfeGenerator;

  constructor() {
    this.generator = new DanfeGenerator();
  }

  /**
   * Gera PDF do DANFE a partir do XML autorizado.
   * Requer pdfkit instalado como dependencia.
   */
  async execute(xml: string): Promise<Buffer> {
    if (!xml || !xml.includes('<infNFe')) {
      throw new NFeError('XML invalido: deve conter elemento <infNFe>');
    }

    const data = parseNFeXml(xml);
    return this.generator.generate(data);
  }
}
