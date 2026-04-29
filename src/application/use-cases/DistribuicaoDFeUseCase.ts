import { CertificateProvider } from '@nfe/contracts/CertificateProvider';
import { SefazTransport } from '@nfe/contracts/SefazTransport';
import { NFeEnvironment } from '@nfe/core/types';
import { NFeError } from '@nfe/shared/errors/NFeError';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import { UF_CODES } from '@nfe/shared/constants/ibge-codes';
import { getAnUrl, AnEnvironment } from '@nfe/shared/constants/sefaz-an-urls';
import { extractSoapBody } from '@nfe/infra/sefaz/soap';
import {
  buildDistNSUEnvelope,
  buildConsChNFeEnvelope,
  parseDistribuicaoResponse,
  DISTRIBUICAO_SOAP_ACTION,
  DistribuicaoResult
} from '@nfe/infra/sefaz/distribuicao-soap';

export type { DistribuicaoResult } from '@nfe/infra/sefaz/distribuicao-soap';
export type { DFeDocument } from '@nfe/infra/sefaz/distribuicao-soap';

type DistribuicaoDeps = {
  readonly certificate: CertificateProvider;
  readonly transport: SefazTransport;
  readonly environment: NFeEnvironment;
};

function toAnEnv(env: NFeEnvironment): AnEnvironment {
  return env === 'homologation' ? 'homologacao' : 'producao';
}

function toTpAmb(env: NFeEnvironment): '1' | '2' {
  return env === 'production' ? '1' : '2';
}

export class DistribuicaoDFeUseCase {
  constructor(private readonly deps: DistribuicaoDeps) {}

  /**
   * Consulta documentos fiscais a partir de um NSU.
   * Retorna ate 50 documentos por chamada. Use ultNSU do resultado para paginar.
   */
  async consultarPorNSU(
    cnpj: string,
    uf: string,
    ultNSU: string = '0'
  ): Promise<DistribuicaoResult> {
    this.validateCnpj(cnpj);
    const cUFAutor = this.getUfCode(uf);
    const anEnv = toAnEnv(this.deps.environment);
    const tpAmb = toTpAmb(this.deps.environment);

    const url = getAnUrl(anEnv, 'NFeDistribuicaoDFe');
    const envelope = buildDistNSUEnvelope(cnpj, cUFAutor, tpAmb, ultNSU);

    return this.send(url, envelope, uf);
  }

  /**
   * Consulta um documento fiscal especifico pela chave de acesso.
   */
  async consultarPorChave(
    cnpj: string,
    uf: string,
    chaveAcesso: string
  ): Promise<DistribuicaoResult> {
    this.validateCnpj(cnpj);
    this.validateChave(chaveAcesso);
    const cUFAutor = this.getUfCode(uf);
    const anEnv = toAnEnv(this.deps.environment);
    const tpAmb = toTpAmb(this.deps.environment);

    const url = getAnUrl(anEnv, 'NFeDistribuicaoDFe');
    const envelope = buildConsChNFeEnvelope(cnpj, cUFAutor, tpAmb, chaveAcesso);

    return this.send(url, envelope, uf);
  }

  private async send(
    url: string,
    envelope: string,
    uf: string
  ): Promise<DistribuicaoResult> {
    const cert = await this.deps.certificate.load();

    const response = await this.deps.transport.send({
      url,
      soapAction: DISTRIBUICAO_SOAP_ACTION,
      xml: envelope,
      pfx: cert.pfx,
      password: cert.password
    });

    const body = extractSoapBody(response.xml);
    const result = parseDistribuicaoResponse(body);

    // 137 = nenhum documento, 138 = documentos localizados
    if (result.cStat === '137' || result.cStat === '138') {
      return result;
    }

    throw new SefazRejectError(result.cStat, result.xMotivo, uf);
  }

  private validateCnpj(cnpj: string): void {
    if (!/^\d{14}$/.test(cnpj)) {
      throw new NFeError(
        `CNPJ invalido: deve ter 14 digitos numericos, recebeu "${cnpj}"`
      );
    }
  }

  private validateChave(chave: string): void {
    if (!/^\d{44}$/.test(chave)) {
      throw new NFeError(
        `Chave de acesso invalida: deve ter 44 digitos numericos, recebeu "${chave}"`
      );
    }
  }

  private getUfCode(uf: string): string {
    const code = UF_CODES[uf];
    if (!code) {
      throw new NFeError(`UF desconhecida: ${uf}`);
    }
    return code;
  }
}
