# Projeto: brasil-fiscal-nfe

## O que eh isso?

Uma lib open-source em TypeScript para emissao de NFe (Nota Fiscal Eletronica) no Brasil. Ela cobre o ciclo completo de uma NFe: gerar o XML, assinar com certificado digital (A1), validar contra os schemas da SEFAZ e transmitir para a autoridade fiscal (SEFAZ).

**Foco inicial: SEFAZ Mato Grosso (MT).** A arquitetura suporta todos os estados, mas o desenvolvimento, testes e validacao comecam pelo MT. Suporte a outros estados sera adicionado progressivamente.

Este projeto existe porque nao ha nenhuma lib em TypeScript bem arquitetada para NFe no ecossistema Node.js. A comunidade PHP tem o [nfephp-org/sped-nfe](https://github.com/nfephp-org/sped-nfe), mas o ecossistema Node.js/TypeScript nao tem um equivalente com arquitetura limpa, tipagem forte e extensibilidade.

## Motivacao

- **Sem alternativa nativa em TypeScript**: As libs de NFe existentes para Node.js sao apenas JavaScript, mal tipadas, fortemente acopladas ou abandonadas.
- **Arquitetura limpa importa**: Empresas precisam de uma lib em que possam confiar, estender e integrar nos seus sistemas sem vendor lock-in.
- **Plugavel por design**: Diferentes empresas tem diferentes necessidades — algumas usam certificado A1, outras A3. Algumas preferem axios, outras HTTP nativo. A lib nao deve forcar escolhas.
- **Codebase amigavel para AI**: O codigo eh estruturado e documentado para que AI agents (Claude, Copilot, Cursor, etc.) consigam entender, navegar e contribuir de forma eficaz.

## Para quem eh?

- **Desenvolvedores** construindo sistemas ERP, PDV ou e-commerce que precisam emitir NFe no Brasil.
- **Empresas** que querem uma solucao open-source, auditavel e extensivel ao inves de APIs proprietarias caras.
- **Contribuidores** que querem melhorar o ecossistema fiscal brasileiro em TypeScript.

## Principios Fundamentais

### 1. Zero dependencias em runtime (quando possivel)

A lib usa apenas modulos nativos do Node.js (`node:crypto`, `node:https`, `node:buffer`). A unica excecao eh o `zod` para validacao de entrada. Sem axios, sem libs SOAP, sem parsers XML alem do que construimos.

**Por que?** Menos dependencias = menos riscos na supply chain, bundle menor, menos breaking changes de upstream.

### 2. Contratos primeiro (padrao Plugin/Provider)

Toda preocupacao externa eh definida como interface (contrato). A lib vem com implementacoes padrao, mas qualquer uma pode ser substituida:

- `CertificateProvider` — como carregar e usar certificados digitais
- `SefazTransport` — como se comunicar com a SEFAZ
- `XmlBuilder` — como gerar XML a partir das entidades
- `XmlSigner` — como assinar XML com assinaturas digitais

**Por que?** Empresas podem trocar implementacoes sem fazer fork. Uma empresa usando HSM pode criar seu proprio `CertificateProvider`. Uma empresa usando proxy SEFAZ pode criar seu proprio `SefazTransport`.

### 3. Entidades imutaveis

As estruturas de dados da NFe sao readonly apos a criacao. Para modificar, voce cria uma nova instancia.

**Por que?** Evita bugs de mutacao acidental em operacoes criticas de impostos. Uma NFe que foi assinada nao deve ser modificada silenciosamente.

### 4. Falhar rapido com erros claros

A validacao de entrada acontece na fronteira (schemas Zod). Se os dados sao invalidos, a lib lanca erro imediatamente com mensagem descritiva — nao depois de construir metade do XML.

**Por que?** Debugar rejeicoes da SEFAZ eh doloroso. Capturar erros cedo com mensagens claras economiza horas.

### 5. SOLID em toda a base

- **S**: Cada use case faz uma coisa (gerar, assinar, transmitir, consultar)
- **O**: Novos providers estendem comportamento sem modificar o core
- **L**: Todos os providers honram sua interface de contrato
- **I**: Contratos sao pequenos e especificos
- **D**: Use cases dependem de contratos, nao de implementacoes concretas

### 6. Documentacao como codigo

Toda decisao arquitetural eh documentada. Um glossario explica termos fiscais. Exemplos sao completos e executaveis. O `CLAUDE.md` ajuda AI agents a entender o projeto.

**Por que?** Este eh um projeto open-source. Se as pessoas nao entendem, elas nao contribuem.

## Decisoes Tecnicas

| Decisao | Escolha | Justificativa |
|---------|---------|---------------|
| Linguagem | TypeScript (strict mode) | Seguranca de tipos para dados fiscais eh inegociavel |
| Runtime | Node.js >= 18 | Suporte nativo a crypto, fetch e HTTPS |
| Sistema de modulos | CommonJS | Maior compatibilidade com ecossistemas Node.js existentes |
| Cliente HTTP | `node:https` | Zero dependencias, suporte a mTLS nativo |
| Geracao de XML | Builder customizado | Controle total sobre o layout XML da NFe, sem dependencia |
| Assinatura XML | `node:crypto` | XMLDSig nativo com RSA-SHA1 conforme exigido pela SEFAZ |
| Certificado | A1 (.pfx/.p12) | Formato mais comum, `node:crypto` suporta nativamente |
| Validacao de entrada | Zod | Melhor validacao TypeScript disponivel, otimas mensagens de erro |
| Logging | Nenhum (eventos) | A lib nao deve forcar um logger — emite eventos em vez disso |
| Testes | Test runner nativo do Node.js | Zero dependencias de teste |
| Path aliases | `@nfe/*` | Imports limpos, consistente com o estilo do projeto |

## O que este projeto NAO eh

- **Nao eh um servico proxy da SEFAZ** — eh uma lib, nao uma API hospedada
- **Nao eh um ERP** — cuida do ciclo de vida do XML da NFe, nao de logica de negocio
- **Nao eh um gerador de DANFE** — geracao de PDF esta fora do escopo (pode ser um pacote separado)
- **Nao eh um banco de dados** — nao armazena dados de NFe; isso eh trabalho da sua aplicacao

## Visao Geral da Estrutura

```
src/
  core/           → Ponto de entrada principal e fachada (NFeCore)
  domain/         → Entidades puras e schemas Zod (sem I/O, sem side effects)
  contracts/      → Interfaces que definem como a lib integra com o mundo externo
  application/    → Use cases que orquestram o ciclo de vida da NFe
  infra/          → Implementacoes concretas dos contratos (certificado, SEFAZ, XML)
  shared/         → Constantes (codigos IBGE, CFOP, CST), helpers (CNPJ, CPF), classes de erro
```

Para arquitetura detalhada, veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Convencoes de Nomenclatura

| Elemento | Convencao | Exemplo |
|----------|-----------|---------|
| Arquivos | PascalCase para classes, kebab-case para helpers | `NFeCore.ts`, `access-key.ts` |
| Interfaces | PascalCase, sem prefixo `I` | `CertificateProvider`, nao `ICertificateProvider` |
| Types | PascalCase com sufixo `Props` para inputs de entidades | `NFeProps`, `EmitenteProps` |
| Use cases | PascalCase com sufixo `UseCase` | `GenerateXmlUseCase` |
| Erros | PascalCase com sufixo `Error` | `SefazRejectError` |
| Constantes | UPPER_SNAKE_CASE para valores, PascalCase para maps | `UF_CODES`, `CfopTable` |
| Testes | Mesmo nome do source com sufixo `.spec.ts` | `access-key.spec.ts` |

## Recursos Relacionados

- [Portal NFe SEFAZ](https://www.nfe.fazenda.gov.br/portal/principal.aspx) — Documentacao oficial
- [Manual Tecnico NFe](https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=tW+YMyk/50s=) — Especificacoes de layout XML
- [nfephp-org/sped-nfe](https://github.com/nfephp-org/sped-nfe) — Implementacao de referencia em PHP
- [Schema NFe (XSD)](https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=BMPFMBoln3w=) — Schemas XML oficiais
