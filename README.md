# @brasil-fiscal/nfe

Lib open-source em TypeScript para emissao de **NFe (Nota Fiscal Eletronica)** e **NFC-e (Nota Fiscal de Consumidor Eletronica)** no Brasil. Arquitetura limpa, totalmente plugavel. Parte do ecossistema [`@brasil-fiscal`](https://github.com/brasil-fiscal).

## Instalacao

```bash
npm install @brasil-fiscal/nfe
```

Para gerar DANFE (PDF), instale tambem:

```bash
npm install pdfkit
```

> O [`@brasil-fiscal/core`](https://github.com/brasil-fiscal/core) eh instalado automaticamente como dependencia — contem certificado digital, assinatura XML, transporte mTLS e helpers compartilhados com CTe e MDFe.

## Features

### NFe (modelo 55) — Completo

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
- Geracao de DANFE em PDF (A4 retrato)
- URLs de todos os 27 estados (14 autorizadores)
- Providers plugaveis para certificado, transporte, XML e assinatura

### NFC-e (modelo 65) — Em desenvolvimento

- Modelo configuravel (`'55' | '65'`)
- QR Code da NFC-e (URL com hash SHA1)
- Campos `qrCode` e `urlChave` no bloco `infNFeSupl`
- Destinatario opcional (consumidor nao identificado)
- Cupom termico 80mm com QR Code

## Quick Start

```typescript
import { NFeCore } from '@brasil-fiscal/nfe';
import { readFileSync } from 'node:fs';

const nfe = NFeCore.create({
  pfx: readFileSync('./certificado.pfx'),
  senha: 'senha-do-certificado',
  ambiente: 'homologacao',  // ou 'producao'
  uf: 'MT'
});
```

### Transmitir NFe

```typescript
const result = await nfe.transmitir({
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

console.log(result.autorizada);   // true
console.log(result.protocolo);    // '151240000012345'
console.log(result.chaveAcesso);  // 44 digitos
```

### Consultar protocolo

```typescript
const result = await nfe.consultarProtocolo('51240412345678000195550010000000011234567890');
console.log(result.codigoStatus); // '100'
```

### Cancelar NFe

```typescript
await nfe.cancelar({
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195',
  protocolo: '151240000012345',
  justificativa: 'Erro na emissao da nota fiscal eletronica'
});
```

### Carta de Correcao (CC-e)

```typescript
await nfe.cartaCorrecao({
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195',
  correcao: 'Correcao do endereco do destinatario para Rua ABC 123',
  sequencia: 1  // opcional, default 1
});
```

### Inutilizar numeracao

```typescript
await nfe.inutilizar({
  cnpj: '12345678000195',
  ano: 2024,
  serie: 1,
  numeroInicial: 10,
  numeroFinal: 20,
  justificativa: 'Numeracao pulada por erro no sistema emissor'
});
```

### Consultar NFes recebidas (Distribuicao DFe)

```typescript
// Por ultimo NSU (paginacao manual)
const result = await nfe.distribuicaoPorNSU('12345678000195');
console.log(result.documentos);  // Array de { nsu, schema, xml }
console.log(result.ultNSU);      // Usar como input da proxima chamada

// Por chave de acesso
const result2 = await nfe.distribuicaoPorChave(
  '12345678000195',
  '51240412345678000195550010000000011234567890'
);
```

### Manifestacao do Destinatario

```typescript
const input = {
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195'
};

await nfe.manifestar.confirmar(input);
await nfe.manifestar.ciencia(input);
await nfe.manifestar.desconhecer({ ...input, justificativa: 'Nao reconheco esta operacao' });
await nfe.manifestar.naoRealizada({ ...input, justificativa: 'Mercadoria devolvida' });
```

### Gerar DANFE (PDF)

```typescript
import { writeFileSync } from 'node:fs';

const pdf = await nfe.danfe(xmlAutorizado);
writeFileSync('danfe.pdf', pdf);
```

> Requer `pdfkit` instalado: `npm install pdfkit`

### Tratamento de erros

```typescript
import { SefazRejectError, CertificateError, NFeError } from '@brasil-fiscal/nfe';

try {
  await nfe.transmitir(nfeData);
} catch (error) {
  if (error instanceof CertificateError) {
    console.error('Certificado:', error.message);
  } else if (error instanceof SefazRejectError) {
    console.error(`[${error.cStat}] ${error.xMotivo}`);
  } else if (error instanceof NFeError) {
    console.error('Erro:', error.message);
  }
}
```

## Uso avancado

Para quem precisa de controle total, os providers e use cases individuais tambem estao disponiveis. Veja [docs/EXAMPLES.md](docs/EXAMPLES.md) para exemplos com a API de baixo nivel.

## Providers plugaveis

A lib usa o padrao Provider. Cada integracao externa eh uma interface que voce pode substituir:

| Provider | Descricao | Default | Origem |
|----------|-----------|---------|--------|
| `CertificateProvider` | Carrega certificados digitais | `A1CertificateProvider` (.pfx/.p12) | `@brasil-fiscal/core` |
| `SefazTransport` | Comunicacao HTTP com a SEFAZ | `NodeHttpSefazTransport` (mTLS) | `@brasil-fiscal/core` |
| `XmlBuilder` | Gera XML a partir das entidades | `DefaultXmlBuilder` | `@brasil-fiscal/nfe` |
| `XmlSigner` | Assina XML com certificado digital | `DefaultXmlSigner` | `@brasil-fiscal/core` |

Para criar seu proprio provider, veja [docs/PROVIDERS.md](docs/PROVIDERS.md).

## Arquitetura

Este pacote usa [`@brasil-fiscal/core`](https://github.com/brasil-fiscal/core) para infraestrutura compartilhada (certificado, assinatura, transporte mTLS, helpers). O core eh reutilizado entre NFe, CTe e MDFe.

```
@brasil-fiscal/core          Certificado A1, XMLDSig, mTLS, CNPJ/CPF, UF codes
      |
@brasil-fiscal/nfe           NFe + NFC-e (este pacote)
      |
      src/
        core/                 Fachada (NFeCore) e tipos
        domain/               Entidades puras e schemas Zod
        contracts/            Interface XmlBuilder (NFe-especifica)
        application/          Use cases (transmit, consult, cancel, etc.)
        infra/                DefaultXmlBuilder, SOAP, DANFE
        shared/               Constantes (CFOP, CST, URLs SEFAZ)
```

Para detalhes completos, veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Ecossistema @brasil-fiscal

| Pacote | Status | Descricao |
|--------|--------|-----------|
| [@brasil-fiscal/core](https://github.com/brasil-fiscal/core) | Estavel | Infraestrutura compartilhada |
| **@brasil-fiscal/nfe** | Estavel | NFe e NFC-e (este pacote) |
| [@brasil-fiscal/cte](https://github.com/brasil-fiscal/cte) | Em desenvolvimento | CTe |
| [@brasil-fiscal/mdfe](https://github.com/brasil-fiscal/mdfe) | Em desenvolvimento | MDFe |
| [@brasil-fiscal/sped-fiscal](https://github.com/brasil-fiscal/sped-fiscal) | Em desenvolvimento | EFD ICMS/IPI (SPED Fiscal) |
| [@brasil-fiscal/sped-contribuicoes](https://github.com/brasil-fiscal/sped-contribuicoes) | Em desenvolvimento | EFD Contribuicoes (PIS/COFINS) |
| [@brasil-fiscal/sintegra](https://github.com/brasil-fiscal/sintegra) | Em desenvolvimento | SINTEGRA |

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
npm test
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
