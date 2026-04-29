import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createVerify, createHash } from 'node:crypto';
import { DefaultXmlSigner } from '@nfe/infra/xml/DefaultXmlSigner';
import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { CertificateData } from '@nfe/contracts/CertificateProvider';
import { canonicalize } from '@nfe/infra/xml/canonicalize';
import { generateTestCertificate } from '../../helpers/generate-test-certificate';

const SAMPLE_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">' +
  '<infNFe versao="4.00" Id="NFe51260411222333000181550010000000011123456789">' +
  '<ide><cUF>51</cUF><natOp>Venda</natOp></ide>' +
  '<emit><CNPJ>11222333000181</CNPJ><xNome>Empresa Teste</xNome></emit>' +
  '<det nItem="1"><prod><cProd>001</cProd><xProd>Produto</xProd></prod></det>' +
  '<total><ICMSTot><vNF>100.00</vNF></ICMSTot></total>' +
  '</infNFe>' +
  '</NFe>';

async function loadTestCertificate(): Promise<CertificateData> {
  const { pfx, password } = generateTestCertificate();
  const provider = new A1CertificateProvider(pfx, password);
  return provider.load();
}

describe('DefaultXmlSigner', () => {
  it('should insert Signature element after infNFe', async () => {
    const cert = await loadTestCertificate();
    const signer = new DefaultXmlSigner();
    const signedXml = signer.sign(SAMPLE_XML, cert);

    assert.ok(signedXml.includes('<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">'));
    assert.ok(signedXml.includes('</Signature></NFe>'));
    assert.ok(signedXml.includes('<SignedInfo'));
    assert.ok(signedXml.includes('<SignatureValue>'));
    assert.ok(signedXml.includes('<X509Certificate>'));
  });

  it('should reference the correct infNFe Id', async () => {
    const cert = await loadTestCertificate();
    const signer = new DefaultXmlSigner();
    const signedXml = signer.sign(SAMPLE_XML, cert);

    assert.ok(
      signedXml.includes(
        'URI="#NFe51260411222333000181550010000000011123456789"'
      )
    );
  });

  it('should produce a valid RSA-SHA1 signature', async () => {
    const cert = await loadTestCertificate();
    const signer = new DefaultXmlSigner();
    const signedXml = signer.sign(SAMPLE_XML, cert);

    // Extract SignatureValue
    const sigValueMatch = signedXml.match(
      /<SignatureValue>([^<]+)<\/SignatureValue>/
    );
    assert.ok(sigValueMatch);
    const signatureValue = Buffer.from(sigValueMatch![1], 'base64');

    // Extract and canonicalize SignedInfo
    const signedInfoMatch = signedXml.match(
      /<SignedInfo xmlns="http:\/\/www\.w3\.org\/2000\/09\/xmldsig#">[\s\S]*?<\/SignedInfo>/
    );
    assert.ok(signedInfoMatch);
    const signedInfoCanonicalized = canonicalize(signedInfoMatch![0]);

    // Verify signature using public key from certificate
    const verifier = createVerify('RSA-SHA1');
    verifier.update(signedInfoCanonicalized);
    const isValid = verifier.verify(cert.certPem, signatureValue);

    assert.strictEqual(isValid, true, 'Signature verification failed');
  });

  it('should produce a valid SHA-1 digest of infNFe', async () => {
    const cert = await loadTestCertificate();
    const signer = new DefaultXmlSigner();
    const signedXml = signer.sign(SAMPLE_XML, cert);

    // Extract DigestValue
    const digestMatch = signedXml.match(/<DigestValue>([^<]+)<\/DigestValue>/);
    assert.ok(digestMatch);

    // Compute expected digest
    const infNFeMatch = SAMPLE_XML.match(/<infNFe[^>]*>[\s\S]*<\/infNFe>/);
    assert.ok(infNFeMatch);
    const infNFeCanonicalized = canonicalize(infNFeMatch![0]);
    const expectedDigest = createHash('sha1')
      .update(infNFeCanonicalized)
      .digest('base64');

    assert.strictEqual(digestMatch![1], expectedDigest);
  });

  it('should include the X509 certificate in KeyInfo', async () => {
    const cert = await loadTestCertificate();
    const signer = new DefaultXmlSigner();
    const signedXml = signer.sign(SAMPLE_XML, cert);

    // Extract X509Certificate content
    const x509Match = signedXml.match(/<X509Certificate>([^<]+)<\/X509Certificate>/);
    assert.ok(x509Match);

    // Verify it matches the certificate
    const expectedContent = cert.certPem
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '');

    assert.strictEqual(x509Match![1], expectedContent);
  });

  it('should throw when infNFe element is missing', () => {
    const signer = new DefaultXmlSigner();
    const invalidXml = '<NFe><other/></NFe>';

    assert.throws(
      () => signer.sign(invalidXml, {} as CertificateData),
      /infNFe/
    );
  });

  it('should throw when Id attribute is missing', () => {
    const signer = new DefaultXmlSigner();
    const invalidXml = '<NFe><infNFe><ide/></infNFe></NFe>';

    assert.throws(
      () => signer.sign(invalidXml, {} as CertificateData),
      /Id/
    );
  });

  it('should preserve the original XML structure', async () => {
    const cert = await loadTestCertificate();
    const signer = new DefaultXmlSigner();
    const signedXml = signer.sign(SAMPLE_XML, cert);

    // Original content should still be present
    assert.ok(signedXml.includes('<cUF>51</cUF>'));
    assert.ok(signedXml.includes('<CNPJ>11222333000181</CNPJ>'));
    assert.ok(signedXml.includes('<vNF>100.00</vNF>'));
    assert.ok(signedXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  });
});
