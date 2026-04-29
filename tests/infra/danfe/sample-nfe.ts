/**
 * XML de exemplo de NFe autorizada para testes do DANFE.
 */
export const SAMPLE_NFE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
<infNFe Id="NFe51240412345678000195550010000000011234567890" versao="4.00">
<ide>
<cUF>51</cUF>
<cNF>23456789</cNF>
<natOp>Venda de mercadoria</natOp>
<mod>55</mod>
<serie>1</serie>
<nNF>1</nNF>
<dhEmi>2024-04-29T10:00:00-04:00</dhEmi>
<dhSaiEnt>2024-04-29T11:00:00-04:00</dhSaiEnt>
<tpNF>1</tpNF>
<idDest>1</idDest>
<cMunFG>5103403</cMunFG>
<tpImp>1</tpImp>
<tpEmis>1</tpEmis>
<cDV>0</cDV>
<tpAmb>2</tpAmb>
<finNFe>1</finNFe>
<indFinal>1</indFinal>
<indPres>1</indPres>
<procEmi>0</procEmi>
<verProc>brasil-fiscal-nfe</verProc>
</ide>
<emit>
<CNPJ>12345678000195</CNPJ>
<xNome>EMPRESA TESTE EMITENTE LTDA</xNome>
<xFant>TESTE EMITENTE</xFant>
<enderEmit>
<xLgr>Rua das Flores</xLgr>
<nro>100</nro>
<xBairro>Centro</xBairro>
<cMun>5103403</cMun>
<xMun>Cuiaba</xMun>
<UF>MT</UF>
<CEP>78005000</CEP>
<cPais>1058</cPais>
<xPais>Brasil</xPais>
<fone>6532121234</fone>
</enderEmit>
<IE>131234567</IE>
<CRT>1</CRT>
</emit>
<dest>
<CNPJ>98765432000198</CNPJ>
<xNome>CLIENTE TESTE DESTINATARIO ME</xNome>
<enderDest>
<xLgr>Av Brasil</xLgr>
<nro>500</nro>
<xBairro>Jardim Tropical</xBairro>
<cMun>5103403</cMun>
<xMun>Cuiaba</xMun>
<UF>MT</UF>
<CEP>78010100</CEP>
<cPais>1058</cPais>
<xPais>Brasil</xPais>
<fone>6532125678</fone>
</enderDest>
<indIEDest>1</indIEDest>
<IE>139876543</IE>
</dest>
<det nItem="1">
<prod>
<cProd>001</cProd>
<cEAN>SEM GTIN</cEAN>
<xProd>Produto Teste Alpha - Caixa com 12 unidades</xProd>
<NCM>84714900</NCM>
<CFOP>5102</CFOP>
<uCom>CX</uCom>
<qCom>10.0000</qCom>
<vUnCom>150.0000</vUnCom>
<vProd>1500.00</vProd>
<cEANTrib>SEM GTIN</cEANTrib>
<uTrib>CX</uTrib>
<qTrib>10.0000</qTrib>
<vUnTrib>150.0000</vUnTrib>
<indTot>1</indTot>
</prod>
<imposto>
<ICMS>
<ICMSSN102>
<orig>0</orig>
<CSOSN>102</CSOSN>
</ICMSSN102>
</ICMS>
<PIS>
<PISOutr>
<CST>49</CST>
<vBC>0.00</vBC>
<pPIS>0.00</pPIS>
<vPIS>0.00</vPIS>
</PISOutr>
</PIS>
<COFINS>
<COFINSOutr>
<CST>49</CST>
<vBC>0.00</vBC>
<pCOFINS>0.00</pCOFINS>
<vCOFINS>0.00</vCOFINS>
</COFINSOutr>
</COFINS>
</imposto>
</det>
<det nItem="2">
<prod>
<cProd>002</cProd>
<cEAN>SEM GTIN</cEAN>
<xProd>Produto Teste Beta - Unidade avulsa</xProd>
<NCM>84714900</NCM>
<CFOP>5102</CFOP>
<uCom>UN</uCom>
<qCom>5.0000</qCom>
<vUnCom>200.0000</vUnCom>
<vProd>1000.00</vProd>
<cEANTrib>SEM GTIN</cEANTrib>
<uTrib>UN</uTrib>
<qTrib>5.0000</qTrib>
<vUnTrib>200.0000</vUnTrib>
<indTot>1</indTot>
</prod>
<imposto>
<ICMS>
<ICMSSN102>
<orig>0</orig>
<CSOSN>102</CSOSN>
</ICMSSN102>
</ICMS>
<PIS>
<PISOutr>
<CST>49</CST>
<vBC>0.00</vBC>
<pPIS>0.00</pPIS>
<vPIS>0.00</vPIS>
</PISOutr>
</PIS>
<COFINS>
<COFINSOutr>
<CST>49</CST>
<vBC>0.00</vBC>
<pCOFINS>0.00</pCOFINS>
<vCOFINS>0.00</vCOFINS>
</COFINSOutr>
</COFINS>
</imposto>
</det>
<total>
<ICMSTot>
<vBC>0.00</vBC>
<vICMS>0.00</vICMS>
<vICMSDeson>0.00</vICMSDeson>
<vFCPUFDest>0.00</vFCPUFDest>
<vICMSUFDest>0.00</vICMSUFDest>
<vICMSUFRemet>0.00</vICMSUFRemet>
<vFCP>0.00</vFCP>
<vBCST>0.00</vBCST>
<vST>0.00</vST>
<vFCPST>0.00</vFCPST>
<vFCPSTRet>0.00</vFCPSTRet>
<vProd>2500.00</vProd>
<vFrete>0.00</vFrete>
<vSeg>0.00</vSeg>
<vDesc>0.00</vDesc>
<vII>0.00</vII>
<vIPI>0.00</vIPI>
<vIPIDevol>0.00</vIPIDevol>
<vPIS>0.00</vPIS>
<vCOFINS>0.00</vCOFINS>
<vOutro>0.00</vOutro>
<vNF>2500.00</vNF>
</ICMSTot>
</total>
<transp>
<modFrete>9</modFrete>
</transp>
<pag>
<detPag>
<tPag>01</tPag>
<vPag>2500.00</vPag>
</detPag>
</pag>
<infAdic>
<infCpl>Venda realizada em ambiente de homologacao - Sem valor fiscal. Documento emitido por brasil-fiscal-nfe.</infCpl>
</infAdic>
</infNFe>
</NFe>
<protNFe versao="4.00">
<infProt>
<tpAmb>2</tpAmb>
<verAplic>MT_NFE_PJ_4.00</verAplic>
<chNFe>51240412345678000195550010000000011234567890</chNFe>
<dhRecbto>2024-04-29T10:01:00-04:00</dhRecbto>
<nProt>151240000012345</nProt>
<digVal>abc123==</digVal>
<cStat>100</cStat>
<xMotivo>Autorizado o uso da NF-e</xMotivo>
</infProt>
</protNFe>
</nfeProc>`;
