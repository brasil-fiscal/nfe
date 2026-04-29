import { request as httpsRequest } from 'node:https';
import { URL } from 'node:url';
import { SefazTransport, SefazRequest, SefazResponse } from '@nfe/contracts/SefazTransport';
import { NFeError } from '@nfe/shared/errors/NFeError';

export class NodeHttpSefazTransport implements SefazTransport {
  private readonly timeout: number;
  private readonly rejectUnauthorized: boolean;

  constructor(options?: { timeout?: number; rejectUnauthorized?: boolean }) {
    this.timeout = options?.timeout ?? 30000;
    this.rejectUnauthorized = options?.rejectUnauthorized ?? false;
  }

  async send(req: SefazRequest): Promise<SefazResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(req.url);

      const httpReq = httpsRequest(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': `application/soap+xml; charset=utf-8; action="${req.soapAction}"`,
            'SOAPAction': req.soapAction,
            'Content-Length': Buffer.byteLength(req.xml, 'utf-8')
          },
          pfx: req.pfx,
          passphrase: req.password,
          rejectUnauthorized: this.rejectUnauthorized,
          timeout: this.timeout
        },
        (res) => {
          const chunks: Buffer[] = [];

          res.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            const statusCode = res.statusCode ?? 0;

            if (statusCode < 200 || statusCode >= 300) {
              reject(
                new NFeError(`Erro HTTP ${statusCode} ao comunicar com SEFAZ: ${body.slice(0, 500)}`)
              );
              return;
            }

            resolve({ xml: body, statusCode });
          });

          res.on('error', (err) => {
            reject(
              new NFeError(
                `Erro ao ler resposta da SEFAZ: ${err.message}`,
                err
              )
            );
          });
        }
      );

      httpReq.on('timeout', () => {
        httpReq.destroy();
        reject(new NFeError('Timeout ao comunicar com SEFAZ'));
      });

      httpReq.on('error', (err) => {
        reject(
          new NFeError(
            `Erro de conexao com SEFAZ: ${err.message}`,
            err
          )
        );
      });

      httpReq.write(req.xml);
      httpReq.end();
    });
  }
}
