import { EmitenteProps } from './Emitente';
import { DestinatarioProps } from './Destinatario';
import { ProdutoProps } from './Produto';
import { TransporteProps } from './Transporte';
import { PagamentoProps } from './Pagamento';
import { CobrancaProps } from './Cobranca';

export type NFeIdentificacao = {
  readonly naturezaOperacao: string;
  readonly tipoOperacao: 0 | 1;
  readonly destinoOperacao: 1 | 2 | 3;
  readonly finalidade: 1 | 2 | 3 | 4;
  readonly consumidorFinal: 0 | 1;
  readonly presencaComprador: 0 | 1 | 2 | 3 | 4 | 5 | 9;
  readonly uf: string;
  readonly municipio: string;
  readonly serie: number;
  readonly numero: number;
  readonly dataEmissao?: Date;
  readonly tipoEmissao?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 9;
  readonly tipoImpressao?: 0 | 1 | 2 | 3 | 4 | 5;
};

export type NFeProps = {
  readonly identificacao: NFeIdentificacao;
  readonly emitente: EmitenteProps;
  readonly destinatario: DestinatarioProps;
  readonly produtos: ProdutoProps[];
  readonly transporte: TransporteProps;
  readonly cobranca?: CobrancaProps;
  readonly pagamento: PagamentoProps;
  readonly informacoesComplementares?: string;
  readonly informacoesFisco?: string;
};

export class NFe {
  public readonly identificacao: NFeIdentificacao;
  public readonly emitente: EmitenteProps;
  public readonly destinatario: DestinatarioProps;
  public readonly produtos: readonly ProdutoProps[];
  public readonly transporte: TransporteProps;
  public readonly cobranca?: CobrancaProps;
  public readonly pagamento: PagamentoProps;
  public readonly informacoesComplementares?: string;
  public readonly informacoesFisco?: string;

  constructor(props: NFeProps) {
    this.identificacao = {
      ...props.identificacao,
      dataEmissao: props.identificacao.dataEmissao ?? new Date(),
      tipoEmissao: props.identificacao.tipoEmissao ?? 1,
      tipoImpressao: props.identificacao.tipoImpressao ?? 1
    };
    this.emitente = props.emitente;
    this.destinatario = props.destinatario;
    this.produtos = Object.freeze([...props.produtos]);
    this.transporte = props.transporte;
    this.cobranca = props.cobranca;
    this.pagamento = props.pagamento;
    this.informacoesComplementares = props.informacoesComplementares;
    this.informacoesFisco = props.informacoesFisco;
  }
}
