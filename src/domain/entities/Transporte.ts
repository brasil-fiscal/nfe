export type VolumeProps = {
  readonly quantidade?: number;
  readonly especie?: string;
  readonly marca?: string;
  readonly numeracao?: string;
  readonly pesoLiquido?: number;
  readonly pesoBruto?: number;
};

export type VeiculoTranspProps = {
  readonly placa?: string;
  readonly uf?: string;
  readonly rntc?: string;
};

export type TransporteProps = {
  readonly modalidadeFrete: 0 | 1 | 2 | 3 | 4 | 9;
  readonly cnpjTransportadora?: string;
  readonly nomeTransportadora?: string;
  readonly inscricaoEstadual?: string;
  readonly endereco?: string;
  readonly municipio?: string;
  readonly uf?: string;
  readonly veiculo?: VeiculoTranspProps;
  readonly volumes?: VolumeProps[];
};
