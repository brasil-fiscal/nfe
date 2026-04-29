import { createSign, createHash } from 'node:crypto';
import { XmlSigner } from '@nfe/contracts/XmlSigner';
import { CertificateData } from '@nfe/contracts/CertificateProvider';
import { canonicalize } from './canonicalize';

const SIGNATURE_NS = 'http://www.w3.org/2000/09/xmldsig#';
const C14N_ALGORITHM = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
const ENVELOPED_SIGNATURE = 'http://www.w3.org/2000/09/xmldsig#enveloped-signature';
const SHA1_ALGORITHM = 'http://www.w3.org/2000/09/xmldsig#sha1';
const RSA_SHA1_ALGORITHM = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';

export class DefaultXmlSigner implements XmlSigner {
  sign(xml: string, certificate: CertificateData): string {
    const infNFeMatch = xml.match(/<infNFe[^>]*>[\s\S]*<\/infNFe>/);
    if (!infNFeMatch) {
      throw new Error('Elemento <infNFe> nao encontrado no XML');
    }

    const idMatch = infNFeMatch[0].match(/Id="([^"]+)"/);
    if (!idMatch) {
      throw new Error('Atributo Id nao encontrado em <infNFe>');
    }

    const referenceUri = `#${idMatch[1]}`;
    const infNFeCanonicalized = canonicalize(infNFeMatch[0]);

    // Digest do conteudo de <infNFe>
    const digest = createHash('sha1').update(infNFeCanonicalized).digest('base64');

    // Montar SignedInfo
    const signedInfo =
      `<SignedInfo xmlns="${SIGNATURE_NS}">` +
      `<CanonicalizationMethod Algorithm="${C14N_ALGORITHM}"/>` +
      `<SignatureMethod Algorithm="${RSA_SHA1_ALGORITHM}"/>` +
      `<Reference URI="${referenceUri}">` +
      '<Transforms>' +
      `<Transform Algorithm="${ENVELOPED_SIGNATURE}"/>` +
      `<Transform Algorithm="${C14N_ALGORITHM}"/>` +
      '</Transforms>' +
      `<DigestMethod Algorithm="${SHA1_ALGORITHM}"/>` +
      `<DigestValue>${digest}</DigestValue>` +
      '</Reference>' +
      '</SignedInfo>';

    const signedInfoCanonicalized = canonicalize(signedInfo);

    // Assinar com RSA-SHA1
    const signer = createSign('RSA-SHA1');
    signer.update(signedInfoCanonicalized);
    const signatureValue = signer.sign(certificate.privateKey, 'base64');

    // Extrair certificado X509 (base64, sem headers PEM)
    const x509Content = certificate.certPem
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '');

    // Montar bloco Signature
    const signature =
      `<Signature xmlns="${SIGNATURE_NS}">` +
      signedInfo +
      `<SignatureValue>${signatureValue}</SignatureValue>` +
      '<KeyInfo>' +
      '<X509Data>' +
      `<X509Certificate>${x509Content}</X509Certificate>` +
      '</X509Data>' +
      '</KeyInfo>' +
      '</Signature>';

    // Inserir Signature apos </infNFe> dentro de <NFe>
    return xml.replace('</infNFe></NFe>', `</infNFe>${signature}</NFe>`);
  }
}
