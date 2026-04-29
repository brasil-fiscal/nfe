import { execFileSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import { CertificateProvider, CertificateData } from '@nfe/contracts/CertificateProvider';
import { CertificateError } from '@nfe/shared/errors/CertificateError';

export class A1CertificateProvider implements CertificateProvider {
  constructor(
    private readonly pfx: Buffer,
    private readonly password: string
  ) {}

  async load(): Promise<CertificateData> {
    try {
      const privateKey = this.extractPrivateKey();
      const certPem = this.extractCertificate();

      const cert = new X509Certificate(certPem);
      const notAfter = new Date(cert.validTo);

      if (notAfter < new Date()) {
        throw new CertificateError(
          `Certificado expirado em ${notAfter.toISOString()}`
        );
      }

      return {
        pfx: this.pfx,
        password: this.password,
        notAfter,
        privateKey,
        certPem
      };
    } catch (error) {
      if (error instanceof CertificateError) throw error;

      const message = error instanceof Error ? error.message : String(error);
      throw new CertificateError(
        `Falha ao carregar certificado A1: ${message}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private extractPrivateKey(): string {
    const output = execFileSync(
      'openssl',
      ['pkcs12', '-nocerts', '-nodes', '-passin', `pass:${this.password}`],
      { input: this.pfx, stdio: ['pipe', 'pipe', 'pipe'] }
    ).toString();

    const match = output.match(
      /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/
    );

    if (!match) {
      throw new CertificateError('Chave privada nao encontrada no certificado PFX');
    }

    return match[0];
  }

  private extractCertificate(): string {
    const output = execFileSync(
      'openssl',
      ['pkcs12', '-clcerts', '-nokeys', '-passin', `pass:${this.password}`],
      { input: this.pfx, stdio: ['pipe', 'pipe', 'pipe'] }
    ).toString();

    const match = output.match(
      /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/
    );

    if (!match) {
      throw new CertificateError('Certificado nao encontrado no arquivo PFX');
    }

    return match[0];
  }
}
