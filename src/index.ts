// Core
export { NFeCore } from './core/NFeCore';
export type {
  NFeCoreConfig,
  NFeAmbiente,
  CancelaInput,
  CartaCorrecaoInput,
  InutilizaInput,
  ManifestacaoInput
} from './core/NFeCore';
export type { NFeConfig, NFeEnvironment, TransmitResult, ConsultResult } from './core/types';

// Domain entities
export { NFe } from './domain/entities/NFe';
export type {
  NFeProps,
  NFeIdentificacao
} from './domain/entities/NFe';
export type { EmitenteProps } from './domain/entities/Emitente';
export type { DestinatarioProps } from './domain/entities/Destinatario';
export type { EnderecoProps } from './domain/entities/Endereco';
export type { ProdutoProps, ICMSProps, PISProps, COFINSProps, IPIProps } from './domain/entities/Produto';
export type { TransporteProps, VolumeProps, VeiculoTranspProps } from './domain/entities/Transporte';
export type { PagamentoProps, FormaPagamentoProps } from './domain/entities/Pagamento';
export type { CobrancaProps, FaturaProps, DuplicataProps } from './domain/entities/Cobranca';

// Contracts
export type {
  CertificateProvider,
  CertificateData
} from './contracts/CertificateProvider';
export type { SefazTransport, SefazRequest, SefazResponse } from './contracts/SefazTransport';
export type { XmlBuilder } from './contracts/XmlBuilder';
export type { XmlSigner } from './contracts/XmlSigner';
export type {
  SchemaValidator,
  ValidationResult,
  ValidationError
} from './contracts/SchemaValidator';

// Infrastructure
export { DefaultXmlBuilder } from './infra/xml/DefaultXmlBuilder';
export { DefaultXmlSigner } from './infra/xml/DefaultXmlSigner';
export { A1CertificateProvider } from './infra/certificate/A1CertificateProvider';
export { XsdSchemaValidator } from './infra/schema/XsdSchemaValidator';
export { NodeHttpSefazTransport } from './infra/sefaz/NodeHttpSefazTransport';

// Use cases
export { TransmitNFeUseCase } from './application/use-cases/TransmitNFeUseCase';
export { ConsultProtocolUseCase } from './application/use-cases/ConsultProtocolUseCase';
export { DistribuicaoDFeUseCase } from './application/use-cases/DistribuicaoDFeUseCase';
export type { DistribuicaoResult, DFeDocument } from './application/use-cases/DistribuicaoDFeUseCase';
export { CancelaNFeUseCase } from './application/use-cases/CancelaNFeUseCase';
export type { EventoResult } from './application/use-cases/CancelaNFeUseCase';
export { CartaCorrecaoUseCase } from './application/use-cases/CartaCorrecaoUseCase';
export { InutilizaNFeUseCase } from './application/use-cases/InutilizaNFeUseCase';
export type { InutilizacaoResult } from './application/use-cases/InutilizaNFeUseCase';
export { ManifestacaoUseCase } from './application/use-cases/ManifestacaoUseCase';
export type { ManifestacaoResult, TipoManifestacao } from './application/use-cases/ManifestacaoUseCase';
export { GerarDanfeUseCase } from './application/use-cases/GerarDanfeUseCase';
export type { DanfeData } from './application/use-cases/GerarDanfeUseCase';

// SEFAZ URLs
export { getSefazUrl, ibgeToUf, UF_AUTORIZADOR, AUTORIZADOR_URLS } from './shared/constants/sefaz-urls';
export type { SefazService, SefazEnvironment, Autorizador } from './shared/constants/sefaz-urls';
export { getAnUrl } from './shared/constants/sefaz-an-urls';
export type { AnService, AnEnvironment } from './shared/constants/sefaz-an-urls';

// Errors
export { NFeError } from './shared/errors/NFeError';
export { SchemaValidationError } from './shared/errors/SchemaValidationError';
export type { FieldError } from './shared/errors/SchemaValidationError';
export { SefazRejectError } from './shared/errors/SefazRejectError';
export { CertificateError } from './shared/errors/CertificateError';
