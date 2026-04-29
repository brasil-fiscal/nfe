import { CertificateProvider } from '@nfe/contracts/CertificateProvider';
import { SefazTransport } from '@nfe/contracts/SefazTransport';
import { XmlSigner } from '@nfe/contracts/XmlSigner';
import { NFeEnvironment } from '@nfe/core/types';
import { NFeError } from '@nfe/shared/errors/NFeError';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import { getAnUrl, AnEnvironment } from '@nfe/shared/constants/sefaz-an-urls';
import { extractSoapBody } from '@nfe/infra/sefaz/soap';
import { formatDate } from '@nfe/infra/xml/xml-helper';
import {
  buildManifestacaoXml,
  wrapManifestacaoSoapEnvelope,
  parseManifestacaoResponse,
  requiresJustificativa,
  MANIFESTACAO_SOAP_ACTION,
  TipoManifestacao,
  ManifestacaoResult
} from '@nfe/infra/sefaz/manifestacao-soap';

export type { ManifestacaoResult } from '@nfe/infra/sefaz/manifestacao-soap';
export type { TipoManifestacao } from '@nfe/infra/sefaz/manifestacao-soap';

type ManifestacaoDeps = {
  readonly certificate: CertificateProvider;
  readonly transport: SefazTransport;
  readonly xmlSigner: XmlSigner;
  readonly environment: NFeEnvironment;
};

type ManifestacaoInput = {
  readonly chaveAcesso: string;
  readonly cnpj: string;
  readonly justificativa?: string;
};

function toAnEnv(env: NFeEnvironment): AnEnvironment {
  return env === 'homologation' ? 'homologacao' : 'producao';
}

export class ManifestacaoUseCase {
  constructor(private readonly deps: ManifestacaoDeps) {}

  async confirmar(input: ManifestacaoInput): Promise<ManifestacaoResult> {
    return this.enviar('confirmacao', input);
  }

  async ciencia(input: ManifestacaoInput): Promise<ManifestacaoResult> {
    return this.enviar('ciencia', input);
  }

  async desconhecer(input: ManifestacaoInput): Promise<ManifestacaoResult> {
    return this.enviar('desconhecimento', input);
  }

  async naoRealizada(input: ManifestacaoInput): Promise<ManifestacaoResult> {
    return this.enviar('naoRealizada', input);
  }

  private async enviar(
    tipo: TipoManifestacao,
    input: ManifestacaoInput
  ): Promise<ManifestacaoResult> {
    this.validate(tipo, input);

    const { certificate, transport, xmlSigner, environment } = this.deps;
    const cOrgao = '91'; // Codigo do orgao AN para manifestacao
    const tpAmb: '1' | '2' = environment === 'production' ? '1' : '2';
    const dhEvento = formatDate(new Date());

    const eventoXml = buildManifestacaoXml(
      tipo, input.chaveAcesso, input.cnpj, cOrgao,
      tpAmb, dhEvento, input.justificativa
    );

    const cert = await certificate.load();
    const signedXml = xmlSigner.sign(eventoXml, cert);
    const envelope = wrapManifestacaoSoapEnvelope(signedXml);

    const anEnv = toAnEnv(environment);
    const url = getAnUrl(anEnv, 'RecepcaoEvento');

    const response = await transport.send({
      url,
      soapAction: MANIFESTACAO_SOAP_ACTION,
      xml: envelope,
      pfx: cert.pfx,
      password: cert.password
    });

    const body = extractSoapBody(response.xml);
    const result = parseManifestacaoResponse(body);

    if (result.cStat === '135' || result.cStat === '136') {
      return result;
    }

    throw new SefazRejectError(result.cStat, result.xMotivo);
  }

  private validate(tipo: TipoManifestacao, input: ManifestacaoInput): void {
    if (!/^\d{44}$/.test(input.chaveAcesso)) {
      throw new NFeError('Chave de acesso invalida: deve ter 44 digitos numericos');
    }
    if (!/^\d{14}$/.test(input.cnpj)) {
      throw new NFeError('CNPJ invalido: deve ter 14 digitos numericos');
    }
    if (requiresJustificativa(tipo) && (!input.justificativa || input.justificativa.length < 15)) {
      throw new NFeError('Justificativa deve ter no minimo 15 caracteres para este tipo de manifestacao');
    }
  }
}
