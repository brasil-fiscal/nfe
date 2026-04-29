import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

type TestCertificateOptions = {
  readonly password?: string;
  readonly days?: number;
  readonly cn?: string;
};

type TestCertificate = {
  readonly pfx: Buffer;
  readonly password: string;
};

export function generateTestCertificate(options?: TestCertificateOptions): TestCertificate {
  const password = options?.password ?? 'test1234';
  const days = options?.days ?? 365;
  const cn = options?.cn ?? 'Test NFe Certificate';

  const tmpDir = mkdtempSync(join(tmpdir(), 'nfe-cert-'));
  const keyPath = join(tmpDir, 'key.pem');
  const certPath = join(tmpDir, 'cert.pem');
  const pfxPath = join(tmpDir, 'cert.pfx');

  try {
    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048 2>/dev/null`);

    // Generate self-signed certificate
    execSync(
      `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days ${days} ` +
      `-subj "/CN=${cn}/O=Test/C=BR" 2>/dev/null`
    );

    // Export to PKCS#12 (.pfx)
    execSync(
      `openssl pkcs12 -export -out "${pfxPath}" -inkey "${keyPath}" -in "${certPath}" ` +
      `-passout pass:${password} 2>/dev/null`
    );

    const pfx = readFileSync(pfxPath);

    return { pfx, password };
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
