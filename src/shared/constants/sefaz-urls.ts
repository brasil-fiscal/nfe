import { NFeError } from '@nfe/shared/errors/NFeError';

export type SefazService =
  | 'NFeAutorizacao'
  | 'NFeRetAutorizacao'
  | 'NFeConsultaProtocolo'
  | 'NFeStatusServico'
  | 'RecepcaoEvento'
  | 'NFeInutilizacao'
  | 'NFCeAutorizacao'
  | 'NFCeConsultaProtocolo';

export type SefazEnvironment = 'homologacao' | 'producao';

export type Autorizador =
  | 'AM' | 'BA' | 'GO' | 'MG' | 'MS' | 'MT' | 'PE' | 'PR' | 'RS' | 'SP'
  | 'SVAN' | 'SVRS' | 'SVC-AN' | 'SVC-RS';

type ServiceUrls = {
  readonly [service in SefazService]: string;
} & {
  /**
   * Endpoint de RecepcaoEvento (cancelamento etc.) da NFC-e (mod65).
   * So' precisa ser preenchido nos autorizadores que hospedam a NFC-e em host
   * proprio (diferente do de NF-e). Quando ausente, cai no `RecepcaoEvento` (mod55).
   */
  readonly NFCeRecepcaoEvento?: string;
};

type AutorizadorUrls = {
  readonly [env in SefazEnvironment]: ServiceUrls;
};

/**
 * Mapeamento de UF para seu autorizador NF-e (mod55).
 * Fonte: Portal Nacional da NFe + nfephp-org/sped-nfe
 */
export const UF_AUTORIZADOR: Record<string, Autorizador> = {
  AC: 'SVRS',
  AL: 'SVRS',
  AM: 'AM',
  AP: 'SVRS',
  BA: 'BA',
  CE: 'SVRS',
  DF: 'SVRS',
  ES: 'SVRS',
  GO: 'GO',
  MA: 'SVAN',
  MG: 'MG',
  MS: 'MS',
  MT: 'MT',
  PA: 'SVRS',
  PB: 'SVRS',
  PE: 'PE',
  PI: 'SVRS',
  PR: 'PR',
  RJ: 'SVRS',
  RN: 'SVRS',
  RO: 'SVRS',
  RR: 'SVRS',
  RS: 'RS',
  SC: 'SVRS',
  SE: 'SVRS',
  SP: 'SP',
  TO: 'SVRS'
};

/**
 * Mapeamento de UF para seu autorizador NFC-e (mod65).
 * Fonte: https://github.com/nfephp-org/sped-nfe/blob/master/storage/autorizadores.json key "65"
 */
export const UF_AUTORIZADOR_NFCE: Record<string, string> = {
  AC: 'SVRS',
  AL: 'SVRS',
  AM: 'AM',
  AP: 'SVRS',
  BA: 'SVRS',
  CE: 'SVRS',
  DF: 'SVRS',
  ES: 'SVRS',
  GO: 'GO',
  MA: 'SVRS',
  MG: 'MG',
  MS: 'MS',
  MT: 'MT',
  PA: 'SVRS',
  PB: 'SVRS',
  PE: 'SVRS',
  PI: 'SVRS',
  PR: 'PR',
  RJ: 'SVRS',
  RN: 'SVRS',
  RO: 'SVRS',
  RR: 'SVRS',
  RS: 'RS',
  SC: 'SVRS',
  SE: 'SVRS',
  SP: 'SP',
  TO: 'SVRS',
  SVRS: 'SVRS'
};

/**
 * URLs dos webservices por autorizador e ambiente.
 * Fonte NF-e: https://github.com/nfephp-org/sped-nfe/blob/master/storage/wsnfe_4.00_mod55.xml
 * Fonte NFC-e: https://github.com/nfephp-org/sped-nfe/blob/master/storage/wsnfe_4.00_mod65.xml
 */
export const AUTORIZADOR_URLS: Record<Autorizador, AutorizadorUrls> = {
  AM: {
    homologacao: {
      NFeAutorizacao: 'https://homnfe.sefaz.am.gov.br/services2/services/NfeAutorizacao4',
      NFeRetAutorizacao: 'https://homnfe.sefaz.am.gov.br/services2/services/NfeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://homnfe.sefaz.am.gov.br/services2/services/NfeConsulta4',
      NFeStatusServico: 'https://homnfe.sefaz.am.gov.br/services2/services/NfeStatusServico4',
      RecepcaoEvento: 'https://homnfe.sefaz.am.gov.br/services2/services/RecepcaoEvento4',
      NFeInutilizacao: 'https://homnfe.sefaz.am.gov.br/services2/services/NfeInutilizacao4',
      NFCeAutorizacao: 'https://homnfce.sefaz.am.gov.br/nfce-services/services/NfeAutorizacao4',
      NFCeConsultaProtocolo: 'https://homnfce.sefaz.am.gov.br/nfce-services/services/NfeConsulta4',
      NFCeRecepcaoEvento: 'https://homnfce.sefaz.am.gov.br/nfce-services/services/RecepcaoEvento4'
    },
    producao: {
      NFeAutorizacao: 'https://nfe.sefaz.am.gov.br/services2/services/NfeAutorizacao4',
      NFeRetAutorizacao: 'https://nfe.sefaz.am.gov.br/services2/services/NfeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://nfe.sefaz.am.gov.br/services2/services/NfeConsulta4',
      NFeStatusServico: 'https://nfe.sefaz.am.gov.br/services2/services/NfeStatusServico4',
      RecepcaoEvento: 'https://nfe.sefaz.am.gov.br/services2/services/RecepcaoEvento4',
      NFeInutilizacao: 'https://nfe.sefaz.am.gov.br/services2/services/NfeInutilizacao4',
      NFCeAutorizacao: 'https://nfce.sefaz.am.gov.br/nfce-services/services/NfeAutorizacao4',
      NFCeConsultaProtocolo: 'https://nfce.sefaz.am.gov.br/nfce-services/services/NfeConsulta4',
      NFCeRecepcaoEvento: 'https://nfce.sefaz.am.gov.br/nfce-services/services/RecepcaoEvento4'
    }
  },
  BA: {
    homologacao: {
      NFeAutorizacao: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
      NFeStatusServico: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx',
      RecepcaoEvento: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      NFeInutilizacao: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeInutilizacao4/NFeInutilizacao4.asmx',
      NFCeAutorizacao: '',
      NFCeConsultaProtocolo: ''
    },
    producao: {
      NFeAutorizacao: 'https://nfe.sefaz.ba.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://nfe.sefaz.ba.gov.br/webservices/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://nfe.sefaz.ba.gov.br/webservices/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
      NFeStatusServico: 'https://nfe.sefaz.ba.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx',
      RecepcaoEvento: 'https://nfe.sefaz.ba.gov.br/webservices/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      NFeInutilizacao: 'https://nfe.sefaz.ba.gov.br/webservices/NFeInutilizacao4/NFeInutilizacao4.asmx',
      NFCeAutorizacao: '',
      NFCeConsultaProtocolo: ''
    }
  },
  GO: {
    homologacao: {
      NFeAutorizacao: 'https://homolog.sefaz.go.gov.br/nfe/services/NFeAutorizacao4',
      NFeRetAutorizacao: 'https://homolog.sefaz.go.gov.br/nfe/services/NFeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://homolog.sefaz.go.gov.br/nfe/services/NFeConsultaProtocolo4',
      NFeStatusServico: 'https://homolog.sefaz.go.gov.br/nfe/services/NFeStatusServico4',
      RecepcaoEvento: 'https://homolog.sefaz.go.gov.br/nfe/services/NFeRecepcaoEvento4',
      NFeInutilizacao: 'https://homolog.sefaz.go.gov.br/nfe/services/NFeInutilizacao4',
      NFCeAutorizacao: 'https://homolog.sefaz.go.gov.br/nfe/services/NFeAutorizacao4',
      NFCeConsultaProtocolo: 'https://homolog.sefaz.go.gov.br/nfe/services/NFeConsultaProtocolo4'
    },
    producao: {
      NFeAutorizacao: 'https://nfe.sefaz.go.gov.br/nfe/services/NFeAutorizacao4',
      NFeRetAutorizacao: 'https://nfe.sefaz.go.gov.br/nfe/services/NFeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://nfe.sefaz.go.gov.br/nfe/services/NFeConsultaProtocolo4',
      NFeStatusServico: 'https://nfe.sefaz.go.gov.br/nfe/services/NFeStatusServico4',
      RecepcaoEvento: 'https://nfe.sefaz.go.gov.br/nfe/services/NFeRecepcaoEvento4',
      NFeInutilizacao: 'https://nfe.sefaz.go.gov.br/nfe/services/NFeInutilizacao4',
      NFCeAutorizacao: 'https://nfe.sefaz.go.gov.br/nfe/services/NFeAutorizacao4',
      NFCeConsultaProtocolo: 'https://nfe.sefaz.go.gov.br/nfe/services/NFeConsultaProtocolo4'
    }
  },
  MG: {
    homologacao: {
      NFeAutorizacao: 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4',
      NFeRetAutorizacao: 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4',
      NFeStatusServico: 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeStatusServico4',
      RecepcaoEvento: 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4',
      NFeInutilizacao: 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4',
      NFCeAutorizacao: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
      NFCeConsultaProtocolo: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeConsultaProtocolo4',
      NFCeRecepcaoEvento: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeRecepcaoEvento4'
    },
    producao: {
      NFeAutorizacao: 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4',
      NFeRetAutorizacao: 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4',
      NFeStatusServico: 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeStatusServico4',
      RecepcaoEvento: 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4',
      NFeInutilizacao: 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4',
      NFCeAutorizacao: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
      NFCeConsultaProtocolo: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeConsultaProtocolo4',
      NFCeRecepcaoEvento: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeRecepcaoEvento4'
    }
  },
  MS: {
    homologacao: {
      NFeAutorizacao: 'https://hom.nfe.sefaz.ms.gov.br/ws/NFeAutorizacao4',
      NFeRetAutorizacao: 'https://hom.nfe.sefaz.ms.gov.br/ws/NFeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://hom.nfe.sefaz.ms.gov.br/ws/NFeConsultaProtocolo4',
      NFeStatusServico: 'https://hom.nfe.sefaz.ms.gov.br/ws/NFeStatusServico4',
      RecepcaoEvento: 'https://hom.nfe.sefaz.ms.gov.br/ws/NFeRecepcaoEvento4',
      NFeInutilizacao: 'https://hom.nfe.sefaz.ms.gov.br/ws/NFeInutilizacao4',
      NFCeAutorizacao: 'https://hom.nfce.sefaz.ms.gov.br/ws/NFeAutorizacao4',
      NFCeConsultaProtocolo: 'https://hom.nfce.sefaz.ms.gov.br/ws/NFeConsultaProtocolo4',
      NFCeRecepcaoEvento: 'https://hom.nfce.sefaz.ms.gov.br/ws/NFeRecepcaoEvento4'
    },
    producao: {
      NFeAutorizacao: 'https://nfe.sefaz.ms.gov.br/ws/NFeAutorizacao4',
      NFeRetAutorizacao: 'https://nfe.sefaz.ms.gov.br/ws/NFeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://nfe.sefaz.ms.gov.br/ws/NFeConsultaProtocolo4',
      NFeStatusServico: 'https://nfe.sefaz.ms.gov.br/ws/NFeStatusServico4',
      RecepcaoEvento: 'https://nfe.sefaz.ms.gov.br/ws/NFeRecepcaoEvento4',
      NFeInutilizacao: 'https://nfe.sefaz.ms.gov.br/ws/NFeInutilizacao4',
      NFCeAutorizacao: 'https://nfce.sefaz.ms.gov.br/ws/NFeAutorizacao4',
      NFCeConsultaProtocolo: 'https://nfce.sefaz.ms.gov.br/ws/NFeConsultaProtocolo4',
      NFCeRecepcaoEvento: 'https://nfce.sefaz.ms.gov.br/ws/NFeRecepcaoEvento4'
    }
  },
  MT: {
    homologacao: {
      NFeAutorizacao: 'https://homologacao.sefaz.mt.gov.br/nfews/v2/services/NfeAutorizacao4',
      NFeRetAutorizacao: 'https://homologacao.sefaz.mt.gov.br/nfews/v2/services/NfeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://homologacao.sefaz.mt.gov.br/nfews/v2/services/NfeConsulta4',
      NFeStatusServico: 'https://homologacao.sefaz.mt.gov.br/nfews/v2/services/NfeStatusServico4',
      RecepcaoEvento: 'https://homologacao.sefaz.mt.gov.br/nfews/v2/services/RecepcaoEvento4',
      NFeInutilizacao: 'https://homologacao.sefaz.mt.gov.br/nfews/v2/services/NfeInutilizacao4',
      NFCeAutorizacao: 'https://homologacao.sefaz.mt.gov.br/nfcews/services/NfeAutorizacao4',
      NFCeConsultaProtocolo: 'https://homologacao.sefaz.mt.gov.br/nfcews/services/NfeConsulta4',
      NFCeRecepcaoEvento: 'https://homologacao.sefaz.mt.gov.br/nfcews/services/RecepcaoEvento4'
    },
    producao: {
      NFeAutorizacao: 'https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeAutorizacao4',
      NFeRetAutorizacao: 'https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeConsulta4',
      NFeStatusServico: 'https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeStatusServico4',
      RecepcaoEvento: 'https://nfe.sefaz.mt.gov.br/nfews/v2/services/RecepcaoEvento4',
      NFeInutilizacao: 'https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeInutilizacao4',
      NFCeAutorizacao: 'https://nfce.sefaz.mt.gov.br/nfcews/services/NfeAutorizacao4',
      NFCeConsultaProtocolo: 'https://nfce.sefaz.mt.gov.br/nfcews/services/NfeConsulta4',
      NFCeRecepcaoEvento: 'https://nfce.sefaz.mt.gov.br/nfcews/services/RecepcaoEvento4'
    }
  },
  PE: {
    homologacao: {
      NFeAutorizacao: 'https://nfehomolog.sefaz.pe.gov.br/nfe-service/services/NFeAutorizacao4',
      NFeRetAutorizacao: 'https://nfehomolog.sefaz.pe.gov.br/nfe-service/services/NFeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://nfehomolog.sefaz.pe.gov.br/nfe-service/services/NFeConsultaProtocolo4',
      NFeStatusServico: 'https://nfehomolog.sefaz.pe.gov.br/nfe-service/services/NFeStatusServico4',
      RecepcaoEvento: 'https://nfehomolog.sefaz.pe.gov.br/nfe-service/services/NFeRecepcaoEvento4',
      NFeInutilizacao: 'https://nfehomolog.sefaz.pe.gov.br/nfe-service/services/NFeInutilizacao4',
      NFCeAutorizacao: '',
      NFCeConsultaProtocolo: ''
    },
    producao: {
      NFeAutorizacao: 'https://nfe.sefaz.pe.gov.br/nfe-service/services/NFeAutorizacao4',
      NFeRetAutorizacao: 'https://nfe.sefaz.pe.gov.br/nfe-service/services/NFeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://nfe.sefaz.pe.gov.br/nfe-service/services/NFeConsultaProtocolo4',
      NFeStatusServico: 'https://nfe.sefaz.pe.gov.br/nfe-service/services/NFeStatusServico4',
      RecepcaoEvento: 'https://nfe.sefaz.pe.gov.br/nfe-service/services/NFeRecepcaoEvento4',
      NFeInutilizacao: 'https://nfe.sefaz.pe.gov.br/nfe-service/services/NFeInutilizacao4',
      NFCeAutorizacao: '',
      NFCeConsultaProtocolo: ''
    }
  },
  PR: {
    homologacao: {
      NFeAutorizacao: 'https://homologacao.nfe.sefa.pr.gov.br/nfe/NFeAutorizacao4',
      NFeRetAutorizacao: 'https://homologacao.nfe.sefa.pr.gov.br/nfe/NFeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://homologacao.nfe.sefa.pr.gov.br/nfe/NFeConsultaProtocolo4',
      NFeStatusServico: 'https://homologacao.nfe.sefa.pr.gov.br/nfe/NFeStatusServico4',
      RecepcaoEvento: 'https://homologacao.nfe.sefa.pr.gov.br/nfe/NFeRecepcaoEvento4',
      NFeInutilizacao: 'https://homologacao.nfe.sefa.pr.gov.br/nfe/NFeInutilizacao4',
      NFCeAutorizacao: 'https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeAutorizacao4',
      NFCeConsultaProtocolo: 'https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeConsultaProtocolo4',
      NFCeRecepcaoEvento: 'https://homologacao.nfce.sefa.pr.gov.br/nfce/NFeRecepcaoEvento4'
    },
    producao: {
      NFeAutorizacao: 'https://nfe.sefa.pr.gov.br/nfe/NFeAutorizacao4',
      NFeRetAutorizacao: 'https://nfe.sefa.pr.gov.br/nfe/NFeRetAutorizacao4',
      NFeConsultaProtocolo: 'https://nfe.sefa.pr.gov.br/nfe/NFeConsultaProtocolo4',
      NFeStatusServico: 'https://nfe.sefa.pr.gov.br/nfe/NFeStatusServico4',
      RecepcaoEvento: 'https://nfe.sefa.pr.gov.br/nfe/NFeRecepcaoEvento4',
      NFeInutilizacao: 'https://nfe.sefa.pr.gov.br/nfe/NFeInutilizacao4',
      NFCeAutorizacao: 'https://nfce.sefa.pr.gov.br/nfce/NFeAutorizacao4',
      NFCeConsultaProtocolo: 'https://nfce.sefa.pr.gov.br/nfce/NFeConsultaProtocolo4',
      NFCeRecepcaoEvento: 'https://nfce.sefa.pr.gov.br/nfce/NFeRecepcaoEvento4'
    }
  },
  RS: {
    homologacao: {
      NFeAutorizacao: 'https://nfe-homologacao.sefazrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://nfe-homologacao.sefazrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://nfe-homologacao.sefazrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      NFeStatusServico: 'https://nfe-homologacao.sefazrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
      RecepcaoEvento: 'https://nfe-homologacao.sefazrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
      NFeInutilizacao: 'https://nfe-homologacao.sefazrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
      NFCeAutorizacao: 'https://nfce-homologacao.sefazrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      NFCeConsultaProtocolo: 'https://nfce-homologacao.sefazrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      NFCeRecepcaoEvento: 'https://nfce-homologacao.sefazrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx'
    },
    producao: {
      NFeAutorizacao: 'https://nfe.sefazrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://nfe.sefazrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://nfe.sefazrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      NFeStatusServico: 'https://nfe.sefazrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
      RecepcaoEvento: 'https://nfe.sefazrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
      NFeInutilizacao: 'https://nfe.sefazrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
      NFCeAutorizacao: 'https://nfce.sefazrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      NFCeConsultaProtocolo: 'https://nfce.sefazrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      NFCeRecepcaoEvento: 'https://nfce.sefazrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx'
    }
  },
  SP: {
    homologacao: {
      NFeAutorizacao: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
      NFeRetAutorizacao: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx',
      NFeConsultaProtocolo: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
      NFeStatusServico: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx',
      RecepcaoEvento: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx',
      NFeInutilizacao: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx',
      NFCeAutorizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx',
      NFCeConsultaProtocolo: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeConsultaProtocolo4.asmx',
      NFCeRecepcaoEvento: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx'
    },
    producao: {
      NFeAutorizacao: 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
      NFeRetAutorizacao: 'https://nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx',
      NFeConsultaProtocolo: 'https://nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
      NFeStatusServico: 'https://nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx',
      RecepcaoEvento: 'https://nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx',
      NFeInutilizacao: 'https://nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx',
      NFCeAutorizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx',
      NFCeConsultaProtocolo: 'https://nfce.fazenda.sp.gov.br/ws/NFeConsultaProtocolo4.asmx',
      NFCeRecepcaoEvento: 'https://nfce.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx'
    }
  },
  SVAN: {
    homologacao: {
      NFeAutorizacao: 'https://hom.sefazvirtual.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://hom.sefazvirtual.fazenda.gov.br/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://hom.sefazvirtual.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
      NFeStatusServico: 'https://hom.sefazvirtual.fazenda.gov.br/NFeStatusServico4/NFeStatusServico4.asmx',
      RecepcaoEvento: 'https://hom.sefazvirtual.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      NFeInutilizacao: 'https://hom.sefazvirtual.fazenda.gov.br/NFeInutilizacao4/NFeInutilizacao4.asmx',
      NFCeAutorizacao: '',
      NFCeConsultaProtocolo: ''
    },
    producao: {
      NFeAutorizacao: 'https://www.sefazvirtual.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://www.sefazvirtual.fazenda.gov.br/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://www.sefazvirtual.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
      NFeStatusServico: 'https://www.sefazvirtual.fazenda.gov.br/NFeStatusServico4/NFeStatusServico4.asmx',
      RecepcaoEvento: 'https://www.sefazvirtual.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      NFeInutilizacao: 'https://www.sefazvirtual.fazenda.gov.br/NFeInutilizacao4/NFeInutilizacao4.asmx',
      NFCeAutorizacao: '',
      NFCeConsultaProtocolo: ''
    }
  },
  SVRS: {
    homologacao: {
      NFeAutorizacao: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      NFeStatusServico: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
      RecepcaoEvento: 'https://nfe-homologacao.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
      NFeInutilizacao: 'https://nfe-homologacao.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
      NFCeAutorizacao: 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      NFCeConsultaProtocolo: 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx'
    },
    producao: {
      NFeAutorizacao: 'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://nfe.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://nfe.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      NFeStatusServico: 'https://nfe.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
      RecepcaoEvento: 'https://nfe.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
      NFeInutilizacao: 'https://nfe.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
      NFCeAutorizacao: 'https://nfce.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      NFCeConsultaProtocolo: 'https://nfce.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx'
    }
  },
  'SVC-AN': {
    homologacao: {
      NFeAutorizacao: 'https://hom.sefazvirtual.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://hom.sefazvirtual.fazenda.gov.br/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://hom.sefazvirtual.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
      NFeStatusServico: 'https://hom.sefazvirtual.fazenda.gov.br/NFeStatusServico4/NFeStatusServico4.asmx',
      RecepcaoEvento: 'https://hom.sefazvirtual.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      NFeInutilizacao: 'https://hom.sefazvirtual.fazenda.gov.br/NFeInutilizacao4/NFeInutilizacao4.asmx',
      NFCeAutorizacao: '',
      NFCeConsultaProtocolo: ''
    },
    producao: {
      NFeAutorizacao: 'https://www.sefazvirtual.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://www.sefazvirtual.fazenda.gov.br/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://www.sefazvirtual.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
      NFeStatusServico: 'https://www.sefazvirtual.fazenda.gov.br/NFeStatusServico4/NFeStatusServico4.asmx',
      RecepcaoEvento: 'https://www.sefazvirtual.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      NFeInutilizacao: 'https://www.sefazvirtual.fazenda.gov.br/NFeInutilizacao4/NFeInutilizacao4.asmx',
      NFCeAutorizacao: '',
      NFCeConsultaProtocolo: ''
    }
  },
  'SVC-RS': {
    homologacao: {
      NFeAutorizacao: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      NFeStatusServico: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
      RecepcaoEvento: 'https://nfe-homologacao.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
      NFeInutilizacao: 'https://nfe-homologacao.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
      NFCeAutorizacao: '',
      NFCeConsultaProtocolo: ''
    },
    producao: {
      NFeAutorizacao: 'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      NFeRetAutorizacao: 'https://nfe.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      NFeConsultaProtocolo: 'https://nfe.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      NFeStatusServico: 'https://nfe.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
      RecepcaoEvento: 'https://nfe.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
      NFeInutilizacao: 'https://nfe.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
      NFCeAutorizacao: '',
      NFCeConsultaProtocolo: ''
    }
  }
};

/**
 * Mapeamento reverso: codigo IBGE da UF → sigla da UF.
 */
const IBGE_TO_UF: Record<string, string> = {
  '12': 'AC', '27': 'AL', '13': 'AM', '16': 'AP', '29': 'BA',
  '23': 'CE', '53': 'DF', '32': 'ES', '52': 'GO', '21': 'MA',
  '31': 'MG', '50': 'MS', '51': 'MT', '15': 'PA', '25': 'PB',
  '26': 'PE', '22': 'PI', '41': 'PR', '33': 'RJ', '24': 'RN',
  '11': 'RO', '14': 'RR', '43': 'RS', '42': 'SC', '28': 'SE',
  '35': 'SP', '17': 'TO'
};

/**
 * Retorna a URL do webservice da SEFAZ para a UF, ambiente e servico informados.
 */
export function getSefazUrl(
  uf: string,
  environment: SefazEnvironment,
  service: SefazService
): string {
  const autorizador = UF_AUTORIZADOR[uf];
  if (!autorizador) {
    throw new NFeError(`UF desconhecida: ${uf}`);
  }

  const urls = AUTORIZADOR_URLS[autorizador];
  if (!urls) {
    throw new NFeError(
      `SEFAZ nao configurada para UF: ${uf} (autorizador: ${autorizador})`
    );
  }

  const url = urls[environment][service];
  if (!url) {
    throw new NFeError(
      `Servico ${service} nao configurado para ${autorizador} em ${environment}`
    );
  }

  return url;
}

/**
 * Retorna a URL do webservice de RecepcaoEvento (cancelamento, CCe, manifestacao)
 * para a UF/ambiente, escolhendo o endpoint correto conforme o modelo do documento.
 *
 * NFC-e (mod65) em autorizador com host proprio (ex.: MT, SP, MG, PR, RS, MS, AM)
 * precisa ir para o webservice de NFC-e — enviar no endpoint de NF-e (mod55) gera
 * rejeicao 450 "Modelo da NF-e diferente de 55". Quando o autorizador nao tem host
 * proprio de NFC-e (compartilha com a NF-e), cai no `RecepcaoEvento`.
 */
export function getEventoUrl(
  uf: string,
  environment: SefazEnvironment,
  modelo: string
): string {
  if (modelo === '65') {
    const autorizador = UF_AUTORIZADOR[uf];
    const nfceEvento = autorizador
      ? AUTORIZADOR_URLS[autorizador]?.[environment]?.NFCeRecepcaoEvento
      : undefined;
    if (nfceEvento) return nfceEvento;
  }
  return getSefazUrl(uf, environment, 'RecepcaoEvento');
}

/**
 * Converte codigo IBGE (2 digitos) para sigla da UF.
 */
export function ibgeToUf(codigoIbge: string): string {
  const uf = IBGE_TO_UF[codigoIbge];
  if (!uf) {
    throw new NFeError(`Codigo IBGE de UF desconhecido: ${codigoIbge}`);
  }
  return uf;
}
