# Roadmap — brasil-fiscal-nfe

Este documento descreve as fases de desenvolvimento do projeto. Cada fase tem um escopo bem definido e criterios de conclusao.

---

## Fase 0: Fundacao

**Status:** Concluida

**Objetivo:** Estrutura do projeto, documentacao base e contratos (interfaces).

- [x] Estrutura de diretorios
- [x] Configuracao TypeScript, ESLint, Prettier
- [x] package.json com metadados do projeto
- [x] README.md com visao geral e quick start
- [x] PROJECT.md com contexto e principios
- [x] ROADMAP.md (este arquivo)
- [x] ARCHITECTURE.md com decisoes tecnicas
- [x] CONTRIBUTING.md com guidelines
- [x] CLAUDE.md para AI agents
- [x] GLOSSARY.md com termos fiscais
- [x] Contratos (interfaces) de todos os providers
- [x] Tipos base das entidades (NFe, Emitente, Destinatario, Produto, Transporte, Pagamento, Endereco)
- [x] Schemas Zod para validacao de entrada (todos os schemas)
- [x] Classe de erros customizados (NFeError, SchemaValidationError, SefazRejectError, CertificateError)

**Criterio de conclusao:** Todos os contratos definidos, tipos compilando, testes basicos passando.

---

## Fase 1: Geracao de XML

**Status:** Concluida

**Objetivo:** Gerar XML valido de NFe a partir das entidades. Foco inicial na SEFAZ MT (Mato Grosso).

- [x] Entidades completas (NFe, Emitente, Destinatario, Produto, ICMS, PIS, COFINS, Transporte, Pagamento)
- [x] `DefaultXmlBuilder` que converte entidades em XML no layout SEFAZ (versao 4.00)
- [x] Helpers: geracao de chave de acesso (44 digitos), digito verificador (mod11)
- [x] Constantes: codigos IBGE (UF + municipio — priorizando MT), tabela CFOP, tabela CST/CSOSN, formas de pagamento
- [x] Validacao de CNPJ e CPF
- [x] Testes unitarios cobrindo geracao de XML (34 testes passando)
- [x] Validacao do XML contra XSD oficial da SEFAZ (movido para Fase 3)

**Criterio de conclusao:** XML gerado passa na validacao contra XSD oficial da SEFAZ.

---

## Fase 2: Assinatura Digital

**Status:** Concluida

**Objetivo:** Assinar o XML da NFe com certificado digital A1.

- [x] `A1CertificateProvider` para carregar .pfx/.p12
- [x] `DefaultXmlSigner` com XMLDSig (RSA-SHA1) via `node:crypto`
- [x] Canonicalizacao C14N do XML antes da assinatura
- [x] Testes com certificados de teste (18 testes — 4 certificado, 8 assinatura, 6 canonicalizacao)

**Criterio de conclusao:** XML assinado eh valido e verificavel.

---

## Fase 3: Validacao XSD

**Status:** Concluida

**Objetivo:** Validar XML contra schemas XSD oficiais da SEFAZ.

- [x] `XsdSchemaValidator` que valida XML gerado (via xmllint, mesmo approach do openssl)
- [x] Schemas XSD da NFe 4.00 incluidos (nfe_v4.00.xsd, leiauteNFe_v4.00.xsd, tiposBasico_v4.00.xsd, xmldsig-core-schema_v1.01.xsd, enviNFe_v4.00.xsd)
- [x] Erros descritivos indicando exatamente qual campo falhou
- [x] Correcoes no DefaultXmlBuilder reveladas pela validacao XSD (serie/nNF sem zero-padding, verProc <= 20 chars, PIS/COFINS CST 49 usando PISOutr/COFINSOutr)
- [x] 5 testes de validacao XSD (57 testes totais passando)

**Criterio de conclusao:** XMLs invalidos sao rejeitados com mensagens claras.

---

## Fase 4: Transmissao para SEFAZ

**Status:** Concluida

**Objetivo:** Enviar NFe assinada para a SEFAZ e processar a resposta.

- [x] `NodeHttpSefazTransport` com `node:https` e mTLS
- [x] URLs dos webservices da SEFAZ MT (homologacao e producao)
- [x] Mapeamento extensivel de URLs por UF e ambiente (modelo UF → Autorizador → URLs, 27 UFs mapeadas, todos os 14 autorizadores com URLs preenchidas)
- [x] Montagem do envelope SOAP para o webservice `NFeAutorizacao4` (modo sincrono, `indSinc=1`)
- [x] Parse da resposta SOAP (protocolo, status, motivo) via regex/string
- [x] `ConsultProtocolUseCase` para consulta via `NFeConsultaProtocolo4` (extrai UF da chave de acesso)
- [x] `TransmitNFeUseCase` que orquestra build → sign → envelope → envio → parse
- [x] Tratamento de erros da SEFAZ (rejeicoes com codigo e motivo via `SefazRejectError`)
- [x] 40 testes novos (97 testes totais passando)

**Criterio de conclusao:** NFe transmitida com sucesso em ambiente de homologacao da SEFAZ MT.

---

## Fase 4.5: Distribuicao DFe (Consulta de NFe recebidas)

**Status:** Concluida

**Objetivo:** Permitir que uma empresa consulte NFes emitidas contra seu CNPJ via servico `NFeDistribuicaoDFe` do Ambiente Nacional.

- [x] URLs do servico `NFeDistribuicaoDFe` (AN — Ambiente Nacional, homologacao e producao)
- [x] Montagem do envelope SOAP para `NFeDistribuicaoDFe` (consulta por ultimo NSU e por chave de acesso)
- [x] Parse da resposta (resumos `resNFe`, XMLs completos `procNFe`, paginacao via `ultNSU`/`maxNSU`)
- [x] Descompactacao dos documentos retornados (GZip base64 via `node:zlib`)
- [x] `DistribuicaoDFeUseCase` com `consultarPorNSU()` e `consultarPorChave()`
- [x] Tipos de retorno (`DFeDocument`, `DistribuicaoResult`)
- [x] Paginacao manual — caller controla o ritmo via `ultNSU`
- [x] 19 testes novos (118 testes totais passando)

**Criterio de conclusao:** Consulta de NFes recebidas funcionando em homologacao, com paginacao e descompactacao.

---

## Fase 5: Fachada e API Publica

**Status:** Pendente

**Objetivo:** Integrar tudo na classe `NFeCore` e estabilizar a API publica.

- [ ] `NFeCore.create()` com configuracao de providers
- [ ] API fluente: `nfe.xml.generate()`, `nfe.xml.sign()`, `nfe.sefaz.transmit()`, `nfe.sefaz.consult()`, `nfe.sefaz.distribuicao()`
- [ ] Emissao de eventos (sucesso, erro, rejeicao) para observabilidade
- [ ] `index.ts` com exports publicos bem definidos
- [ ] Documentacao de exemplos completos
- [ ] Testes de integracao end-to-end (homologacao)

**Criterio de conclusao:** Um dev consegue instalar, configurar e emitir uma NFe em homologacao seguindo apenas o README.

---

## Futuro (apos v1)

Funcionalidades planejadas para versoes futuras. Nao fazem parte do escopo atual.

### Suporte a outros estados
- ~~Adicionar URLs de webservices para todos os estados~~ (concluido na Fase 4 — todos os 14 autorizadores com URLs)
- Testes de homologacao por estado

### Eventos NFe
- Cancelamento de NFe
- Carta de correcao (CC-e)
- Inutilizacao de numeracao

### Manifestacao do Destinatario
- ~~Consulta de NFe recebidas (distribuicao DFe)~~ (movido para Fase 4.5)
- Confirmacao da operacao
- Ciencia da operacao
- Desconhecimento da operacao
- Operacao nao realizada

### Outros documentos fiscais
- `@brasil-fiscal/nfce` — NFCe (Nota Fiscal do Consumidor Eletronica)
- `@brasil-fiscal/cte` — CTe (Conhecimento de Transporte Eletronico)
- `@brasil-fiscal/mdfe` — MDFe (Manifesto Eletronico de Documentos Fiscais)

### Certificado A3
- Suporte a smartcard/token via PKCS#11

### DANFE
- `@brasil-fiscal/danfe` — Geracao de PDF do DANFE

---

## Como acompanhar

Cada fase sera desenvolvida em uma branch dedicada com PR para `main`. Issues no GitHub vao rastrear tarefas individuais dentro de cada fase.
