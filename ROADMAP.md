# Roadmap — @brasil-fiscal/nfe

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

## Fase 5: Eventos NFe

**Status:** Concluida

**Objetivo:** Cancelamento, Carta de Correcao e Inutilizacao de numeracao via servico `RecepcaoEvento` da SEFAZ.

- [x] Envelope SOAP para `RecepcaoEvento4` (cancelamento e CC-e) e `NFeInutilizacao4`
- [x] `CancelaNFeUseCase` — cancelamento de NFe (evento tipo 110111)
- [x] `CartaCorrecaoUseCase` — CC-e (evento tipo 110110, com sequencia de eventos)
- [x] `InutilizaNFeUseCase` — inutilizacao de numeracao via `NFeInutilizacao4`
- [x] Parse das respostas de eventos (protocolo, status)
- [x] `DefaultXmlSigner` generalizado para assinar `infNFe`, `infEvento` e `infInut`
- [x] URLs de `RecepcaoEvento` e `NFeInutilizacao` para todos os 14 autorizadores
- [x] 25 testes novos (143 testes totais passando)

**Criterio de conclusao:** Cancelamento e CC-e funcionando em homologacao.

---

## Fase 6: Manifestacao do Destinatario

**Status:** Concluida

**Objetivo:** Permitir que o destinatario manifeste-se sobre NFes recebidas via `RecepcaoEvento` do AN.

- [x] Confirmacao da operacao (evento tipo 210200)
- [x] Ciencia da operacao (evento tipo 210210)
- [x] Desconhecimento da operacao (evento tipo 210220)
- [x] Operacao nao realizada (evento tipo 210240)
- [x] `ManifestacaoUseCase` com `confirmar()`, `ciencia()`, `desconhecer()`, `naoRealizada()`
- [x] URL do `RecepcaoEvento` do AN (homologacao e producao)
- [x] Validacao de justificativa obrigatoria para desconhecimento e nao realizada
- [x] 22 testes novos (165 testes totais passando)

**Criterio de conclusao:** Manifestacao de todos os tipos funcionando em homologacao.

---

## Fase 7: DANFE

**Status:** Concluida

**Objetivo:** Gerar o PDF do DANFE (Documento Auxiliar da NFe) a partir do XML autorizado.

- [x] Parser de XML autorizado para estrutura tipada (`DanfeData`)
- [x] Code128C implementado sem dependencias para chave de acesso (44 digitos)
- [x] Layout DANFE retrato A4 com todas as secoes (cabecalho, emitente, destinatario, produtos, totais, transporte, info complementares)
- [x] `DanfeGenerator` usando pdfkit (peerDependency opcional)
- [x] `GerarDanfeUseCase` — aceita XML autorizado (string), retorna Buffer PDF
- [x] PDF de exemplo gerado em `examples/danfe-exemplo.pdf`
- [x] 20 testes novos (185 testes totais passando)

**Criterio de conclusao:** PDF do DANFE gerado corretamente a partir de XML autorizado.

---

## Fase 8: Fachada e API Publica

**Status:** Concluida

**Objetivo:** Integrar tudo na classe `NFeCore` e estabilizar a API publica.

- [x] `NFeCore.create()` com configuracao de providers
- [x] API publica com metodos diretos: `transmitir()`, `consultarProtocolo()`, `cancelar()`, `cartaCorrecao()`, `inutilizar()`, `distribuicaoPorNSU()`, `distribuicaoPorChave()`, `danfe()`, `manifestar.*`
- [x] `index.ts` com exports publicos bem definidos
- [x] Testes de integracao end-to-end (homologacao)

**Criterio de conclusao:** Um dev consegue instalar, configurar e emitir uma NFe em homologacao seguindo apenas o README.

---

## Fase 9a: NFC-e — XML e Transmissao

**Status:** Concluida

**Objetivo:** Suporte a NFC-e (modelo 65) no mesmo projeto, reutilizando infraestrutura existente.

- [x] Modelo configuravel (`'55' | '65'`) em `NFeIdentificacao`
- [x] URLs dos webservices NFC-e por autorizador (MT inicial)
- [x] Geracao da URL do QR Code v2 da NFC-e
- [x] Campos `qrCode` e `urlChave` no bloco `infNFeSupl` do XML
- [x] Regras especificas NFC-e: `dest` opcional, roteamento por modelo
- [x] `cIdToken` e `csc` no NFeCoreConfig
- [x] Testes unitarios para modelo 65

**Criterio de conclusao:** NFC-e transmitida em homologacao com QR Code URL gerado.

---

## Fase 9b: NFC-e — Cupom Termico

**Status:** Concluida

**Objetivo:** Gerar cupom termico 80mm (PDF) com QR Code a partir de NFC-e autorizada.

- [x] Gerador de cupom termico 80mm (`CupomNFCeGenerator`) com QR Code
- [x] `GerarCupomUseCase` — aceita XML autorizado, retorna Buffer PDF (80mm)
- [x] peerDependency `qrcode` para geracao de imagem QR Code
- [x] Testes unitarios

**Criterio de conclusao:** Cupom termico PDF gerado corretamente a partir de XML autorizado de NFC-e.

---

## Fase 10: Contingencia e Resiliencia

**Status:** Pendente
**Depende de:** `@brasil-fiscal/core` (transport com fallback, consulta status)

**Objetivo:** Garantir que o sistema continue operando quando a SEFAZ estiver indisponivel.

- [ ] Consulta Status SEFAZ (`NFeStatusServico4`) — verifica se os webservices estao operacionais *(use case no nfe, transport no core)*
- [ ] Contingencia SVC-AN / SVC-RS — redireciona envio para webservices de contingencia nacionais, ajustando `tpEmis`, `dhCont` e `xJust` no XML
- [ ] EPEC para NFe mod55 (evento 110140) — emite evento de contingencia quando SEFAZ esta offline
- [ ] EPEC para NFCe mod65 (SP) — contingencia especifica para Sao Paulo via `RecepcaoEPEC`
- [ ] Consulta Recibo de Lote (`NFeRetAutorizacao4`) — resultado de lote assincrono (`indSinc=0`)

**Criterio de conclusao:** Sistema capaz de emitir NFe/NFC-e em contingencia quando SEFAZ esta fora.

---

## Fase 11: Servicos Complementares

**Status:** Pendente

**Objetivo:** Implementar servicos auxiliares da SEFAZ que complementam o fluxo principal.

- [ ] Gerenciamento de CSC (`CscNFCe`) — consultar (op=1), solicitar novo (op=2) e revogar (op=3) CSC de NFC-e
- [ ] Consulta Cadastro (`NfeConsultaCadastro`) — dados de registro fiscal por CNPJ, IE ou CPF
- [ ] Cancelamento por Substituicao (evento 110112) — cancela NFC-e referenciando a nova que substitui
- [ ] Manifestacao em Lote — ate 20 eventos de manifestacao em um unico envio SOAP
- [ ] Tabela cStat completa — codigos de retorno SEFAZ (100-999) com descricao e tipo (sucesso/erro) *(no core, compartilhado)*
- [ ] Validacao de NFe recebida — verifica assinatura XML + consulta protocolo para detectar adulteracao

**Criterio de conclusao:** Todos os servicos complementares funcionando em homologacao.

---

## Fase 12: Eventos Avancados

**Status:** Pendente

**Objetivo:** Implementar eventos adicionais do ciclo de vida da NFe.

- [ ] Comprovante de Entrega (evento 110130) — registra entrega com hash de imagem, GPS, dados do recebedor
- [ ] Cancelamento de Comprovante de Entrega (evento 110131)
- [ ] Insucesso de Entrega (evento 110192) — registra tentativa fracassada de entrega
- [ ] Cancelamento de Insucesso de Entrega (evento 110193)
- [ ] Ator Interessado (evento 110150) — autoriza transportador a acessar XML
- [ ] Conciliacao Financeira (eventos 110750/110751) — registra/cancela conciliacao de pagamentos (NT 2024.002)

**Criterio de conclusao:** Eventos avancados funcionando em homologacao.

---

## Fase 13: QR Code v3 e Reforma Tributaria

**Status:** Pendente

**Objetivo:** Adequacao a novas normas tecnicas da SEFAZ.

- [ ] QR Code v3 (NT 2025.001) — formato simplificado que dispensa CSC para emissao online
- [ ] Eventos IBS/CBS (NT 2025.002) — pagamento integral, isencao ZFM, apropiacao de credito presumido, etc.
- [ ] Protocolacao de Eventos — gerar `procEventoNFe` e `procInutNFe` (juntar XML com retorno SEFAZ)

**Criterio de conclusao:** Lib compativel com as NTs mais recentes.

---

## Futuro

Funcionalidades planejadas sem fase definida.

### Outros documentos fiscais
- `@brasil-fiscal/cte` — CTe (Conhecimento de Transporte Eletronico)
- `@brasil-fiscal/mdfe` — MDFe (Manifesto Eletronico de Documentos Fiscais)
- `@brasil-fiscal/nfse` — NFSe (Nota Fiscal de Servico Eletronica) — Padrao Nacional (ADN), API REST

### Transparencia Fiscal (Lei 12.741/2012)
- Helper `calcularTributosAproximados(produtos, tabelaIBPT)` que calcula valor aproximado dos tributos por NCM
- Integracao com tabela IBPT (atualizada semestralmente)
- Gera texto automatico para `informacoesFisco`: "Valor Aprox dos Tributos R$ X.XXX,XX (XX,XX%) Fonte: IBPT"

### Validacao GTIN
- Validacao de check digit do codigo EAN/GTIN dos produtos

---

## Como acompanhar

Cada fase sera desenvolvida em uma branch dedicada com PR para `main`. Issues no GitHub vao rastrear tarefas individuais dentro de cada fase.
