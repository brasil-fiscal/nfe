# brasil-fiscal-nfe

Lib open-source em TypeScript para emissao de **NFe (Nota Fiscal Eletronica)** no Brasil. Arquitetura limpa, zero dependencias de runtime, totalmente plugavel.

> **Status:** Em desenvolvimento ativo — veja o [ROADMAP](ROADMAP.md) para o progresso atual.

## Por que este projeto?

O ecossistema PHP tem o excelente [nfephp-org/sped-nfe](https://github.com/nfephp-org/sped-nfe). O ecossistema Node.js/TypeScript nao tem nenhum equivalente com:

- Arquitetura limpa e SOLID
- Tipagem forte de ponta a ponta
- Design plugavel (troque providers sem fork)
- Zero dependencias em runtime (usa `node:crypto`, `node:https`)
- Documentacao pensada para humanos e AI agents

## Features (v1)

- Geracao de XML da NFe conforme layout SEFAZ
- Assinatura digital com certificado A1 (.pfx/.p12)
- Validacao contra schemas XSD oficiais
- Transmissao para SEFAZ via HTTPS com mTLS
- Consulta de protocolo de autorizacao
- Providers plugaveis para certificado, transporte, XML e assinatura

> **Foco inicial:** SEFAZ Mato Grosso (MT). Suporte a demais estados sera adicionado progressivamente.

## Quick Start

### Instalacao

```bash
npm install brasil-fiscal-nfe
```

### Uso basico

```typescript
import { NFeCore } from 'brasil-fiscal-nfe';
import { A1CertificateProvider } from 'brasil-fiscal-nfe/providers/certificate-a1';
import { NodeHttpSefazTransport } from 'brasil-fiscal-nfe/providers/sefaz-node-http';
import { readFileSync } from 'node:fs';

// 1. Configurar providers
const certificate = new A1CertificateProvider({
  pfx: readFileSync('./certificado.pfx'),
  password: 'sua-senha'
});

const transport = new NodeHttpSefazTransport();

// 2. Criar instancia
const nfe = NFeCore.create({
  certificate,
  transport,
  environment: 'homologation' // ou 'production'
});

// 3. Gerar, assinar e transmitir
const xml = nfe.xml.generate({
  emitente: {
    cnpj: '11222333000181',
    razaoSocial: 'Empresa Teste Ltda',
    inscricaoEstadual: '111111111',
    uf: 'MT',
    // ... demais campos
  },
  destinatario: {
    cpf: '12345678901',
    nome: 'Consumidor Final',
    // ... demais campos
  },
  produtos: [
    {
      descricao: 'Produto Teste',
      ncm: '84713012',
      cfop: '5102',
      quantidade: 1,
      valorUnitario: 100.00,
      // ... demais campos
    }
  ],
  // ... pagamento, transporte, etc.
});

const signed = nfe.xml.sign(xml);
const result = await nfe.sefaz.transmit(signed);

console.log(result.protocolo);    // Numero do protocolo
console.log(result.chaveAcesso);  // Chave de 44 digitos
console.log(result.status);       // 100 = Autorizada
```

## Arquitetura

```
src/
  core/           Fachada principal (NFeCore)
  domain/         Entidades puras e schemas Zod
  contracts/      Interfaces dos providers
  application/    Use cases (generate, sign, transmit, consult)
  infra/          Implementacoes concretas dos providers
  shared/         Constantes (IBGE, CFOP, CST), helpers, erros
```

Para detalhes completos, veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Providers plugaveis

A lib usa o padrao Provider/Plugin. Cada integracao externa eh uma interface que voce pode substituir:

| Provider | Descricao | Default |
|----------|-----------|---------|
| `CertificateProvider` | Carrega e usa certificados digitais | `A1CertificateProvider` (.pfx/.p12) |
| `SefazTransport` | Comunicacao HTTP com a SEFAZ | `NodeHttpSefazTransport` (node:https + mTLS) |
| `XmlBuilder` | Gera XML a partir das entidades | `DefaultXmlBuilder` |
| `XmlSigner` | Assina XML com certificado digital | `DefaultXmlSigner` (node:crypto) |

Para criar seu proprio provider, veja [docs/PROVIDERS.md](docs/PROVIDERS.md).

## Documentacao

| Documento | Descricao |
|-----------|-----------|
| [PROJECT.md](PROJECT.md) | Contexto, motivacao e principios do projeto |
| [ROADMAP.md](ROADMAP.md) | Fases e progresso do desenvolvimento |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura detalhada e decisoes tecnicas |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Glossario de termos fiscais |
| [docs/PROVIDERS.md](docs/PROVIDERS.md) | Guia para criar providers customizados |
| [docs/EXAMPLES.md](docs/EXAMPLES.md) | Exemplos completos de uso |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Como contribuir |
| [CLAUDE.md](CLAUDE.md) | Instrucoes para AI agents |

## Requisitos

- Node.js >= 18
- Certificado digital A1 (.pfx ou .p12)
- Inscricao estadual ativa no estado emissor

## Desenvolvimento

```bash
# Clonar o repositorio
git clone https://github.com/raphaelvserafim/brasil-fiscal-nfe.git
cd nfe

# Instalar dependencias
npm install

# Rodar testes
npm test

# Lint
npm run lint

# Build
npm run build
```

## Contribuindo

Contribuicoes sao bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para guidelines.

## Licenca

[MIT](LICENSE)

## Inspiracao

- [nfephp-org/sped-nfe](https://github.com/nfephp-org/sped-nfe) — Referencia PHP para NFe
- [nfephp-org/sped-common](https://github.com/nfephp-org/sped-common) — Base comum do sped-nfe
