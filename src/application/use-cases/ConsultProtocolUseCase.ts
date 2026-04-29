import { CertificateProvider } from '@nfe/contracts/CertificateProvider';
import { SefazTransport } from '@nfe/contracts/SefazTransport';
import { ConsultResult, NFeEnvironment } from '@nfe/core/types';
import { NFeError } from '@nfe/shared/errors/NFeError';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import {
  getSefazUrl,
  ibgeToUf,
  SefazEnvironment
} from '@nfe/shared/constants/sefaz-urls';
import {
  buildConsultaEnvelope,
  extractSoapBody,
  parseConsultaResponse,
  SOAP_ACTIONS
} from '@nfe/infra/sefaz/soap';

type ConsultDeps = {
  readonly certificate: CertificateProvider;
  readonly transport: SefazTransport;
  readonly environment: NFeEnvironment;
};

function toSefazEnv(env: NFeEnvironment): SefazEnvironment {
  return env === 'homologation' ? 'homologacao' : 'producao';
}

export class ConsultProtocolUseCase {
  constructor(private readonly deps: ConsultDeps) {}

  async execute(chaveAcesso: string): Promise<ConsultResult> {
    this.validateChave(chaveAcesso);

    const { certificate, transport, environment } = this.deps;
    const uf = ibgeToUf(chaveAcesso.substring(0, 2));
    const sefazEnv = toSefazEnv(environment);
    const tpAmb: '1' | '2' = environment === 'production' ? '1' : '2';

    const url = getSefazUrl(uf, sefazEnv, 'NFeConsultaProtocolo');
    const envelope = buildConsultaEnvelope(chaveAcesso, tpAmb);

    const cert = await certificate.load();

    const response = await transport.send({
      url,
      soapAction: SOAP_ACTIONS.NFeConsultaProtocolo4,
      xml: envelope,
      pfx: cert.pfx,
      password: cert.password
    });

    const body = extractSoapBody(response.xml);
    const result = parseConsultaResponse(body);

    if (result.cStat === '100' || result.cStat === '101') {
      return {
        codigoStatus: result.cStat,
        motivo: result.xMotivo,
        protocolo: result.nProt,
        dataAutorizacao: result.dhRecbto ? new Date(result.dhRecbto) : undefined
      };
    }

    throw new SefazRejectError(result.cStat, result.xMotivo, uf);
  }

  private validateChave(chave: string): void {
    if (!/^\d{44}$/.test(chave)) {
      throw new NFeError(
        `Chave de acesso invalida: deve ter 44 digitos numericos, recebeu "${chave}"`
      );
    }
  }
}
