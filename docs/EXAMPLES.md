# Examples — Exemplos de Uso

Exemplos completos de como usar a lib `brasil-fiscal-nfe`.

> **Nota:** Estes exemplos usam a API planejada para v1. Alguns metodos podem ainda nao estar implementados. Consulte o [ROADMAP](../ROADMAP.md) para o status atual.

---

## 1. Setup basico

```typescript
import { NFeCore } from 'brasil-fiscal-nfe';
import { A1CertificateProvider } from 'brasil-fiscal-nfe/providers/certificate-a1';
import { NodeHttpSefazTransport } from 'brasil-fiscal-nfe/providers/sefaz-node-http';
import { readFileSync } from 'node:fs';

const nfe = NFeCore.create({
  certificate: new A1CertificateProvider({
    pfx: readFileSync('./certificado.pfx'),
    password: 'senha-do-certificado'
  }),
  transport: new NodeHttpSefazTransport(),
  environment: 'homologation' // usar 'production' em producao
});
```

## 2. Emitir uma NFe completa

```typescript
const nfeData = {
  // Identificacao da NFe
  identificacao: {
    naturezaOperacao: 'Venda de producao do estabelecimento',
    tipoOperacao: 1, // 1 = saida
    destinoOperacao: 1, // 1 = interna (mesmo estado)
    finalidade: 1, // 1 = normal
    consumidorFinal: 1, // 1 = sim
    presencaComprador: 1, // 1 = presencial
    uf: 'MT',
    municipio: '5103403', // Cuiaba (IBGE)
    serie: 1,
    numero: 1
  },

  // Emitente
  emitente: {
    cnpj: '11222333000181',
    razaoSocial: 'Empresa Teste Ltda',
    nomeFantasia: 'Empresa Teste',
    inscricaoEstadual: '111111111111',
    regimeTributario: 1, // 1 = Simples Nacional
    endereco: {
      logradouro: 'Rua Teste',
      numero: '100',
      bairro: 'Centro',
      codigoMunicipio: '5103403',
      municipio: 'Cuiaba',
      uf: 'MT',
      cep: '78005000',
      codigoPais: '1058',
      pais: 'Brasil'
    }
  },

  // Destinatario
  destinatario: {
    cpf: '12345678901',
    nome: 'Joao da Silva',
    email: 'joao@email.com',
    indicadorIE: 9, // 9 = nao contribuinte
    endereco: {
      logradouro: 'Av. do CPA',
      numero: '500',
      bairro: 'Centro Politico Administrativo',
      codigoMunicipio: '5103403',
      municipio: 'Cuiaba',
      uf: 'MT',
      cep: '78050970',
      codigoPais: '1058',
      pais: 'Brasil'
    }
  },

  // Produtos
  produtos: [
    {
      numero: 1,
      codigo: 'PROD001',
      descricao: 'Camiseta Algodao P',
      ncm: '61091000',
      cfop: '5102', // Venda de mercadoria adquirida
      unidade: 'UN',
      quantidade: 2,
      valorUnitario: 49.90,
      valorTotal: 99.80,
      icms: {
        origem: 0, // 0 = nacional
        csosn: '102' // 102 = tributada pelo Simples Nacional sem credito
      },
      pis: {
        cst: '49' // 49 = outras operacoes de saida
      },
      cofins: {
        cst: '49'
      }
    }
  ],

  // Totais (calculados automaticamente pela lib)

  // Transporte
  transporte: {
    modalidadeFrete: 9 // 9 = sem frete
  },

  // Pagamento
  pagamento: {
    pagamentos: [
      {
        formaPagamento: '01', // 01 = dinheiro
        valor: 99.80
      }
    ]
  }
};

// Gerar XML
const xml = nfe.xml.generate(nfeData);

// Assinar XML
const signedXml = nfe.xml.sign(xml);

// Transmitir para SEFAZ
const result = await nfe.sefaz.transmit(signedXml);

if (result.autorizada) {
  console.log('NFe autorizada!');
  console.log('Protocolo:', result.protocolo);
  console.log('Chave de acesso:', result.chaveAcesso);
  console.log('XML autorizado:', result.xmlProtocolado);
} else {
  console.error('NFe rejeitada!');
  console.error('Codigo:', result.codigoStatus);
  console.error('Motivo:', result.motivo);
}
```

## 3. Consultar uma NFe

```typescript
const consulta = await nfe.sefaz.consult('51260411222333000181550010000000011123456789');

console.log('Status:', consulta.codigoStatus); // 100 = autorizada
console.log('Motivo:', consulta.motivo);
console.log('Protocolo:', consulta.protocolo);
console.log('Data autorizacao:', consulta.dataAutorizacao);
```

## 4. Tratamento de erros

```typescript
import {
  SchemaValidationError,
  CertificateError,
  SefazRejectError,
  NFeError
} from 'brasil-fiscal-nfe/errors';

try {
  const xml = nfe.xml.generate(nfeData);
  const signed = nfe.xml.sign(xml);
  const result = await nfe.sefaz.transmit(signed);
} catch (error) {
  if (error instanceof SchemaValidationError) {
    // Dados de entrada invalidos
    console.error('Campo invalido:', error.field);
    console.error('Esperado:', error.expected);
    console.error('Recebido:', error.received);
  } else if (error instanceof CertificateError) {
    // Problema com o certificado
    console.error('Erro no certificado:', error.message);
    // ex.: certificado expirado, senha incorreta, arquivo invalido
  } else if (error instanceof SefazRejectError) {
    // SEFAZ rejeitou a NFe
    console.error('Codigo:', error.cStat);    // ex.: 539
    console.error('Motivo:', error.xMotivo);   // ex.: "Duplicidade de NF-e"
    console.error('UF:', error.uf);
  } else if (error instanceof NFeError) {
    // Erro generico da lib
    console.error('Erro:', error.message);
  }
}
```

## 5. Usando providers customizados

```typescript
import { NFeCore } from 'brasil-fiscal-nfe';
import { VaultCertificateProvider } from './providers/vault-certificate';
import { ProxySefazTransport } from './providers/proxy-sefaz';

// Usar certificado de um vault + proxy para SEFAZ
const nfe = NFeCore.create({
  certificate: new VaultCertificateProvider({
    url: 'https://vault.empresa.com',
    secretPath: 'certificates/nfe-producao'
  }),
  transport: new ProxySefazTransport({
    proxyUrl: 'https://sefaz-proxy.empresa.com'
  }),
  environment: 'production'
});

// A partir daqui, o uso eh identico
const xml = nfe.xml.generate(nfeData);
const signed = nfe.xml.sign(xml);
const result = await nfe.sefaz.transmit(signed);
```

## 6. Apenas gerar XML (sem transmitir)

```typescript
// Util para debug ou para sistemas que transmitem por outro canal
const xml = nfe.xml.generate(nfeData);
console.log(xml); // XML completo da NFe

const signedXml = nfe.xml.sign(xml);
// Salvar XML assinado em arquivo
import { writeFileSync } from 'node:fs';
writeFileSync('./nfe-assinada.xml', signedXml);
```
