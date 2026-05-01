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

// Contracts (re-exported from @brasil-fiscal/core)
export type {
  CertificateProvider,
  CertificateData,
  SefazTransport,
  SefazRequest,
  SefazResponse,
  XmlSigner,
  SchemaValidator,
  ValidationResult,
  ValidationError
} from '@brasil-fiscal/core';
export type { XmlBuilder } from './contracts/XmlBuilder';

// Infrastructure (re-exported from @brasil-fiscal/core)
export {
  A1CertificateProvider,
  DefaultXmlSigner,
  NodeHttpSefazTransport
} from '@brasil-fiscal/core';
export { DefaultXmlBuilder } from './infra/xml/DefaultXmlBuilder';
export { XsdSchemaValidator } from './infra/schema/XsdSchemaValidator';

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
export { GerarCupomUseCase } from './application/use-cases/GerarCupomUseCase';
export type { CupomData } from './application/use-cases/GerarCupomUseCase';

// SEFAZ URLs
export { getSefazUrl, ibgeToUf, UF_AUTORIZADOR, AUTORIZADOR_URLS } from './shared/constants/sefaz-urls';
export type { SefazService, SefazEnvironment, Autorizador } from './shared/constants/sefaz-urls';
export { getAnUrl } from './shared/constants/sefaz-an-urls';
export type { AnService, AnEnvironment } from './shared/constants/sefaz-an-urls';

// NFC-e
export { buildNFCeQRCodeUrl, buildInfNFeSupl } from './shared/helpers/nfce-qrcode';
export type { NFCeQRCodeParams } from './shared/helpers/nfce-qrcode';
export { getNFCeQRCodeUrl, getNFCeConsultaUrl } from './shared/constants/nfce-urls';
export type { NFCeEnvironment } from './shared/constants/nfce-urls';

// Errors
export { NFeError } from './shared/errors/NFeError';
export {
  DFeError,
  SchemaValidationError,
  SefazRejectError,
  CertificateError
} from '@brasil-fiscal/core';
export type { FieldError } from '@brasil-fiscal/core';
