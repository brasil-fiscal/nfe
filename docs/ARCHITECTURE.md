# Arquitetura — brasil-fiscal-nfe

## Visao Geral

Esta lib segue principios de **Clean Architecture** com um **padrao Plugin/Provider** para extensibilidade. O codigo eh organizado em camadas, onde camadas internas nao tem conhecimento das camadas externas.

```
┌─────────────────────────────────────────────────────┐
│                    core/ (Fachada)                    │
│  NFeCore — API publica que conecta tudo              │
├─────────────────────────────────────────────────────┤
│              application/ (Use Cases)                │
│  GenerateXml, SignXml, ValidateXml, TransmitNFe,    │
│  ConsultProtocol                                     │
├─────────────────────────────────────────────────────┤
│               domain/ (Entidades + Schemas)          │
│  NFe, Emitente, Destinatario, Produto, ICMS, etc.   │
│  Schemas Zod para validacao de entrada               │
├─────────────────────────────────────────────────────┤
│              contracts/ (Interfaces)                 │
│  CertificateProvider, SefazTransport, XmlBuilder,   │
│  XmlSigner, SchemaValidator                          │
├─────────────────────────────────────────────────────┤
│         infra/ (Implementacoes Concretas)            │
│  A1CertificateProvider, NodeHttpSefazTransport,     │
│  DefaultXmlBuilder, DefaultXmlSigner                 │
├─────────────────────────────────────────────────────┤
│            shared/ (Constantes + Helpers)             │
│  Codigos IBGE, CFOP, CST, validadores CNPJ/CPF,    │
│  gerador de chave de acesso, erros customizados      │
└─────────────────────────────────────────────────────┘
```

## Regra de Dependencia

Dependencias apontam **apenas para dentro**:

```
infra → contracts ← application → domain
                                    ↑
                   shared ──────────┘
core → application + infra (apenas conexao)
```

- `domain/` nao depende de nada (dados puros)
- `contracts/` depende dos tipos de `domain/`
- `application/` depende de `contracts/` e `domain/`
- `infra/` implementa `contracts/`, depende de `domain/`
- `core/` conecta `infra/` em `application/` (composition root)
- `shared/` eh usado por todas as camadas (constantes, helpers, erros)

## Detalhes das Camadas

### `core/`

O composition root. Contem `NFeCore`, a fachada publica que:

1. Recebe instancias de providers via `NFeCore.create(config)`
2. Instancia use cases com as implementacoes fornecidas
3. Expoe uma API limpa: `nfe.xml.generate()`, `nfe.xml.sign()`, `nfe.sefaz.transmit()`

Esta eh a unica camada que conhece implementacoes concretas. Ela conecta tudo via injecao de dependencia manual — sem container de DI.

**Arquivos:**
- `NFeCore.ts` — Classe fachada
- `types.ts` — Tipos de configuracao publica (`NFeConfig`, `NFeXmlApi`, `NFeSefazApi`)

### `domain/`

Estruturas de dados puras sem I/O, sem side effects, sem dependencias de modulos externos.

**`entities/`** — Classes representando objetos do dominio NFe:
- `NFe.ts` — Entidade raiz contendo todos os dados da NFe
- `Emitente.ts` — Dados do emissor (CNPJ, razao social, endereco, IE)
- `Destinatario.ts` — Dados do destinatario (CPF/CNPJ, nome, endereco)
- `Produto.ts` — Dados do produto/item (descricao, NCM, CFOP, valores, impostos)
- `Transporte.ts` — Dados de transporte
- `Pagamento.ts` — Dados de pagamento
- `ICMSGroup.ts` — Grupo de tributacao ICMS

**`schemas/`** — Schemas Zod para validacao de entrada:
- `nfe-schema.ts` — Schema completo da NFe com validacao aninhada

Entidades sao **readonly** apos a construcao. Recebem um tipo `Props` e expoem apenas getters.

### `contracts/`

Interfaces TypeScript que definem como a lib interage com sistemas externos. Estes sao os pontos de extensao — implemente um para customizar o comportamento.

- `CertificateProvider.ts` — Carregar certificado, obter chave privada, obter cadeia de certificados
- `SefazTransport.ts` — Enviar requisicao SOAP, receber resposta
- `XmlBuilder.ts` — Converter entidades em string XML
- `XmlSigner.ts` — Assinar XML com certificado digital
- `SchemaValidator.ts` — Validar XML contra schema XSD

Cada contrato eh um unico arquivo com uma unica interface. Sem detalhes de implementacao.

### `application/`

Use cases que orquestram o ciclo de vida da NFe. Cada use case:

1. Recebe contratos via injecao no construtor
2. Tem um unico metodo `execute()`
3. Faz uma coisa so

**Use cases:**
- `GenerateXmlUseCase` — Recebe entidades NFe → produz string XML sem assinatura
- `SignXmlUseCase` — Recebe XML + CertificateProvider → produz XML assinado
- `ValidateXmlUseCase` — Recebe XML + SchemaValidator → valida ou lanca erro
- `TransmitNFeUseCase` — Recebe XML assinado + SefazTransport → envia para SEFAZ
- `ConsultProtocolUseCase` — Recebe chave de acesso + SefazTransport → retorna status

### `infra/`

Implementacoes concretas dos contratos. Estes sao os providers padrao que vem com a lib.

**`certificate/`**
- `A1CertificateProvider.ts` — Le arquivos .pfx/.p12 usando `node:crypto`

**`sefaz/`**
- `NodeHttpSefazTransport.ts` — Cliente HTTPS com TLS mutuo usando `node:https`
- `urls.ts` — Mapeamento de URLs dos webservices da SEFAZ por UF e ambiente (foco inicial em MT)

**`xml/`**
- `DefaultXmlBuilder.ts` — Gera XML da NFe seguindo o layout SEFAZ 4.00
- `DefaultXmlSigner.ts` — Assina XML usando XMLDSig (RSA-SHA1) via `node:crypto`

**`schema/`**
- `XsdSchemaValidator.ts` — Valida XML contra schemas XSD oficiais da SEFAZ

### `shared/`

Utilitarios transversais usados por todas as camadas.

**`constants/`**
- `ibge-codes.ts` — Codigos de UF e municipios
- `cfop.ts` — Tabela CFOP
- `cst.ts` — Codigos de situacao tributaria (CST/CSOSN)

**`helpers/`**
- `cnpj.ts` — Validacao e formatacao de CNPJ
- `cpf.ts` — Validacao e formatacao de CPF
- `access-key.ts` — Geracao da chave de acesso da NFe (44 digitos + digito verificador)
- `mod11.ts` — Calculo modulo 11

**`errors/`**
- `NFeError.ts` — Classe de erro base
- `SchemaValidationError.ts` — Dados de entrada invalidos
- `SefazRejectError.ts` — SEFAZ rejeitou a NFe (com codigo e motivo)
- `CertificateError.ts` — Falha no carregamento/assinatura do certificado

## Fluxo de Dados

### Caminho feliz: Emitindo uma NFe

```
Input (objeto NFeData)
  │
  ▼
[Validacao Zod] ── invalido? → SchemaValidationError
  │
  ▼
[GenerateXmlUseCase] → string XML (sem assinatura)
  │
  ▼
[ValidateXmlUseCase] ── invalido? → SchemaValidationError
  │
  ▼
[SignXmlUseCase] → string XML (assinado com XMLDSig)
  │
  ▼
[TransmitNFeUseCase] → envelope SOAP → SEFAZ
  │
  ▼
[Parse da Resposta] ── rejeitado? → SefazRejectError (codigo + motivo)
  │
  ▼
Resultado { protocolo, chaveAcesso, status, xml }
```

### Estrategia de Tratamento de Erros

Erros sao tipados e especificos:

| Erro | Quando | Contem |
|------|--------|-------|
| `SchemaValidationError` | Dados de entrada falham na validacao Zod | Caminho do campo, tipo esperado, valor recebido |
| `CertificateError` | .pfx nao pode ser carregado ou esta expirado | Detalhes do certificado, data de expiracao |
| `SefazRejectError` | SEFAZ retorna codigo de rejeicao | cStat (codigo), xMotivo (motivo), UF |
| `NFeError` | Erro generico da lib | Mensagem, causa opcional |

Todos os erros estendem `NFeError` para facilitar o tratamento generico.

## Estrategia de Testes

- **Testes unitarios** para entidades, helpers e use cases (mockando contratos)
- **Testes de integracao** para implementacoes de infra (carregamento de certificado, geracao de XML)
- **Testes E2E** contra SEFAZ homologacao (opcional, requer certificado)
- Test runner: nativo do Node.js (`node:test`)
- Sem dependencias de framework de teste

## Decisoes de Design

### Por que sem container de DI?

Injecao de dependencia manual via `NFeCore.create()` e injecao no construtor dos use cases. Isso mantem a lib simples, debugavel e livre de opinioes de framework. Mesma abordagem usada no projeto complementar (robo-delivery-api).

### Por que Zod como unica dependencia?

Validacao de entrada para dados fiscais eh complexa (objetos aninhados, campos condicionais, restricoes de formato). Zod oferece excelente integracao com TypeScript e mensagens de erro descritivas. Construir um validador customizado seria reinventar a roda de forma ruim.

### Por que node:crypto ao inves de uma lib de assinatura?

A SEFAZ exige XMLDSig com RSA-SHA1 (canonicalizacao e digest especificos). A maioria das libs de assinatura XML sao pesadas e mal mantidas. `node:crypto` fornece tudo que eh necessario: parsing de PFX, assinatura RSA, hashing SHA1.

### Por que CommonJS?

Maior compatibilidade com o ecossistema Node.js existente. Muitas aplicacoes Node.js empresariais ainda usam CommonJS. Suporte a ESM pode ser adicionado depois via publicacao dual.
