import { IsOptional, IsString } from 'class-validator';

export class DashboardFilterDto {
  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;
}

export class PortalItem {
  portal: string;
  pontuacao: number;
}

export class DashboardResponseDto {
  totalNoticias: number;
  totalNoticiasPositivas: number;
  totalNoticiasNegativas: number;
  noticiasPorPeriodo: { data: string; quantidade: number }[];
  pontuacaoPorPeriodo: { data: string; pontuacao: number }[];
  evolucaoNoticiasPorPeriodo: { data: string; quantidade: number }[];
  sentimentoNoticiasPorPeriodo: { data: string; positivas: number; negativas: number; neutras: number }[];
}