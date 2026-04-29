// Core
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
export type { ProdutoProps, ICMSProps, PISProps, COFINSProps } from './domain/entities/Produto';
export type { TransporteProps } from './domain/entities/Transporte';
export type { PagamentoProps, FormaPagamentoProps } from './domain/entities/Pagamento';

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

// Errors
export { NFeError } from './shared/errors/NFeError';
export { SchemaValidationError } from './shared/errors/SchemaValidationError';
export type { FieldError } from './shared/errors/SchemaValidationError';
export { SefazRejectError } from './shared/errors/SefazRejectError';
export { CertificateError } from './shared/errors/CertificateError';
