# Contributing to brasil-fiscal-nfe

Obrigado por considerar contribuir! Este guia explica como participar do projeto.

## Como contribuir

### Reportando bugs

1. Verifique se ja existe uma [issue](https://github.com/raphaelvserafim/brasil-fiscal-nfe/issues) aberta
2. Crie uma nova issue com:
   - Descricao clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs. real
   - Versao do Node.js e da lib

### Sugerindo features

1. Abra uma issue com a tag `feature`
2. Descreva o caso de uso (por que voce precisa disso)
3. Se possivel, sugira uma API (como voce usaria)

### Enviando codigo

1. Fork o repositorio
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Faca suas alteracoes seguindo o code style
4. Escreva testes para o que voce adicionou/alterou
5. Rode `npm test` e `npm run lint`
6. Commit seguindo o padrao de commits
7. Abra um PR para `main`

## Code Style

### TypeScript

- **Strict mode** sempre ativado
- **Explicit return types** em todas as funcoes (`@typescript-eslint/explicit-function-return-type`)
- **Single quotes**, **semicolons**, **no trailing comma**, **100 chars** por linha
- Path alias: `@nfe/*` mapeia para `src/*`

### Naming

| Elemento | Convencao | Exemplo |
|----------|-----------|---------|
| Arquivos de classe | PascalCase | `NFeCore.ts` |
| Arquivos de helper | kebab-case | `access-key.ts` |
| Interfaces | PascalCase, sem prefixo `I` | `CertificateProvider` |
| Types de entrada | PascalCase + `Props` | `EmitenteProps` |
| Use cases | PascalCase + `UseCase` | `SignXmlUseCase` |
| Erros | PascalCase + `Error` | `SefazRejectError` |
| Constantes | UPPER_SNAKE_CASE | `UF_CODES` |
| Testes | mesmo nome + `.spec.ts` | `cnpj.spec.ts` |

### Arquitetura

- **Nao** adicione dependencias de runtime sem discussao previa em uma issue
- **Nao** importe de `infra/` dentro de `domain/` ou `application/`
- **Nao** adicione side effects em `domain/`
- Cada use case tem um unico metodo `execute()`
- Entidades sao imutaveis (readonly)
- Novos providers devem implementar o contrato correspondente em `contracts/`

### Commits

Padrao: `tipo: descricao curta`

Tipos:
- `feat:` nova funcionalidade
- `fix:` correcao de bug
- `docs:` documentacao
- `refactor:` refatoracao sem mudanca de comportamento
- `test:` adicao ou correcao de testes
- `chore:` configuracao, CI, dependencias

Exemplos:
```
feat: implement A1CertificateProvider
fix: correct mod11 calculation for access key
docs: add CFOP examples to GLOSSARY
test: add unit tests for CNPJ validation
```

### Testes

- Use o test runner nativo do Node.js (`node:test`)
- Nomeie testes descritivamente: `'should generate valid access key with 44 digits'`
- Mock contracts, nao implementacoes concretas
- Testes ficam em `tests/` espelhando a estrutura de `src/`

## Estrutura de um PR

```markdown
## O que muda

Descricao curta das alteracoes.

## Por que

Motivacao e contexto.

## Como testar

Passos para validar as mudancas.
```

## Duvidas?

Abra uma issue com a tag `question` ou inicie uma discussao no GitHub.
