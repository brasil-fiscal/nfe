# @brasil-fiscal/nfe

Lib open-source em TypeScript para emissao de **NFe (Nota Fiscal Eletronica)** no Brasil. Arquitetura limpa, zero dependencias de runtime, totalmente plugavel.

## Instalacao

```bash
npm install @brasil-fiscal/nfe
```

Para gerar DANFE (PDF), instale tambem:

```bash
npm install pdfkit
```

## Features

- Geracao de XML da NFe (layout SEFAZ 4.00)
- Assinatura digital com certificado A1 (.pfx/.p12)
- Validacao contra schemas XSD oficiais
- Transmissao para SEFAZ via HTTPS com mTLS (modo sincrono)
- Consulta de protocolo de autorizacao
- Distribuicao DFe (consulta de NFes recebidas)
- Cancelamento de NFe
- Carta de Correcao (CC-e)
- Inutilizacao de numeracao
- Manifestacao do Destinatario (confirmacao, ciencia, desconhecimento, nao realizada)
- Geracao de DANFE em PDF
- URLs de todos os 27 estados (14 autorizadores)
- Providers plugaveis para certificado, transporte, XML e assinatura

## Uso

### 1. Gerar XML

```typescript
import { DefaultXmlBuilder } from '@brasil-fiscal/nfe';

const builder = new DefaultXmlBuilder();
const xml = builder.build({
  identificacao: {
    naturezaOperacao: 'Venda de mercadoria',
    tipoOperacao: 1,
    destinoOperacao: 1,
    finalidade: 1,
    consumidorFinal: 1,
    presencaComprador: 1,
    uf: 'MT',
    municipio: '5103403',
    serie: 1,
    numero: 1
  },
  emitente: {
    cnpj: '12345678000195',
    razaoSocial: 'Empresa Teste Ltda',
    inscricaoEstadual: '131234567',
    regimeTributario: 1,
    endereco: {
      logradouro: 'Rua das Flores',
      numero: '100',
      bairro: 'Centro',
      codigoMunicipio: '5103403',
      municipio: 'Cuiaba',
      uf: 'MT',
      cep: '78005000'
    }
  },
  destinatario: {
    cpf: '52998224725',
    nome: 'Joao da Silva',
    indicadorIE: 9,
    endereco: {
      logradouro: 'Av Brasil',
      numero: '500',
      bairro: 'Centro',
      codigoMunicipio: '5103403',
      municipio: 'Cuiaba',
      uf: 'MT',
      cep: '78010100'
    }
  },
  produtos: [
    {
      numero: 1,
      codigo: '001',
      descricao: 'Produto Teste',
      ncm: '84714900',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 2,
      valorUnitario: 49.90,
      valorTotal: 99.80,
      icms: { origem: 0, csosn: '102' },
      pis: { cst: '49' },
      cofins: { cst: '49' }
    }
  ],
  transporte: { modalidadeFrete: 9 },
  pagamento: {
    pagamentos: [{ formaPagamento: '01', valor: 99.80 }]
  }
});
```

### 2. Assinar com certificado A1

```typescript
import { A1CertificateProvider, DefaultXmlSigner } from '@brasil-fiscal/nfe';
import { readFileSync } from 'node:fs';

const certificate = new A1CertificateProvider(
  readFileSync('./certificado.pfx'),
  'senha-do-certificado'
);

const signer = new DefaultXmlSigner();
const cert = await certificate.load();
const signedXml = signer.sign(xml, cert);
```

### 3. Transmitir para SEFAZ

```typescript
import {
  NodeHttpSefazTransport,
  TransmitNFeUseCase,
  DefaultXmlBuilder,
  DefaultXmlSigner,
  A1CertificateProvider
} from '@brasil-fiscal/nfe';

const useCase = new TransmitNFeUseCase({
  xmlBuilder: new DefaultXmlBuilder(),
  xmlSigner: new DefaultXmlSigner(),
  certificate: new A1CertificateProvider(pfxBuffer, 'senha'),
  transport: new NodeHttpSefazTransport(),
  environment: 'homologation',
  uf: 'MT'
});

const result = await useCase.execute(nfeProps);
console.log(result.autorizada);    // true
console.log(result.protocolo);     // '151240000012345'
console.log(result.chaveAcesso);   // 44 digitos
```

### 4. Consultar protocolo

```typescript
import { ConsultProtocolUseCase } from '@brasil-fiscal/nfe';

const consulta = new ConsultProtocolUseCase({
  certificate,
  transport: new NodeHttpSefazTransport(),
  environment: 'homologation'
});

const result = await consulta.execute('51240412345678000195550010000000011234567890');
console.log(result.codigoStatus); // '100'
console.log(result.protocolo);    // '151240000012345'
```

### 5. Cancelar NFe

```typescript
import { CancelaNFeUseCase } from '@brasil-fiscal/nfe';

const cancelar = new CancelaNFeUseCase({
  certificate,
  transport: new NodeHttpSefazTransport(),
  xmlSigner: new DefaultXmlSigner(),
  environment: 'homologation'
});

const result = await cancelar.execute({
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195',
  protocolo: '151240000012345',
  justificativa: 'Erro na emissao da nota fiscal eletronica'
});
```

### 6. Carta de Correcao (CC-e)

```typescript
import { CartaCorrecaoUseCase } from '@brasil-fiscal/nfe';

const cce = new CartaCorrecaoUseCase({
  certificate,
  transport: new NodeHttpSefazTransport(),
  xmlSigner: new DefaultXmlSigner(),
  environment: 'homologation'
});

const result = await cce.execute({
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195',
  correcao: 'Correcao do endereco do destinatario para Rua ABC 123',
  sequencia: 1  // opcional, default 1
});
```

### 7. Inutilizar numeracao

```typescript
import { InutilizaNFeUseCase } from '@brasil-fiscal/nfe';

const inutilizar = new InutilizaNFeUseCase({
  certificate,
  transport: new NodeHttpSefazTransport(),
  xmlSigner: new DefaultXmlSigner(),
  environment: 'homologation'
});

const result = await inutilizar.execute({
  cnpj: '12345678000195',
  uf: 'MT',
  ano: 2024,
  serie: 1,
  numeroInicial: 10,
  numeroFinal: 20,
  justificativa: 'Numeracao pulada por erro no sistema emissor'
});
```

### 8. Consultar NFes recebidas (Distribuicao DFe)

```typescript
import { DistribuicaoDFeUseCase } from '@brasil-fiscal/nfe';

const distribuicao = new DistribuicaoDFeUseCase({
  certificate,
  transport: new NodeHttpSefazTransport(),
  environment: 'homologation'
});

// Por ultimo NSU (paginacao manual)
const result = await distribuicao.consultarPorNSU('12345678000195', 'MT', '0');
console.log(result.documentos);  // Array de { nsu, schema, xml }
console.log(result.ultNSU);      // Usar como input da proxima chamada

// Por chave de acesso
const result2 = await distribuicao.consultarPorChave(
  '12345678000195',
  'MT',
  '51240412345678000195550010000000011234567890'
);
```

### 9. Manifestacao do Destinatario

```typescript
import { ManifestacaoUseCase } from '@brasil-fiscal/nfe';

const manifestacao = new ManifestacaoUseCase({
  certificate,
  transport: new NodeHttpSefazTransport(),
  xmlSigner: new DefaultXmlSigner(),
  environment: 'homologation'
});

// Confirmar operacao
await manifestacao.confirmar({
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195'
});

// Ciencia da operacao
await manifestacao.ciencia({ chaveAcesso: '...', cnpj: '...' });

// Desconhecer operacao (requer justificativa)
await manifestacao.desconhecer({
  chaveAcesso: '...',
  cnpj: '...',
  justificativa: 'Nao reconheco esta operacao comercial'
});

// Operacao nao realizada (requer justificativa)
await manifestacao.naoRealizada({
  chaveAcesso: '...',
  cnpj: '...',
  justificativa: 'Mercadoria devolvida ao remetente'
});
```

### 10. Gerar DANFE (PDF)

```typescript
import { GerarDanfeUseCase } from '@brasil-fiscal/nfe';
import { writeFileSync } from 'node:fs';

const danfe = new GerarDanfeUseCase();
const pdf = await danfe.execute(xmlAutorizado); // XML string com <protNFe>

writeFileSync('danfe.pdf', pdf);
```

> Requer `pdfkit` instalado: `npm install pdfkit`

## Providers plugaveis

A lib usa o padrao Provider. Cada integracao externa eh uma interface que voce pode substituir:

| Provider | Descricao | Default |
|----------|-----------|---------|
| `CertificateProvider` | Carrega certificados digitais | `A1CertificateProvider` (.pfx/.p12) |
| `SefazTransport` | Comunicacao HTTP com a SEFAZ | `NodeHttpSefazTransport` (mTLS) |
| `XmlBuilder` | Gera XML a partir das entidades | `DefaultXmlBuilder` |
| `XmlSigner` | Assina XML com certificado digital | `DefaultXmlSigner` |

Para criar seu proprio provider, veja [docs/PROVIDERS.md](docs/PROVIDERS.md).

## Arquitetura

```
src/
  core/           Tipos e configuracao
  domain/         Entidades puras e schemas Zod
  contracts/      Interfaces dos providers
  application/    Use cases (transmit, consult, cancel, etc.)
  infra/          Implementacoes (XML, SOAP, SEFAZ, DANFE)
  shared/         Constantes (IBGE, CFOP, CST, URLs SEFAZ), helpers, erros
```

Para detalhes completos, veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentacao

| Documento | Descricao |
|-----------|-----------|
| [ROADMAP.md](ROADMAP.md) | Fases e progresso do desenvolvimento |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura detalhada |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Glossario de termos fiscais |
| [docs/PROVIDERS.md](docs/PROVIDERS.md) | Guia para criar providers |
| [docs/EXAMPLES.md](docs/EXAMPLES.md) | Exemplos completos |

## Exemplos

Veja a pasta [`examples/`](examples/) para arquivos de exemplo:
- `nfe-exemplo.xml` — XML de NFe gerado
- `danfe-exemplo.pdf` — DANFE em PDF

Para regenerar: `npx tsx scripts/generate-examples.ts`

## Requisitos

- Node.js >= 18
- Certificado digital A1 (.pfx ou .p12)
- OpenSSL instalado (para carregar certificados e validar XSD)
- `pdfkit` (opcional, apenas para gerar DANFE)

## Desenvolvimento

```bash
git clone https://github.com/brasil-fiscal/nfe.git
cd nfe
npm install
npm test        # 185 testes
npm run lint
npm run build
```

## Contribuindo

Contribuicoes sao bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Inspiracao

- [nfephp-org/sped-nfe](https://github.com/nfephp-org/sped-nfe) — Referencia PHP para NFe
- [nfephp-org/sped-common](https://github.com/nfephp-org/sped-common) — Base comum do sped-nfe

## Licenca

[MIT](LICENSE)
