import { NFeError } from '@nfe/shared/errors/NFeError'

type NFCeUrlConfig = {
  readonly urlQRCode: { homologacao: string; producao: string }
  readonly urlChave: { homologacao: string; producao: string }
}

const NFCE_URLS: Record<string, NFCeUrlConfig> = {
  AC: {
    urlQRCode: {
      homologacao: 'https://www.hml.sefaznet.ac.gov.br/nfce/qrcode',
      producao: 'https://www.sefaznet.ac.gov.br/nfce/qrcode'
    },
    urlChave: {
      homologacao: 'https://www.sefaznet.ac.gov.br/nfce/consulta',
      producao: 'https://www.sefaznet.ac.gov.br/nfce/consulta'
    }
  },
  AL: {
    urlQRCode: {
      homologacao: 'https://nfce.sefaz.al.gov.br/QRCode/consultarNFCe.jsp',
      producao: 'https://nfce.sefaz.al.gov.br/QRCode/consultarNFCe.jsp'
    },
    urlChave: {
      homologacao: 'https://www.sefaz.al.gov.br/nfce/consulta',
      producao: 'https://www.sefaz.al.gov.br/nfce/consulta'
    }
  },
  AM: {
    urlQRCode: {
      homologacao: 'https://sistemas.sefaz.am.gov.br/nfceweb-hom/consultarNFCe.jsp',
      producao: 'https://sistemas.sefaz.am.gov.br/nfceweb/consultarNFCe.jsp'
    },
    urlChave: {
      homologacao: 'https://www.sefaz.am.gov.br/nfce/consulta',
      producao: 'https://www.sefaz.am.gov.br/nfce/consulta'
    }
  },
  AP: {
    urlQRCode: {
      homologacao: 'https://www.sefaz.ap.gov.br/nfcehml/nfce.php',
      producao: 'https://www.sefaz.ap.gov.br/nfce/nfcep.php'
    },
    urlChave: {
      homologacao: 'https://www.sefaz.ap.gov.br/nfce/consulta',
      producao: 'https://www.sefaz.ap.gov.br/nfce/consulta'
    }
  },
  BA: {
    urlQRCode: {
      homologacao: 'https://hnfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx',
      producao: 'https://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx'
    },
    urlChave: {
      homologacao: 'https://hinternet.sefaz.ba.gov.br/nfce/consulta',
      producao: 'https://www.sefaz.ba.gov.br/nfce/consulta'
    }
  },
  CE: {
    urlQRCode: {
      homologacao: 'https://nfceh.sefaz.ce.gov.br/pages/ShowNFCe.html',
      producao: 'https://nfce.sefaz.ce.gov.br/pages/ShowNFCe.html'
    },
    urlChave: {
      homologacao: 'https://www.sefaz.ce.gov.br/nfce/consulta',
      producao: 'https://www.sefaz.ce.gov.br/nfce/consulta'
    }
  },
  DF: {
    urlQRCode: {
      homologacao: 'https://dec.fazenda.df.gov.br/ConsultarNFCe.aspx',
      producao: 'https://www.fazenda.df.gov.br/nfce/qrcode'
    },
    urlChave: {
      homologacao: 'https://www.fazenda.df.gov.br/nfce/consulta',
      producao: 'https://www.fazenda.df.gov.br/nfce/consulta'
    }
  },
  ES: {
    urlQRCode: {
      homologacao: 'https://homologacao.sefaz.es.gov.br/ConsultaNFCe/qrcode.aspx',
      producao: 'https://app.sefaz.es.gov.br/ConsultaNFCe/qrcode.aspx'
    },
    urlChave: {
      homologacao: 'https://www.sefaz.es.gov.br/nfce/consulta',
      producao: 'https://www.sefaz.es.gov.br/nfce/consulta'
    }
  },
  GO: {
    urlQRCode: {
      homologacao: 'https://nfewebhomolog.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe',
      producao: 'https://nfeweb.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe'
    },
    urlChave: {
      homologacao: 'https://www.nfce.go.gov.br/post/ver/214413/consulta-nfc-e-homologacao',
      producao: 'https://www.sefaz.go.gov.br/nfce/consulta'
    }
  },
  MA: {
    urlQRCode: {
      homologacao: 'https://www.hom.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp',
      producao: 'https://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp'
    },
    urlChave: {
      homologacao: 'https://www.sefaz.ma.gov.br/nfce/consulta',
      producao: 'https://www.sefaz.ma.gov.br/nfce/consulta'
    }
  },
  MG: {
    urlQRCode: {
      homologacao: 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml',
      producao: 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml'
    },
    urlChave: {
      homologacao: 'https://hportalsped.fazenda.mg.gov.br/portalnfce',
      producao: 'https://portalsped.fazenda.mg.gov.br/portalnfce'
    }
  },
  MS: {
    urlQRCode: {
      homologacao: 'https://www.dfe.ms.gov.br/nfce/qrcode',
      producao: 'https://www.dfe.ms.gov.br/nfce/qrcode'
    },
    urlChave: {
      homologacao: 'https://www.dfe.ms.gov.br/nfce/consulta',
      producao: 'https://www.dfe.ms.gov.br/nfce/consulta'
    }
  },
  MT: {
    urlQRCode: {
      homologacao: 'https://homologacao.sefaz.mt.gov.br/nfce/consultanfce',
      producao: 'https://www.sefaz.mt.gov.br/nfce/consultanfce'
    },
    urlChave: {
      homologacao: 'https://homologacao.sefaz.mt.gov.br/nfce/consultanfce',
      producao: 'https://www.sefaz.mt.gov.br/nfce/consultanfce'
    }
  },
  PA: {
    urlQRCode: {
      homologacao: 'https://appnfc.sefa.pa.gov.br/portal-homologacao/view/consultas/nfce/nfceForm.seam',
      producao: 'https://appnfc.sefa.pa.gov.br/portal/view/consultas/nfce/nfceForm.seam'
    },
    urlChave: {
      homologacao: 'https://www.sefa.pa.gov.br/nfce/consulta',
      producao: 'https://www.sefa.pa.gov.br/nfce/consulta'
    }
  },
  PB: {
    urlQRCode: {
      homologacao: 'https://www.sefaz.pb.gov.br/nfcehom',
      producao: 'https://www.sefaz.pb.gov.br/nfce'
    },
    urlChave: {
      homologacao: 'https://www.sefaz.pb.gov.br/nfcehom',
      producao: 'https://www.sefaz.pb.gov.br/nfce/consulta'
    }
  },
  PE: {
    urlQRCode: {
      homologacao: 'https://nfcehomolog.sefaz.pe.gov.br/nfce/consulta',
      producao: 'https://nfce.sefaz.pe.gov.br/nfce/consulta'
    },
    urlChave: {
      homologacao: 'https://nfce.sefaz.pe.gov.br/nfce/consulta',
      producao: 'https://nfce.sefaz.pe.gov.br/nfce/consulta'
    }
  },
  PI: {
    urlQRCode: {
      homologacao: 'https://www.sefaz.pi.gov.br/nfce/qrcode',
      producao: 'https://www.sefaz.pi.gov.br/nfce/qrcode'
    },
    urlChave: {
      homologacao: 'https://www.sefaz.pi.gov.br/nfce/consulta',
      producao: 'https://www.sefaz.pi.gov.br/nfce/consulta'
    }
  },
  PR: {
    urlQRCode: {
      homologacao: 'https://www.fazenda.pr.gov.br/nfce/qrcode',
      producao: 'https://www.fazenda.pr.gov.br/nfce/qrcode'
    },
    urlChave: {
      homologacao: 'https://www.fazenda.pr.gov.br/nfce/consulta',
      producao: 'https://www.fazenda.pr.gov.br/nfce/consulta'
    }
  },
  RJ: {
    urlQRCode: {
      homologacao: 'https://www4.fazenda.rj.gov.br/consultaNFCe/QRCode',
      producao: 'https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode'
    },
    urlChave: {
      homologacao: 'https://www.fazenda.rj.gov.br/nfce/consulta',
      producao: 'https://www.fazenda.rj.gov.br/nfce/consulta'
    }
  },
  RN: {
    urlQRCode: {
      homologacao: 'https://hom.nfce.set.rn.gov.br/consultarNFCe.aspx',
      producao: 'https://nfce.set.rn.gov.br/consultarNFCe.aspx'
    },
    urlChave: {
      homologacao: 'https://www.set.rn.gov.br/nfce/consulta',
      producao: 'https://www.set.rn.gov.br/nfce/consulta'
    }
  },
  RO: {
    urlQRCode: {
      homologacao: 'https://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp',
      producao: 'https://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp'
    },
    urlChave: {
      homologacao: 'https://www.sefin.ro.gov.br/nfce/consulta',
      producao: 'https://www.sefin.ro.gov.br/nfce/consulta'
    }
  },
  RR: {
    urlQRCode: {
      homologacao: 'https://200.174.88.103:8080/nfce/servlet/qrcode',
      producao: 'https://www.sefaz.rr.gov.br/servlet/qrcode'
    },
    urlChave: {
      homologacao: 'https://www.sefaz.rr.gov.br/nfce/consulta',
      producao: 'https://www.sefaz.rr.gov.br/nfce/consulta'
    }
  },
  RS: {
    urlQRCode: {
      homologacao: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
      producao: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx'
    },
    urlChave: {
      homologacao: 'https://www.sefaz.rs.gov.br/nfce/consulta',
      producao: 'https://www.sefaz.rs.gov.br/nfce/consulta'
    }
  },
  SC: {
    urlQRCode: {
      homologacao: 'https://hom.sat.sef.sc.gov.br/nfce/consulta',
      producao: 'https://sat.sef.sc.gov.br/nfce/consulta'
    },
    urlChave: {
      homologacao: 'https://hom.sat.sef.sc.gov.br/nfce/consulta',
      producao: 'https://sat.sef.sc.gov.br/nfce/consulta'
    }
  },
  SE: {
    urlQRCode: {
      homologacao: 'https://www.hom.nfe.se.gov.br/nfce/qrcode',
      producao: 'https://www.nfce.se.gov.br/nfce/qrcode'
    },
    urlChave: {
      homologacao: 'https://www.hom.nfe.se.gov.br/nfce/consulta',
      producao: 'https://www.nfce.se.gov.br/nfce/consulta'
    }
  },
  SP: {
    urlQRCode: {
      homologacao: 'https://www.homologacao.nfce.fazenda.sp.gov.br/qrcode',
      producao: 'https://www.nfce.fazenda.sp.gov.br/qrcode'
    },
    urlChave: {
      homologacao: 'https://www.homologacao.nfce.fazenda.sp.gov.br/NFCeConsultaPublica',
      producao: 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica'
    }
  },
  TO: {
    urlQRCode: {
      homologacao: 'https://homologacao.sefaz.to.gov.br/nfce/qrcode',
      producao: 'https://www.sefaz.to.gov.br/nfce/qrcode'
    },
    urlChave: {
      homologacao: 'https://homologacao.sefaz.to.gov.br/nfce/consulta.jsf',
      producao: 'https://www.sefaz.to.gov.br/nfce/consulta'
    }
  }
}

export type NFCeEnvironment = 'homologacao' | 'producao'

export function getNFCeQRCodeUrl(uf: string, environment: NFCeEnvironment): string {
  const config = NFCE_URLS[uf]
  if (!config) {
    throw new NFeError(`URLs NFC-e nao configuradas para UF: ${uf}`)
  }
  return config.urlQRCode[environment]
}

export function getNFCeConsultaUrl(uf: string, environment: NFCeEnvironment): string {
  const config = NFCE_URLS[uf]
  if (!config) {
    throw new NFeError(`URLs NFC-e nao configuradas para UF: ${uf}`)
  }
  return config.urlChave[environment]
}
