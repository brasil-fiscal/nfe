# CLAUDE.md — Instrucoes para AI Agents

Este arquivo ajuda AI agents (Claude, Copilot, Cursor, etc.) a entender e contribuir com este projeto de forma eficaz.

## Resumo do Projeto

`brasil-fiscal-nfe` eh uma lib TypeScript para emissao de NFe (Nota Fiscal Eletronica) no Brasil. Ela gera XML, assina com certificado digital (A1), valida contra schemas da SEFAZ e transmite para a autoridade fiscal.

**Foco inicial: SEFAZ MT (Mato Grosso).** Todos os exemplos, testes e URLs da SEFAZ priorizam MT. A arquitetura suporta todos os estados — outras UFs serao adicionadas progressivamente.

## Arquitetura (Clean Architecture + Padrao Provider)

```
src/
  core/         → Fachada (NFeCore) — conecta providers aos use cases
  domain/       → Entidades puras e schemas Zod — SEM I/O, SEM side effects
  contracts/    → Interfaces para extensibilidade — CertificateProvider, SefazTransport, XmlBuilder, XmlSigner
  application/  → Use cases — um unico metodo execute() cada
  infra/        → Implementacoes concretas dos contratos
  shared/       → Constantes (IBGE, CFOP, CST), helpers (CNPJ, CPF), classes de erro
```

### Regra de Dependencia

Camadas internas NUNCA importam de camadas externas:
- `domain/` → nao depende de nada
- `contracts/` → depende apenas dos tipos de `domain/`
- `application/` → depende de `contracts/` e `domain/`
- `infra/` → implementa `contracts/`, depende de `domain/`
- `core/` → conecta `infra/` em `application/`

## Comandos Principais

```bash
npm test          # Rodar testes (node:test runner)
npm run lint      # Verificacao ESLint
npm run build     # Compilacao TypeScript
npm run format    # Formatacao Prettier
```

## Convencoes de Codigo

- TypeScript strict mode, return types explicitos em todas as funcoes
- Single quotes, semicolons, sem trailing commas, 100 caracteres por linha
- Path alias: `@nfe/*` → `src/*`
- Interfaces: PascalCase, SEM prefixo `I` (use `CertificateProvider`, nao `ICertificateProvider`)
- Inputs de entidades: sufixo `Props` (`EmitenteProps`, `ProdutoProps`)
- Use cases: sufixo `UseCase`, metodo unico `execute()`
- Erros: estendem a classe base `NFeError`
- Arquivos: PascalCase para classes, kebab-case para helpers/constantes
- Testes: mesmo nome do arquivo + `.spec.ts` no diretorio `tests/`

## Principios de Design

1. **Zero dependencias em runtime** — apenas `node:crypto`, `node:https`, `node:buffer` + `zod`
2. **Contratos primeiro** — toda integracao externa eh uma interface
3. **Entidades imutaveis** — readonly apos construcao
4. **Falhar rapido** — validacao Zod na fronteira de entrada
5. **DI manual** — sem container de DI, providers injetados via construtores

## Contexto do Dominio: NFe Brasileira

NFe (Nota Fiscal Eletronica) eh o sistema de nota fiscal eletronica do Brasil. Conceitos-chave:

- **SEFAZ** — Secretaria da Fazenda estadual que autoriza NFe
- **Certificado A1** — Certificado digital (.pfx/.p12) para assinatura
- **XMLDSig** — Padrao de assinatura digital XML (RSA-SHA1)
- **mTLS** — TLS mutuo exigido pela SEFAZ (certificado do cliente)
- **Chave de Acesso** — Chave unica de 44 digitos que identifica cada NFe
- **Homologacao** — Ambiente de teste; **Producao** — Ambiente real
- **DANFE** — Representacao impressa da NFe (fora do escopo desta lib)

Veja `docs/GLOSSARY.md` para o glossario completo.

## O que NAO fazer

- Nao adicione dependencias de runtime sem discussao
- Nao importe `infra/` de `domain/` ou `application/`
- Nao adicione side effects na camada `domain/`
- Nao use containers de DI ou decorators
- Nao crie interfaces com prefixo `I`
- Nao pule return types explicitos
- Nao faca commit de arquivos .pfx, .p12, .pem ou .env

## Mapa de Arquivos

| Caminho | Proposito |
|---------|-----------|
| `PROJECT.md` | Motivacao, principios e decisoes tecnicas do projeto |
| `ROADMAP.md` | Fases de desenvolvimento e status atual |
| `docs/ARCHITECTURE.md` | Arquitetura detalhada e fluxo de dados |
| `docs/GLOSSARY.md` | Glossario de termos fiscais |
| `docs/PROVIDERS.md` | Como criar providers customizados |
| `docs/EXAMPLES.md` | Exemplos completos de uso |
| `CONTRIBUTING.md` | Guidelines de contribuicao e code style |
