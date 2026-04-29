import { CertificateProvider } from '@nfe/contracts/CertificateProvider';
import { SefazTransport } from '@nfe/contracts/SefazTransport';
import { XmlSigner } from '@nfe/contracts/XmlSigner';
import { NFeEnvironment } from '@nfe/core/types';
import { NFeError } from '@nfe/shared/errors/NFeError';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import { getSefazUrl, ibgeToUf, SefazEnvironment } from '@nfe/shared/constants/sefaz-urls';
import { extractSoapBody } from '@nfe/infra/sefaz/soap';
import { formatDate } from '@nfe/infra/xml/xml-helper';
import {
  buildCancelamentoXml,
  wrapEventoSoapEnvelope,
  parseEventoResponse,
  EVENTO_SOAP_ACTION,
  EventoResult
} from '@nfe/infra/sefaz/evento-soap';

export type { EventoResult } from '@nfe/infra/sefaz/evento-soap';

type CancelaNFeDeps = {
  readonly certificate: CertificateProvider;
  readonly transport: SefazTransport;
  readonly xmlSigner: XmlSigner;
  readonly environment: NFeEnvironment;
};

type CancelaInput = {
  readonly chaveAcesso: string;
  readonly cnpj: string;
  readonly protocolo: string;
  readonly justificativa: string;
};

function toSefazEnv(env: NFeEnvironment): SefazEnvironment {
  return env === 'homologation' ? 'homologacao' : 'producao';
}

export class CancelaNFeUseCase {
  constructor(private readonly deps: CancelaNFeDeps) { }

  async execute(input: CancelaInput): Promise<EventoResult> {
    this.validate(input);

    const { certificate, transport, xmlSigner, environment } = this.deps;
    const uf = ibgeToUf(input.chaveAcesso.substring(0, 2));
    const cOrgao = input.chaveAcesso.substring(0, 2);
    const tpAmb: '1' | '2' = environment === 'production' ? '1' : '2';
    const dhEvento = formatDate(new Date());

    const eventoXml = buildCancelamentoXml(
      input.chaveAcesso, input.cnpj, cOrgao, tpAmb,
      input.protocolo, input.justificativa, dhEvento
    );

    const cert = await certificate.load();
    const signedXml = xmlSigner.sign(eventoXml, cert);
    const envelope = wrapEventoSoapEnvelope(signedXml);

    const sefazEnv = toSefazEnv(environment);
    const url = getSefazUrl(uf, sefazEnv, 'RecepcaoEvento');

    const response = await transport.send({
      url,
      soapAction: EVENTO_SOAP_ACTION,
      xml: envelope,
      pfx: cert.pfx,
      password: cert.password
    });

    const body = extractSoapBody(response.xml);
    const result = parseEventoResponse(body);

    if (result.cStat === '135' || result.cStat === '136') {
      return result;
    }

    throw new SefazRejectError(result.cStat, result.xMotivo, uf);
  }

  private validate(input: CancelaInput): void {
    if (!/^\d{44}$/.test(input.chaveAcesso)) {
      throw new NFeError('Chave de acesso invalida: deve ter 44 digitos numericos');
    }
    if (!/^\d{14}$/.test(input.cnpj)) {
      throw new NFeError('CNPJ invalido: deve ter 14 digitos numericos');
    }
    if (!input.protocolo) {
      throw new NFeError('Protocolo de autorizacao eh obrigatorio para cancelamento');
    }
    if (!input.justificativa || input.justificativa.length < 15) {
      throw new NFeError('Justificativa deve ter no minimo 15 caracteres');
    }
  }
}
