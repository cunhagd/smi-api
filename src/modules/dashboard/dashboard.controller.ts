import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto, DashboardResponseDto } from './dto/dashboard.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Obter dados do dashboard (últimos 30 dias)' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos os dados para o dashboard filtrados pelos últimos 30 dias',
    type: DashboardResponseDto,
  })
  async getDashboardData(@Query() filter: DashboardFilterDto): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboardData(filter, true);
  }

  @Get('noticias-total')
  @ApiOperation({ summary: 'Obter total de notícias no período' })
  @ApiResponse({ status: 200, description: 'Retorna o total de notícias', type: Number })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data de início do período (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data de fim do período (YYYY-MM-DD)' })
  async getTotalNoticias(@Query() filter: DashboardFilterDto): Promise<{ total: number }> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return { total: dashboardData.totalNoticias };
  }

  @Get('noticias-positivas')
  @ApiOperation({ summary: 'Obter total de notícias positivas no período' })
  @ApiResponse({ status: 200, description: 'Retorna o total de notícias positivas', type: Number })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data de início do período (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data de fim do período (YYYY-MM-DD)' })
  async getNoticiasPositivas(@Query() filter: DashboardFilterDto): Promise<{ total: number }> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return { total: dashboardData.totalNoticiasPositivas };
  }

  @Get('noticias-negativas')
  @ApiOperation({ summary: 'Obter total de notícias negativas no período' })
  @ApiResponse({ status: 200, description: 'Retorna o total de notícias negativas', type: Number })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data de início do período (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data de fim do período (YYYY-MM-DD)' })
  async getNoticiasNegativas(@Query() filter: DashboardFilterDto): Promise<{ total: number }> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return { total: dashboardData.totalNoticiasNegativas };
  }

  @Get('noticias-por-periodo')
  @ApiOperation({ summary: 'Obter quantidade de notícias por período' })
  @ApiResponse({ status: 200, description: 'Retorna a evolução de notícias por data' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data de início do período (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data de fim do período (YYYY-MM-DD)' })
  async getNoticiasPorPeriodo(@Query() filter: DashboardFilterDto): Promise<{ data: string; quantidade: number }[]> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return dashboardData.noticiasPorPeriodo;
  }

  @Get('pontuacao-por-periodo')
  @ApiOperation({ summary: 'Obter pontuação total por período' })
  @ApiResponse({ status: 200, description: 'Retorna a pontuação por data' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data de início do período (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data de fim do período (YYYY-MM-DD)' })
  async getPontuacaoPorPeriodo(@Query() filter: DashboardFilterDto): Promise<{ data: string; pontuacao: number }[]> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return dashboardData.pontuacaoPorPeriodo;
  }

  @Get('portais-relevantes')
  @ApiOperation({ summary: 'Obter os portais mais relevantes no período' })
  @ApiResponse({ status: 200, description: 'Retorna os portais mais relevantes' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data de início do período (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data de fim do período (YYYY-MM-DD)' })
  async getPortaisRelevantes(@Query() filter: DashboardFilterDto): Promise<{ portal: string; quantidade: number }[]> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return dashboardData.portaisRelevantes;
  }

  @Get('evolucao-noticias')
  @ApiOperation({ summary: 'Obter evolução de notícias por período' })
  @ApiResponse({ status: 200, description: 'Retorna a evolução de notícias por data' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data de início do período (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data de fim do período (YYYY-MM-DD)' })
  async getEvolucaoNoticias(@Query() filter: DashboardFilterDto): Promise<{ data: string; quantidade: number }[]> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return dashboardData.evolucaoNoticiasPorPeriodo;
  }

  @Get('sentimento-noticias')
  @ApiOperation({ summary: 'Obter sentimento das notícias por período' })
  @ApiResponse({ status: 200, description: 'Retorna o sentimento das notícias por data' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data de início do período (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data de fim do período (YYYY-MM-DD)' })
  async getSentimentoNoticias(
    @Query() filter: DashboardFilterDto
  ): Promise<{ data: string; positivas: number; negativas: number; neutras: number }[]> {
    const dashboardData = await this.dashboardService.getDashboardData(filter);
    return dashboardData.sentimentoNoticiasPorPeriodo;
  }
}