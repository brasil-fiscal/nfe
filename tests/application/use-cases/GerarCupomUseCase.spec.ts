import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GerarCupomUseCase } from '@nfe/application/use-cases/GerarCupomUseCase';
import { NFeError } from '@nfe/shared/errors/NFeError';

const SAMPLE_NFCE_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">' +
  '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">' +
  '<infNFe versao="4.00" Id="NFe51260411222333000181650010000000011123456789">' +
  '<ide><cUF>51</cUF><cNF>12345678</cNF><natOp>Venda</natOp><mod>65</mod>' +
  '<serie>1</serie><nNF>1</nNF><dhEmi>2026-04-28T10:00:00-03:00</dhEmi>' +
  '<tpNF>1</tpNF><idDest>1</idDest><cMunFG>5103403</cMunFG>' +
  '<tpImp>4</tpImp><tpEmis>1</tpEmis><cDV>9</cDV><tpAmb>2</tpAmb>' +
  '<finNFe>1</finNFe><indFinal>1</indFinal><indPres>1</indPres>' +
  '<procEmi>0</procEmi><verProc>1.0.0</verProc></ide>' +
  '<emit><CNPJ>11222333000181</CNPJ><xNome>Loja Teste Ltda</xNome>' +
  '<xFant>Loja Teste</xFant><IE>131234567</IE>' +
  '<enderEmit><xLgr>Rua Teste</xLgr><nro>100</nro><xBairro>Centro</xBairro>' +
  '<cMun>5103403</cMun><xMun>Cuiaba</xMun><UF>MT</UF><CEP>78005000</CEP></enderEmit>' +
  '<CRT>1</CRT></emit>' +
  '<det nItem="1"><prod><cProd>001</cProd><cEAN>SEM GTIN</cEAN>' +
  '<xProd>Camiseta Algodao P</xProd><NCM>61091000</NCM><CFOP>5102</CFOP>' +
  '<uCom>UN</uCom><qCom>2.0000</qCom><vUnCom>49.9000</vUnCom>' +
  '<vProd>99.80</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>UN</uTrib>' +
  '<qTrib>2.0000</qTrib><vUnTrib>49.9000</vUnTrib><indTot>1</indTot></prod>' +
  '<imposto><ICMS><ICMSSN102><orig>0</orig><CSOSN>102</CSOSN></ICMSSN102></ICMS>' +
  '<PIS><PISOutr><CST>49</CST><vBC>0.00</vBC><pPIS>0.00</pPIS><vPIS>0.00</vPIS></PISOutr></PIS>' +
  '<COFINS><COFINSOutr><CST>49</CST><vBC>0.00</vBC><pCOFINS>0.00</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSOutr></COFINS>' +
  '</imposto></det>' +
  '<total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson>' +
  '<vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST>' +
  '<vFCPSTRet>0.00</vFCPSTRet><vProd>99.80</vProd><vFrete>0.00</vFrete>' +
  '<vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI>' +
  '<vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS>' +
  '<vOutro>0.00</vOutro><vNF>99.80</vNF></ICMSTot></total>' +
  '<transp><modFrete>9</modFrete></transp>' +
  '<pag><detPag><tPag>01</tPag><vPag>99.80</vPag></detPag></pag>' +
  '<infAdic><infCpl>Venda ao consumidor final</infCpl></infAdic>' +
  '</infNFe>' +
  '<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">' +
  '<SignedInfo><DigestValue>dGVzdA==</DigestValue></SignedInfo>' +
  '<SignatureValue>dGVzdA==</SignatureValue></Signature>' +
  '<infNFeSupl>' +
  '<qrCode><![CDATA[https://homologacao.sefaz.mt.gov.br/nfce/consultanfce?p=51260411222333000181650010000000011123456789|2|2||323032362d30342d32385431303a30303a30302d30333a3030|39392e3830|302e3030|6457317459576431625342305a584e305a513d3d|000001|ABC123]]></qrCode>' +
  '<urlChave>https://homologacao.sefaz.mt.gov.br/nfce/consultanfce</urlChave>' +
  '</infNFeSupl>' +
  '</NFe>' +
  '<protNFe versao="4.00"><infProt>' +
  '<tpAmb>2</tpAmb><verAplic>1.0</verAplic>' +
  '<chNFe>51260411222333000181650010000000011123456789</chNFe>' +
  '<dhRecbto>2026-04-28T10:01:00-03:00</dhRecbto>' +
  '<nProt>151260000012345</nProt><digVal>dGVzdA==</digVal>' +
  '<cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo>' +
  '</infProt></protNFe>' +
  '</nfeProc>';

describe('GerarCupomUseCase', () => {
  it('deve gerar PDF a partir de XML de NFC-e autorizada', async () => {
    const useCase = new GerarCupomUseCase();
    const pdf = await useCase.execute(SAMPLE_NFCE_XML);

    assert.ok(pdf instanceof Buffer);
    assert.ok(pdf.length > 0);
    // PDF starts with %PDF
    assert.ok(pdf.toString('utf-8', 0, 5).startsWith('%PDF'));
  });

  it('deve lancar erro para XML vazio', async () => {
    const useCase = new GerarCupomUseCase();
    await assert.rejects(
      () => useCase.execute(''),
      (error: unknown) => {
        assert.ok(error instanceof NFeError);
        return true;
      }
    );
  });

  it('deve lancar erro para XML sem infNFe', async () => {
    const useCase = new GerarCupomUseCase();
    await assert.rejects(
      () => useCase.execute('<nfe>invalid</nfe>'),
      (error: unknown) => {
        assert.ok(error instanceof NFeError);
        return true;
      }
    );
  });
});
