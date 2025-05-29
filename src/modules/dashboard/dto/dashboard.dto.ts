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
  quantidade: number;
  positivo: number;
  negativo: number;
  neutro: number;
  '%positivo': string;
  '%negativo': string;
  '%neutro': string;
}

export class DashboardResponseDto {
  totalNoticias: number;
  totalNoticiasPositivas: number;
  totalNoticiasNegativas: number;
  totalNoticiasNeutras: number;
  noticiasPorPeriodo: { data: string; quantidade: number }[];
  pontuacaoPorPeriodo: { data: string; pontuacao: number }[];
  evolucaoNoticiasPorPeriodo: { data: string; quantidade: number }[];
  sentimentoNoticiasPorPeriodo: { data: string; positivas: number; negativas: number; neutras: number }[];
}

export class TotalResponseDto {
  total: number;
}

export class NoticiasPorPeriodoItem {
  data: string;
  quantidade: number;
}

export class PontuacaoPorPeriodoItem {
  data: string;
  pontuacao: number;
}

export class SentimentoNoticiasItem {
  data: string;
  positivas: number;
  negativas: number;
  neutras: number;
}

export class NoticiasTemaPorDataItem {
  data: string;
  'total-infraestrutura': number;
  'total-social': number;
  'total-educacao': number;
  'total-saude': number;
}

export class DashEstrategicaResponseDto {
  'dash-estrategica': {
    'total-noticias-estratégicas': number;
    'total-pontuacao-estratégicas': number;
    'total-noticias-tema': NoticiasTemaPorDataItem[];
  }[];
}

export class NoticiasPorPeriodoMensalItem {
  mes: string;
  quantidade: number;
}

export class SentimentoNoticiasMensalItem {
  mes: string;
  positivas: number;
  negativas: number;
  neutras: number;
}