import { NFeError } from '@nfe/shared/errors/NFeError';

export type AnService = 'NFeDistribuicaoDFe' | 'RecepcaoEvento';
export type AnEnvironment = 'homologacao' | 'producao';

/**
 * URLs do Ambiente Nacional (AN) para servicos nacionais da NFe.
 * Esses servicos nao seguem o modelo UF → Autorizador — sao centralizados.
 * Fonte: https://github.com/nfephp-org/sped-nfe/blob/master/storage/wsnfe_4.00_mod55.xml
 */
const AN_URLS: Record<AnEnvironment, Record<AnService, string>> = {
  homologacao: {
    NFeDistribuicaoDFe: 'https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
    RecepcaoEvento: 'https://hom1.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx'
  },
  producao: {
    NFeDistribuicaoDFe: 'https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
    RecepcaoEvento: 'https://www.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx'
  }
};

/**
 * Retorna a URL do servico nacional (AN) para o ambiente informado.
 */
export function getAnUrl(
  environment: AnEnvironment,
  service: AnService
): string {
  const url = AN_URLS[environment][service];
  if (!url) {
    throw new NFeError(
      `Servico ${service} nao configurado para ambiente ${environment}`
    );
  }
  return url;
}
