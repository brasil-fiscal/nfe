import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import { DefaultXmlSigner } from '@nfe/infra/xml/DefaultXmlSigner';
import { NodeHttpSefazTransport } from '@nfe/infra/sefaz/NodeHttpSefazTransport';
import { CertificateProvider } from '@nfe/contracts/CertificateProvider';
import { XmlBuilder } from '@nfe/contracts/XmlBuilder';
import { XmlSigner } from '@nfe/contracts/XmlSigner';
import { SefazTransport } from '@nfe/contracts/SefazTransport';
import { TransmitNFeUseCase } from '@nfe/application/use-cases/TransmitNFeUseCase';
import { ConsultProtocolUseCase } from '@nfe/application/use-cases/ConsultProtocolUseCase';
import { CancelaNFeUseCase } from '@nfe/application/use-cases/CancelaNFeUseCase';
import { CartaCorrecaoUseCase } from '@nfe/application/use-cases/CartaCorrecaoUseCase';
import { InutilizaNFeUseCase } from '@nfe/application/use-cases/InutilizaNFeUseCase';
import { DistribuicaoDFeUseCase } from '@nfe/application/use-cases/DistribuicaoDFeUseCase';
import { ManifestacaoUseCase } from '@nfe/application/use-cases/ManifestacaoUseCase';
import { GerarDanfeUseCase } from '@nfe/application/use-cases/GerarDanfeUseCase';
import { NFeEnvironment, TransmitResult, ConsultResult } from '@nfe/core/types';
import { NFeProps } from '@nfe/domain/entities/NFe';
import type { EventoResult } from '@nfe/application/use-cases/CancelaNFeUseCase';
import type { InutilizacaoResult } from '@nfe/application/use-cases/InutilizaNFeUseCase';
import type { DistribuicaoResult } from '@nfe/application/use-cases/DistribuicaoDFeUseCase';
import type { ManifestacaoResult } from '@nfe/application/use-cases/ManifestacaoUseCase';

export type NFeAmbiente = 'homologacao' | 'producao';

export type NFeCoreConfig = {
  readonly pfx: Buffer;
  readonly senha: string;
  readonly ambiente: NFeAmbiente;
  readonly uf: string;
  readonly xmlBuilder?: XmlBuilder;
  readonly xmlSigner?: XmlSigner;
  readonly transport?: SefazTransport;
  readonly certificate?: CertificateProvider;
};

export type CancelaInput = {
  readonly chaveAcesso: string;
  readonly cnpj: string;
  readonly protocolo: string;
  readonly justificativa: string;
};

export type CartaCorrecaoInput = {
  readonly chaveAcesso: string;
  readonly cnpj: string;
  readonly correcao: string;
  readonly sequencia?: number;
};

export type InutilizaInput = {
  readonly cnpj: string;
  readonly uf?: string;
  readonly ano: number;
  readonly serie: number;
  readonly numeroInicial: number;
  readonly numeroFinal: number;
  readonly justificativa: string;
};

export type ManifestacaoInput = {
  readonly chaveAcesso: string;
  readonly cnpj: string;
  readonly justificativa?: string;
};

type Manifestar = {
  confirmar(input: ManifestacaoInput): Promise<ManifestacaoResult>;
  ciencia(input: ManifestacaoInput): Promise<ManifestacaoResult>;
  desconhecer(input: ManifestacaoInput): Promise<ManifestacaoResult>;
  naoRealizada(input: ManifestacaoInput): Promise<ManifestacaoResult>;
};

function toEnvironment(ambiente: NFeAmbiente): NFeEnvironment {
  return ambiente === 'homologacao' ? 'homologation' : 'production';
}

export class NFeCore {
  private readonly certificate: CertificateProvider;
  private readonly xmlBuilder: XmlBuilder;
  private readonly xmlSigner: XmlSigner;
  private readonly transport: SefazTransport;
  private readonly environment: NFeEnvironment;
  private readonly uf: string;
  readonly manifestar: Manifestar;

  private constructor(config: NFeCoreConfig) {
    this.certificate = config.certificate ?? new A1CertificateProvider(config.pfx, config.senha);
    this.xmlBuilder = config.xmlBuilder ?? new DefaultXmlBuilder();
    this.xmlSigner = config.xmlSigner ?? new DefaultXmlSigner();
    this.transport = config.transport ?? new NodeHttpSefazTransport();
    this.environment = toEnvironment(config.ambiente);
    this.uf = config.uf;

    const manifestacaoUseCase = new ManifestacaoUseCase({
      certificate: this.certificate,
      transport: this.transport,
      xmlSigner: this.xmlSigner,
      environment: this.environment
    });

    this.manifestar = {
      confirmar: (input: ManifestacaoInput): Promise<ManifestacaoResult> =>
        manifestacaoUseCase.confirmar(input),
      ciencia: (input: ManifestacaoInput): Promise<ManifestacaoResult> =>
        manifestacaoUseCase.ciencia(input),
      desconhecer: (input: ManifestacaoInput): Promise<ManifestacaoResult> =>
        manifestacaoUseCase.desconhecer(input),
      naoRealizada: (input: ManifestacaoInput): Promise<ManifestacaoResult> =>
        manifestacaoUseCase.naoRealizada(input)
    };
  }

  static create(config: NFeCoreConfig): NFeCore {
    return new NFeCore(config);
  }

  async transmitir(nfe: NFeProps): Promise<TransmitResult> {
    const useCase = new TransmitNFeUseCase({
      xmlBuilder: this.xmlBuilder,
      xmlSigner: this.xmlSigner,
      certificate: this.certificate,
      transport: this.transport,
      environment: this.environment,
      uf: this.uf
    });
    return useCase.execute(nfe);
  }

  async consultarProtocolo(chaveAcesso: string): Promise<ConsultResult> {
    const useCase = new ConsultProtocolUseCase({
      certificate: this.certificate,
      transport: this.transport,
      environment: this.environment
    });
    return useCase.execute(chaveAcesso);
  }

  async cancelar(input: CancelaInput): Promise<EventoResult> {
    const useCase = new CancelaNFeUseCase({
      certificate: this.certificate,
      transport: this.transport,
      xmlSigner: this.xmlSigner,
      environment: this.environment
    });
    return useCase.execute(input);
  }

  async cartaCorrecao(input: CartaCorrecaoInput): Promise<EventoResult> {
    const useCase = new CartaCorrecaoUseCase({
      certificate: this.certificate,
      transport: this.transport,
      xmlSigner: this.xmlSigner,
      environment: this.environment
    });
    return useCase.execute(input);
  }

  async inutilizar(input: InutilizaInput): Promise<InutilizacaoResult> {
    const useCase = new InutilizaNFeUseCase({
      certificate: this.certificate,
      transport: this.transport,
      xmlSigner: this.xmlSigner,
      environment: this.environment
    });
    return useCase.execute({
      ...input,
      uf: input.uf ?? this.uf
    });
  }

  async distribuicaoPorNSU(
    cnpj: string,
    ultNSU?: string
  ): Promise<DistribuicaoResult> {
    const useCase = new DistribuicaoDFeUseCase({
      certificate: this.certificate,
      transport: this.transport,
      environment: this.environment
    });
    return useCase.consultarPorNSU(cnpj, this.uf, ultNSU);
  }

  async distribuicaoPorChave(
    cnpj: string,
    chaveAcesso: string
  ): Promise<DistribuicaoResult> {
    const useCase = new DistribuicaoDFeUseCase({
      certificate: this.certificate,
      transport: this.transport,
      environment: this.environment
    });
    return useCase.consultarPorChave(cnpj, this.uf, chaveAcesso);
  }

  async danfe(xmlAutorizado: string): Promise<Buffer> {
    const useCase = new GerarDanfeUseCase();
    return useCase.execute(xmlAutorizado);
  }
}
