export type FaturaProps = {
  readonly nFat?: string;
  readonly vOrig?: number;
  readonly vDesc?: number;
  readonly vLiq?: number;
};

export type DuplicataProps = {
  readonly nDup: string;
  readonly dVenc: string;
  readonly vDup: number;
};

export type CobrancaProps = {
  readonly fatura?: FaturaProps;
  readonly duplicatas?: DuplicataProps[];
};
