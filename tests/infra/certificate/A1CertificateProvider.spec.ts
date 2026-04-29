import { describe, it } from 'node:test';
import assert from 'node:assert';
import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { CertificateError } from '@nfe/shared/errors/CertificateError';
import { generateTestCertificate } from '../../helpers/generate-test-certificate';

describe('A1CertificateProvider', () => {
  it('should load a valid .pfx certificate', async () => {
    const { pfx, password } = generateTestCertificate();
    const provider = new A1CertificateProvider(pfx, password);
    const data = await provider.load();

    assert.ok(data.privateKey.includes('BEGIN PRIVATE KEY'));
    assert.ok(data.certPem.includes('BEGIN CERTIFICATE'));
    assert.ok(data.notAfter instanceof Date);
    assert.ok(data.notAfter > new Date());
    assert.deepStrictEqual(data.pfx, pfx);
    assert.strictEqual(data.password, password);
  });

  it('should throw CertificateError for wrong password', async () => {
    const { pfx } = generateTestCertificate();
    const provider = new A1CertificateProvider(pfx, 'wrong-password');

    await assert.rejects(
      () => provider.load(),
      (error: unknown) => {
        assert.ok(error instanceof CertificateError);
        assert.ok(error.message.includes('Falha ao carregar certificado A1'));
        return true;
      }
    );
  });

  it('should throw CertificateError for expired certificate', async () => {
    const { pfx, password } = generateTestCertificate({ days: 1 });
    const provider = new A1CertificateProvider(pfx, password);

    // Mock Date to return a date 2 years in the future
    const OriginalDate = globalThis.Date;
    const futureMs = OriginalDate.now() + 2 * 365 * 24 * 60 * 60 * 1000;
    globalThis.Date = class extends OriginalDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(futureMs);
        } else {
          // @ts-expect-error - forwarding constructor args
          super(...args);
        }
      }

      static override now(): number {
        return futureMs;
      }
    } as DateConstructor;

    try {
      await assert.rejects(
        () => provider.load(),
        (error: unknown) => {
          assert.ok(error instanceof CertificateError);
          assert.ok(error.message.includes('expirado'));
          return true;
        }
      );
    } finally {
      globalThis.Date = OriginalDate;
    }
  });

  it('should throw CertificateError for invalid buffer', async () => {
    const provider = new A1CertificateProvider(Buffer.from('invalid'), 'test');

    await assert.rejects(
      () => provider.load(),
      (error: unknown) => {
        assert.ok(error instanceof CertificateError);
        return true;
      }
    );
  });
});
