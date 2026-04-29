import { XmlBuilder } from '@nfe/contracts/XmlBuilder';
import { XmlSigner } from '@nfe/contracts/XmlSigner';
import { CertificateProvider } from '@nfe/contracts/CertificateProvider';
import { SefazTransport } from '@nfe/contracts/SefazTransport';
import { NFeProps } from '@nfe/domain/entities/NFe';
import { TransmitResult, NFeEnvironment } from '@nfe/core/types';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import { getSefazUrl, SefazEnvironment } from '@nfe/shared/constants/sefaz-urls';
import {
  buildAutorizacaoEnvelope,
  extractSoapBody,
  parseAutorizacaoResponse,
  SOAP_ACTIONS
} from '@nfe/infra/sefaz/soap';

type TransmitDeps = {
  readonly xmlBuilder: XmlBuilder;
  readonly xmlSigner: XmlSigner;
  readonly certificate: CertificateProvider;
  readonly transport: SefazTransport;
  readonly environment: NFeEnvironment;
  readonly uf: string;
};

function toSefazEnv(env: NFeEnvironment): SefazEnvironment {
  return env === 'homologation' ? 'homologacao' : 'producao';
}

export class TransmitNFeUseCase {
  constructor(private readonly deps: TransmitDeps) {}

  async execute(nfe: NFeProps): Promise<TransmitResult> {
    const { xmlBuilder, xmlSigner, certificate, transport, environment, uf } = this.deps;

    const xml = xmlBuilder.build(nfe);
    const cert = await certificate.load();
    const signedXml = xmlSigner.sign(xml, cert);

    const sefazEnv = toSefazEnv(environment);
    const url = getSefazUrl(uf, sefazEnv, 'NFeAutorizacao');
    const envelope = buildAutorizacaoEnvelope(signedXml);

    const response = await transport.send({
      url,
      soapAction: SOAP_ACTIONS.NFeAutorizacao4,
      xml: envelope,
      pfx: cert.pfx,
      password: cert.password
    });

    const body = extractSoapBody(response.xml);
    const result = parseAutorizacaoResponse(body);

    if (result.cStat === '100') {
      const nfeProc = this.buildNfeProc(signedXml, result.xmlProtocolado);
      return {
        autorizada: true,
        protocolo: result.nProt,
        chaveAcesso: result.chNFe ?? '',
        codigoStatus: result.cStat,
        motivo: result.xMotivo,
        xmlProtocolado: nfeProc,
        dataAutorizacao: result.dhRecbto ? new Date(result.dhRecbto) : undefined
      };
    }

    throw new SefazRejectError(result.cStat, result.xMotivo, uf);
  }

  private buildNfeProc(signedNFe: string, protNFe?: string): string | undefined {
    if (!protNFe) return undefined;
    const nfeContent = signedNFe.replace(/<\?xml[^?]*\?>\s*/g, '');
    return (
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">' +
      nfeContent +
      protNFe +
      '</nfeProc>'
    );
  }
}
