import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import {
  DashboardFilterDto,
  DashboardResponseDto,
  PortalItem,
  TotalResponseDto,
  NoticiasPorPeriodoItem,
  PontuacaoPorPeriodoItem,
  SentimentoNoticiasItem,
  DashEstrategicaResponseDto,
  NoticiasPorPeriodoMensalItem,
  SentimentoNoticiasMensalItem,
} from './dto/dashboard.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Obtém dados gerais do dashboard' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiQuery({ name: 'forceLast30Days', required: false, type: Boolean, description: 'Forçar últimos 30 dias (true/false)' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard', type: DashboardResponseDto })
  async getDashboardData(@Query() filter: DashboardFilterDto, @Query('forceLast30Days') forceLast30Days: string): Promise<DashboardResponseDto> {
    const force = forceLast30Days === 'true';
    return this.dashboardService.getDashboardData(filter, force);
  }

  @Get('noticias-total')
  @ApiOperation({ summary: 'Obtém total de notícias no período' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Total de notícias', type: TotalResponseDto })
  async getTotalNoticias(@Query() filter: DashboardFilterDto): Promise<TotalResponseDto> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return { total: dashboardData.totalNoticias };
  }

  @Get('noticias-positivas')
  @ApiOperation({ summary: 'Obtém total de notícias positivas no período' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Total de notícias positivas', type: TotalResponseDto })
  async getNoticiasPositivas(@Query() filter: DashboardFilterDto): Promise<TotalResponseDto> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return { total: dashboardData.totalNoticiasPositivas };
  }

  @Get('noticias-neutras')
  @ApiOperation({ summary: 'Obtém total de notícias neutras no período' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Total de notícias neutras', type: TotalResponseDto })
  async getNoticiasNeutras(@Query() filter: DashboardFilterDto): Promise<TotalResponseDto> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return { total: dashboardData.totalNoticiasNeutras };
  }

  @Get('noticias-negativas')
  @ApiOperation({ summary: 'Obtém total de notícias negativas no período' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Total de notícias negativas', type: TotalResponseDto })
  async getNoticiasNegativas(@Query() filter: DashboardFilterDto): Promise<TotalResponseDto> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return { total: dashboardData.totalNoticiasNegativas };
  }

  @Get('noticias-por-periodo')
  @ApiOperation({ summary: 'Obtém quantidade de notícias por período' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Evolução de notícias por data', type: [NoticiasPorPeriodoItem] })
  async getNoticiasPorPeriodo(@Query() filter: DashboardFilterDto): Promise<NoticiasPorPeriodoItem[]> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return dashboardData.noticiasPorPeriodo;
  }

  @Get('noticias-por-periodo-mensal')
  @ApiOperation({ summary: 'Obtém quantidade de notícias por período mensal' })
  @ApiResponse({ status: 200, description: 'Quantidade de notícias por mês', type: [NoticiasPorPeriodoMensalItem] })
  async getNoticiasPorPeriodoMensal(): Promise<NoticiasPorPeriodoMensalItem[]> {
    return this.dashboardService.getNoticiasPorPeriodoMensal();
  }

  @Get('sentimento-noticias-mensal')
  @ApiOperation({ summary: 'Obtém sentimento das notícias por período mensal' })
  @ApiResponse({ status: 200, description: 'Sentimento das notícias por mês', type: [SentimentoNoticiasMensalItem] })
  async getSentimentoNoticiasMensal(): Promise<SentimentoNoticiasMensalItem[]> {
    return this.dashboardService.getSentimentoNoticiasMensal();
  }

  @Get('pontuacao-por-periodo')
  @ApiOperation({ summary: 'Obtém pontuação total por período' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Pontuação por data', type: [PontuacaoPorPeriodoItem] })
  async getPontuacaoPorPeriodo(@Query() filter: DashboardFilterDto): Promise<PontuacaoPorPeriodoItem[]> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return dashboardData.pontuacaoPorPeriodo;
  }

  @Get('portais-relevantes-positivas')
  @ApiOperation({ summary: 'Obtém os 5 portais com maior pontuação de notícias positivas' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Portais com maior pontuação positiva', type: [PortalItem] })
  async getPortaisRelevantesPositivas(@Query() filter: DashboardFilterDto): Promise<PortalItem[]> {
    return this.dashboardService.getPortaisRelevantesPositivas(filter);
  }

  @Get('portais-relevantes-negativas')
  @ApiOperation({ summary: 'Obtém os 5 portais com maior pontuação de notícias negativas' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Portais com maior pontuação negativa', type: [PortalItem] })
  async getPortaisRelevantesNegativas(@Query() filter: DashboardFilterDto): Promise<PortalItem[]> {
    return this.dashboardService.getPortaisRelevantesNegativas(filter);
  }

  @Get('evolucao-noticias')
  @ApiOperation({ summary: 'Obtém evolução de notícias por período' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Evolução de notícias por data', type: [NoticiasPorPeriodoItem] })
  async getEvolucaoNoticias(@Query() filter: DashboardFilterDto): Promise<NoticiasPorPeriodoItem[]> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return dashboardData.evolucaoNoticiasPorPeriodo;
  }

  @Get('sentimento-noticias')
  @ApiOperation({ summary: 'Obtém sentimento das notícias por período' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Sentimento das notícias por data', type: [SentimentoNoticiasItem] })
  async getSentimentoNoticias(@Query() filter: DashboardFilterDto): Promise<SentimentoNoticiasItem[]> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return dashboardData.sentimentoNoticiasPorPeriodo;
  }

  @Get('dash-estrategica')
  @ApiOperation({ summary: 'Obtém dados de notícias estratégicas no período' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Dados de notícias estratégicas', type: DashEstrategicaResponseDto })
  async getDashEstrategica(@Query() filter: DashboardFilterDto): Promise<DashEstrategicaResponseDto> {
    return this.dashboardService.getDashEstrategica(filter);
  }
}