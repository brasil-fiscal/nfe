# Providers — Como Criar Providers Customizados

A lib `brasil-fiscal-nfe` usa o padrao Provider/Plugin. Cada integracao externa eh definida por um contrato (interface). Voce pode substituir qualquer implementacao padrao pela sua propria.

## Contratos disponuveis

| Contrato | Responsabilidade | Implementacao padrao |
|----------|-----------------|---------------------|
| `CertificateProvider` | Carregar e usar certificados digitais | `A1CertificateProvider` |
| `SefazTransport` | Comunicacao HTTP com a SEFAZ | `NodeHttpSefazTransport` |
| `XmlBuilder` | Gerar XML a partir das entidades | `DefaultXmlBuilder` |
| `XmlSigner` | Assinar XML com certificado digital | `DefaultXmlSigner` |
| `SchemaValidator` | Validar XML contra XSD | `XsdSchemaValidator` |

## Criando um CertificateProvider customizado

Exemplo: provider que carrega certificado de um cofre (vault).

```typescript
import { CertificateProvider, CertificateData } from 'brasil-fiscal-nfe/contracts';

export class VaultCertificateProvider implements CertificateProvider {
  constructor(private readonly vaultUrl: string, private readonly secretId: string) {}

  async load(): Promise<CertificateData> {
    // Busca o certificado no vault
    const response = await fetch(`${this.vaultUrl}/secrets/${this.secretId}`);
    const secret = await response.json();

    return {
      pfx: Buffer.from(secret.pfx, 'base64'),
      password: secret.password,
      notAfter: new Date(secret.expiresAt)
    };
  }
}
```

Uso:

```typescript
const nfe = NFeCore.create({
  certificate: new VaultCertificateProvider('https://vault.empresa.com', 'cert-nfe'),
  transport: new NodeHttpSefazTransport(),
  environment: 'production'
});
```

## Criando um SefazTransport customizado

Exemplo: provider que usa um proxy interno para comunicacao com a SEFAZ.

```typescript
import { SefazTransport, SefazRequest, SefazResponse } from 'brasil-fiscal-nfe/contracts';

export class ProxySefazTransport implements SefazTransport {
  constructor(private readonly proxyUrl: string) {}

  async send(request: SefazRequest): Promise<SefazResponse> {
    // Envia via proxy interno ao inves de direto pra SEFAZ
    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: request.url,
        soapAction: request.soapAction,
        xml: request.xml
      })
    });

    const data = await response.json();
    return {
      xml: data.responseXml,
      statusCode: data.statusCode
    };
  }
}
```

## Criando um XmlBuilder customizado

Exemplo: provider que gera XML usando uma lib externa.

```typescript
import { XmlBuilder } from 'brasil-fiscal-nfe/contracts';
import { NFe } from 'brasil-fiscal-nfe/domain';

export class CustomXmlBuilder implements XmlBuilder {
  build(nfe: NFe): string {
    // Sua logica de geracao de XML
    // Deve retornar XML valido no layout SEFAZ 4.00
    return xmlString;
  }
}
```

## Regras para providers

1. **Implemente a interface completa** — todos os metodos sao obrigatorios
2. **Respeite os tipos de retorno** — nao altere a assinatura
3. **Lance erros tipados** — use as classes de erro da lib (`CertificateError`, `NFeError`)
4. **Nao dependa de estado global** — receba tudo via construtor
5. **Documente dependencias externas** — se seu provider usa uma lib, documente no README

## Publicando seu provider

Se voce criar um provider util para a comunidade, considere publicar como pacote npm:

- Nome sugerido: `brasil-fiscal-nfe-provider-<nome>`
- Adicione `brasil-fiscal-nfe` como `peerDependency`
- Inclua testes e documentacao
- Abra uma issue no repositorio principal para ser listado no README
