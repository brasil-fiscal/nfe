export type ICMSProps = {
  readonly origem: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly cst?: string;
  readonly csosn?: string;
  readonly aliquota?: number;
  readonly baseCalculo?: number;
  readonly valor?: number;
};

export type PISProps = {
  readonly cst: string;
  readonly baseCalculo?: number;
  readonly aliquota?: number;
  readonly valor?: number;
};

export type COFINSProps = {
  readonly cst: string;
  readonly baseCalculo?: number;
  readonly aliquota?: number;
  readonly valor?: number;
};

export type IPIProps = {
  readonly cst: string;
  readonly baseCalculo?: number;
  readonly aliquota?: number;
  readonly valor?: number;
  readonly cEnq?: string;
};

export type ProdutoProps = {
  readonly numero: number;
  readonly codigo: string;
  readonly descricao: string;
  readonly ncm: string;
  readonly cest?: string;
  readonly cfop: string;
  readonly unidade: string;
  readonly quantidade: number;
  readonly valorUnitario: number;
  readonly valorTotal: number;
  readonly valorDesconto?: number;
  readonly valorFrete?: number;
  readonly valorSeguro?: number;
  readonly outrasDespesas?: number;
  readonly ean?: string;
  readonly eanTributavel?: string;
  readonly icms: ICMSProps;
  readonly pis: PISProps;
  readonly cofins: COFINSProps;
  readonly ipi?: IPIProps;
};
