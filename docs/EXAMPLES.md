# Exemplos de Uso — @brasil-fiscal/nfe

Exemplos completos de como usar a lib. Todos os exemplos usam SEFAZ MT em homologacao.

---

## Setup comum

Todos os exemplos abaixo usam estes imports e configuracao:

```typescript
import { readFileSync } from 'node:fs';
import {
  A1CertificateProvider,
  DefaultXmlBuilder,
  DefaultXmlSigner,
  NodeHttpSefazTransport
} from '@brasil-fiscal/nfe';

// Certificado A1
const certificate = new A1CertificateProvider(
  readFileSync('./certificado.pfx'),
  'senha-do-certificado'
);

// Providers
const xmlBuilder = new DefaultXmlBuilder();
const xmlSigner = new DefaultXmlSigner();
const transport = new NodeHttpSefazTransport();
```

---

## 1. Gerar XML da NFe

```typescript
const nfeData = {
  identificacao: {
    naturezaOperacao: 'Venda de producao do estabelecimento',
    tipoOperacao: 1,       // 1 = saida
    destinoOperacao: 1,    // 1 = interna (mesmo estado)
    finalidade: 1,         // 1 = normal
    consumidorFinal: 1,    // 1 = sim
    presencaComprador: 1,  // 1 = presencial
    uf: 'MT',
    municipio: '5103403',  // Cuiaba (codigo IBGE)
    serie: 1,
    numero: 1
  },
  emitente: {
    cnpj: '12345678000195',
    razaoSocial: 'Empresa Teste Ltda',
    nomeFantasia: 'Empresa Teste',
    inscricaoEstadual: '131234567',
    regimeTributario: 1,   // 1 = Simples Nacional
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
    indicadorIE: 9,        // 9 = nao contribuinte
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
      codigo: 'PROD001',
      descricao: 'Camiseta Algodao P',
      ncm: '61091000',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 2,
      valorUnitario: 49.90,
      valorTotal: 99.80,
      icms: {
        origem: 0,         // 0 = nacional
        csosn: '102'       // Simples Nacional sem credito
      },
      pis: { cst: '49' },
      cofins: { cst: '49' }
    }
  ],
  transporte: {
    modalidadeFrete: 9     // 9 = sem frete
  },
  pagamento: {
    pagamentos: [
      { formaPagamento: '01', valor: 99.80 }  // 01 = dinheiro
    ]
  }
};

const xml = xmlBuilder.build(nfeData);
```

---

## 2. Assinar XML

```typescript
const cert = await certificate.load();
const signedXml = xmlSigner.sign(xml, cert);
```

---

## 3. Transmitir para SEFAZ

```typescript
import { TransmitNFeUseCase } from '@brasil-fiscal/nfe';

const transmitir = new TransmitNFeUseCase({
  xmlBuilder,
  xmlSigner,
  certificate,
  transport,
  environment: 'homologation',
  uf: 'MT'
});

const result = await transmitir.execute(nfeData);

if (result.autorizada) {
  console.log('NFe autorizada!');
  console.log('Protocolo:', result.protocolo);
  console.log('Chave:', result.chaveAcesso);
}
```

---

## 4. Consultar protocolo

```typescript
import { ConsultProtocolUseCase } from '@brasil-fiscal/nfe';

const consultar = new ConsultProtocolUseCase({
  certificate,
  transport,
  environment: 'homologation'
});

// A UF eh extraida automaticamente da chave de acesso
const result = await consultar.execute('51240412345678000195550010000000011234567890');
console.log(result.codigoStatus); // '100' = autorizada
console.log(result.protocolo);
```

---

## 5. Cancelar NFe

```typescript
import { CancelaNFeUseCase } from '@brasil-fiscal/nfe';

const cancelar = new CancelaNFeUseCase({
  certificate,
  transport,
  xmlSigner,
  environment: 'homologation'
});

const result = await cancelar.execute({
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195',
  protocolo: '151240000012345',
  justificativa: 'Erro na emissao da nota fiscal eletronica'  // minimo 15 caracteres
});

console.log(result.cStat); // '135' = evento registrado
```

---

## 6. Carta de Correcao (CC-e)

```typescript
import { CartaCorrecaoUseCase } from '@brasil-fiscal/nfe';

const corrigir = new CartaCorrecaoUseCase({
  certificate,
  transport,
  xmlSigner,
  environment: 'homologation'
});

// Primeira correcao
const result = await corrigir.execute({
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195',
  correcao: 'Correcao do endereco do destinatario para Rua ABC 123'
});

// Segunda correcao na mesma NFe
const result2 = await corrigir.execute({
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195',
  correcao: 'Correcao do nome do destinatario para Maria Silva',
  sequencia: 2
});
```

---

## 7. Inutilizar numeracao

```typescript
import { InutilizaNFeUseCase } from '@brasil-fiscal/nfe';

const inutilizar = new InutilizaNFeUseCase({
  certificate,
  transport,
  xmlSigner,
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

console.log(result.cStat); // '102' = inutilizacao homologada
```

---

## 8. Consultar NFes recebidas (Distribuicao DFe)

```typescript
import { DistribuicaoDFeUseCase } from '@brasil-fiscal/nfe';

const distribuicao = new DistribuicaoDFeUseCase({
  certificate,
  transport,
  environment: 'homologation'
});

// Consultar a partir do NSU 0 (inicio)
let ultNSU = '0';

const result = await distribuicao.consultarPorNSU('12345678000195', 'MT', ultNSU);

for (const doc of result.documentos) {
  console.log(`NSU: ${doc.nsu} | Schema: ${doc.schema}`);
  console.log(doc.xml); // XML descompactado (resNFe ou procNFe)
}

// Proxima pagina
ultNSU = result.ultNSU;
// Chamar consultarPorNSU novamente com o novo ultNSU

// Consultar por chave de acesso
const result2 = await distribuicao.consultarPorChave(
  '12345678000195',
  'MT',
  '51240412345678000195550010000000011234567890'
);
```

---

## 9. Manifestacao do Destinatario

```typescript
import { ManifestacaoUseCase } from '@brasil-fiscal/nfe';

const manifestacao = new ManifestacaoUseCase({
  certificate,
  transport,
  xmlSigner,
  environment: 'homologation'
});

const input = {
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195'
};

// Ciencia da operacao (nao precisa de justificativa)
await manifestacao.ciencia(input);

// Confirmacao da operacao
await manifestacao.confirmar(input);

// Desconhecimento (precisa de justificativa, minimo 15 chars)
await manifestacao.desconhecer({
  ...input,
  justificativa: 'Nao reconheco esta operacao comercial'
});

// Operacao nao realizada (precisa de justificativa)
await manifestacao.naoRealizada({
  ...input,
  justificativa: 'Mercadoria devolvida ao remetente'
});
```

---

## 10. Gerar DANFE (PDF)

> Requer `pdfkit` instalado: `npm install pdfkit`

```typescript
import { GerarDanfeUseCase } from '@brasil-fiscal/nfe';
import { writeFileSync } from 'node:fs';

const danfe = new GerarDanfeUseCase();

// Aceita XML autorizado (com <protNFe>)
const pdf = await danfe.execute(xmlAutorizado);
writeFileSync('danfe.pdf', pdf);
```

---

## 11. Tratamento de erros

```typescript
import {
  SchemaValidationError,
  CertificateError,
  SefazRejectError,
  NFeError
} from '@brasil-fiscal/nfe';

try {
  const result = await transmitir.execute(nfeData);
} catch (error) {
  if (error instanceof CertificateError) {
    // Certificado expirado, senha incorreta, arquivo invalido
    console.error('Erro no certificado:', error.message);
  } else if (error instanceof SefazRejectError) {
    // SEFAZ rejeitou (ex: duplicidade, dados invalidos)
    console.error(`[${error.cStat}] ${error.xMotivo}`);
  } else if (error instanceof NFeError) {
    // Erro generico da lib (timeout, XML invalido, etc)
    console.error('Erro:', error.message);
  }
}
```

---

## Arquivos de exemplo

Veja a pasta [`examples/`](../examples/):
- `nfe-exemplo.xml` — XML de NFe gerado pelo DefaultXmlBuilder
- `danfe-exemplo.pdf` — DANFE em PDF

Para regenerar: `npx tsx scripts/generate-examples.ts`
