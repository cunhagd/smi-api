import { IsDateString, IsOptional } from 'class-validator';

export class DashboardFilterDto {
  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;
}

export class DashboardResponseDto {
  totalNoticias: number;
  totalNoticiasPositivas: number;
  totalNoticiasNegativas: number;
  noticiasPorPeriodo: { data: string; quantidade: number }[];
  pontuacaoPorPeriodo: { data: string; pontuacao: number }[];
  portaisRelevantes: { portal: string; quantidade: number }[];
  evolucaoNoticiasPorPeriodo: { data: string; quantidade: number }[];
  sentimentoNoticiasPorPeriodo: { data: string; positivas: number; negativas: number; neutras: number }[];
}