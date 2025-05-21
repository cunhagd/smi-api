import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Noticia } from '../noticias/entities/noticia.entity';
import { DashboardFilterDto, DashboardResponseDto, PortalItem, DashEstrategicaResponseDto } from './dto/dashboard.dto';
import * as moment from 'moment';

// Interfaces para tipagem
interface NoticiaDataItem {
  data: string;
  quantidade: number;
  pontuacao: number;
  positivas: number;
  negativas: number;
  neutras: number;
  avaliacoes?: Set<string>;
}

interface TemaDataItem {
  data: string;
  'total-infraestrutura': number;
  'total-social': number;
  'total-educacao': number;
  'total-saude': number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Noticia)
    private noticiaRepository: Repository<Noticia>,
  ) {}

  private applyDateFilter(
    queryBuilder: any,
    dataInicio?: string,
    dataFim?: string,
    forceLast30Days: boolean = false,
  ) {
    if (forceLast30Days) {
      const startDate = moment().subtract(30, 'days').format('DD/MM/YYYY');
      const endDate = moment().format('DD/MM/YYYY');
      console.log('Forçando filtro dos últimos 30 dias:', { startDate, endDate });
      return queryBuilder.where(
        "TO_DATE(noticia.data, 'DD/MM/YYYY') >= TO_DATE(:startDate, 'DD/MM/YYYY') AND TO_DATE(noticia.data, 'DD/MM/YYYY') <= TO_DATE(:endDate, 'DD/MM/YYYY')",
        { startDate, endDate },
      );
    }

    if (dataInicio && dataFim) {
      const startDateMoment = moment(dataInicio, 'YYYY-MM-DD', true);
      const endDateMoment = moment(dataFim, 'YYYY-MM-DD', true);

      if (!startDateMoment.isValid() || !endDateMoment.isValid()) {
        throw new BadRequestException('dataInicio e dataFim devem estar no formato YYYY-MM-DD');
      }

      if (startDateMoment.isAfter(endDateMoment)) {
        throw new BadRequestException('dataInicio deve ser anterior ou igual a dataFim');
      }

      const startDate = startDateMoment.format('DD/MM/YYYY');
      const endDate = endDateMoment.format('DD/MM/YYYY');

      console.log('Aplicando filtro de período:', { startDate, endDate });
      return queryBuilder.where(
        "TO_DATE(noticia.data, 'DD/MM/YYYY') >= TO_DATE(:startDate, 'DD/MM/YYYY') AND TO_DATE(noticia.data, 'DD/MM/YYYY') <= TO_DATE(:endDate, 'DD/MM/YYYY')",
        { startDate, endDate },
      );
    }

    if (dataInicio) {
      const startDateMoment = moment(dataInicio, 'YYYY-MM-DD', true);
      if (!startDateMoment.isValid()) {
        throw new BadRequestException('dataInicio deve estar no formato YYYY-MM-DD');
      }

      const startDate = startDateMoment.format('DD/MM/YYYY');
      const endDate = moment().format('DD/MM/YYYY');
      console.log('Aplicando filtro de período (apenas dataInicio):', { startDate, endDate });
      return queryBuilder.where(
        "TO_DATE(noticia.data, 'DD/MM/YYYY') >= TO_DATE(:startDate, 'DD/MM/YYYY') AND TO_DATE(noticia.data, 'DD/MM/YYYY') <= TO_DATE(:endDate, 'DD/MM/YYYY')",
        { startDate, endDate },
      );
    }

    if (dataFim) {
      const endDateMoment = moment(dataFim, 'YYYY-MM-DD', true);
      if (!endDateMoment.isValid()) {
        throw new BadRequestException('dataFim deve estar no formato YYYY-MM-DD');
      }

      const startDate = endDateMoment.subtract(30, 'days').format('DD/MM/YYYY');
      const endDate = endDateMoment.format('DD/MM/YYYY');
      console.log('Aplicando filtro de período (apenas dataFim):', { startDate, endDate });
      return queryBuilder.where(
        "TO_DATE(noticia.data, 'DD/MM/YYYY') >= TO_DATE(:startDate, 'DD/MM/YYYY') AND TO_DATE(noticia.data, 'DD/MM/YYYY') <= TO_DATE(:endDate, 'DD/MM/YYYY')",
        { startDate, endDate },
      );
    }

    console.log('Nenhum filtro de data aplicado');
    return queryBuilder;
  }

  async getDashboardData(
    filter: DashboardFilterDto,
    forceLast30Days: boolean = false,
  ): Promise<DashboardResponseDto> {
    const { dataInicio, dataFim } = filter;

    console.log('Iniciando consulta de dashboard com filtros:', {
      dataInicio,
      dataFim,
      forceLast30Days,
    });

    // Cria a query base
    let queryBuilder = this.noticiaRepository.createQueryBuilder('noticia');

    // Aplica o filtro de data
    queryBuilder = this.applyDateFilter(queryBuilder, dataInicio, dataFim, forceLast30Days);

    // Filtra apenas notícias úteis com avaliação válida
    queryBuilder = queryBuilder
      .andWhere('noticia.relevancia = :relevancia', { relevancia: 'Útil' })
      .andWhere('noticia.avaliacao IN (:...avaliacoes)', { avaliacoes: ['Positiva', 'Negativa', 'Neutra'] });

    // Log da query SQL gerada
    const sql = queryBuilder.getSql();
    console.log('Query SQL gerada:', sql);

    const noticias = await queryBuilder.getMany();
    console.log(`Total de notícias úteis com avaliação válida encontradas: ${noticias.length}`);
    if (noticias.length > 0) {
      console.log('Primeiros registros:', noticias.slice(0, 2));
      // Log dos valores únicos de avaliacao e relevancia
      const avaliacoes = [...new Set(noticias.map((n) => n.avaliacao))];
      const relevancias = [...new Set(noticias.map((n) => n.relevancia))];
      console.log('Valores únicos de avaliacao:', avaliacoes);
      console.log('Valores únicos de relevancia:', relevancias);
    }

    // Prepara os dados do dashboard
    const totalNoticias = noticias.length;

    // Conta notícias por sentimento (avaliacao)
    const noticiasPositivas = noticias.filter((n) =>
      n.avaliacao && n.avaliacao.trim() === 'Positiva' ? true : false,
    );
    const noticiasNegativas = noticias.filter((n) =>
      n.avaliacao && n.avaliacao.trim() === 'Negativa' ? true : false,
    );
    const noticiasNeutras = noticias.filter((n) =>
      n.avaliacao && n.avaliacao.trim() === 'Neutra' ? true : false,
    );

    console.log('Contagem por sentimento:', {
      positivas: noticiasPositivas.length,
      negativas: noticiasNegativas.length,
      neutras: noticiasNeutras.length,
      null: noticias.filter((n) => n.avaliacao === null).length,
      empty: noticias.filter((n) => n.avaliacao === '').length,
    });

    const totalNoticiasPositivas = noticiasPositivas.length;
    const totalNoticiasNegativas = noticiasNegativas.length;
    const totalNoticiasNeutras = noticiasNeutras.length;

    // Agrupa notícias por data
    const noticiasPorData: Record<string, NoticiaDataItem> = noticias.reduce(
      (acc, noticia) => {
        if (!noticia.data) return acc;

        // Converte a data do banco (DD/MM/YYYY) para um formato padronizado (YYYY-MM-DD)
        const dataObj = moment(noticia.data, 'DD/MM/YYYY', true);
        const data = dataObj.isValid() ? dataObj.format('YYYY-MM-DD') : noticia.data;

        if (!acc[data]) {
          acc[data] = { data, quantidade: 0, pontuacao: 0, positivas: 0, negativas: 0, neutras: 0, avaliacoes: new Set() };
        }
        acc[data].quantidade += 1;
        acc[data].pontuacao += noticia.pontos_new || 0;

        // Conta sentimentos com normalização de avaliacao
        const avaliacao = noticia.avaliacao ? noticia.avaliacao.trim() : null;
        if (avaliacao === 'Positiva') acc[data].positivas += 1;
        else if (avaliacao === 'Negativa') acc[data].negativas += 1;
        else if (avaliacao === 'Neutra') acc[data].neutras += 1;

        // Log para depuração por data
        if (avaliacao) acc[data].avaliacoes!.add(avaliacao);

        return acc;
      },
      {} as Record<string, NoticiaDataItem>,
    );

    // Log dos valores de avaliacao por data
    Object.keys(noticiasPorData).forEach((data) => {
      console.log(`Avaliações para ${data}:`, noticiasPorData[data].avaliacoes ? [...noticiasPorData[data].avaliacoes] : []);
    });

    console.log(`Total de datas com notícias: ${Object.keys(noticiasPorData).length}`);
    console.log('Dados de noticiasPorData:', JSON.stringify(noticiasPorData, null, 2));

    // Transforma os dados em arrays para o formato da resposta
    const noticiasPorPeriodo = Object.values(noticiasPorData)
      .sort((a, b) => moment(a.data).valueOf() - moment(b.data).valueOf())
      .map((item: NoticiaDataItem) => ({
        data: item.data,
        quantidade: item.quantidade,
      }));

    const pontuacaoPorPeriodo = Object.values(noticiasPorData)
      .sort((a, b) => moment(a.data).valueOf() - moment(b.data).valueOf())
      .map((item: NoticiaDataItem) => ({
        data: item.data,
        pontuacao: item.pontuacao,
      }));

    const sentimentoNoticiasPorPeriodo = Object.values(noticiasPorData)
      .sort((a, b) => moment(a.data).valueOf() - moment(b.data).valueOf())
      .map((item: NoticiaDataItem) => ({
        data: item.data,
        positivas: item.positivas,
        negativas: item.negativas,
        neutras: item.neutras,
      }));

    return {
      totalNoticias,
      totalNoticiasPositivas,
      totalNoticiasNegativas,
      totalNoticiasNeutras,
      noticiasPorPeriodo,
      pontuacaoPorPeriodo,
      evolucaoNoticiasPorPeriodo: noticiasPorPeriodo,
      sentimentoNoticiasPorPeriodo,
    } as DashboardResponseDto;
  }

  async getPortaisRelevantesPositivas(filter: DashboardFilterDto): Promise<PortalItem[]> {
    const { dataInicio, dataFim } = filter;

    console.log('Iniciando consulta de portais relevantes positivos com filtros:', {
      dataInicio,
      dataFim,
    });

    // Cria a query base para notícias positivas
    let queryBuilder = this.noticiaRepository.createQueryBuilder('noticia');

    // Aplica o filtro de data
    queryBuilder = this.applyDateFilter(queryBuilder, dataInicio, dataFim);

    // Filtra apenas notícias positivas
    queryBuilder = queryBuilder.andWhere('noticia.avaliacao = :avaliacao', { avaliacao: 'Positiva' });

    // Log da query SQL gerada
    const sql = queryBuilder.getSql();
    console.log('Query SQL gerada para portais positivos:', sql);

    const noticias = await queryBuilder.getMany();
    console.log(`Total de notícias positivas encontradas: ${noticias.length}`);

    // Agrupa notícias por portal e calcula métricas
    const portalMap: Record<string, Partial<PortalItem>> = noticias.reduce(
      (acc, noticia) => {
        if (!noticia.portal) return acc;

        const portalNome = noticia.portal.trim();
        if (!portalNome) return acc;

        if (!acc[portalNome]) {
          acc[portalNome] = {
            portal: portalNome,
            pontuacao: 0,
            quantidade: 0,
            positivo: 0,
            negativo: 0,
            neutro: 0,
          };
        }
        acc[portalNome].pontuacao! += noticia.pontos_new || 0;
        acc[portalNome].quantidade! += 1;
        acc[portalNome].positivo! += 1; // Como a query filtra apenas Positiva, todas são positivas
        return acc;
      },
      {} as Record<string, Partial<PortalItem>>,
    );

    // Query auxiliar para contar notícias negativas e neutras para os portais encontrados
    const portais = Object.keys(portalMap);
    if (portais.length > 0) {
      const sentimentQuery = this.noticiaRepository
        .createQueryBuilder('noticia')
        .select('noticia.portal', 'portal')
        .addSelect("SUM(CASE WHEN noticia.avaliacao = 'Negativa' THEN 1 ELSE 0 END)", 'negativo')
        .addSelect("SUM(CASE WHEN noticia.avaliacao = 'Neutra' THEN 1 ELSE 0 END)", 'neutro')
        .addSelect('COUNT(*)', 'quantidade_total')
        .where('noticia.portal IN (:...portais)', { portais })
        .andWhere('noticia.avaliacao IN (:...avaliacoes)', { avaliacoes: ['Negativa', 'Neutra'] });

      // Aplica o mesmo filtro de data
      this.applyDateFilter(sentimentQuery, dataInicio, dataFim);

      sentimentQuery.groupBy('noticia.portal');

      const sentimentResults = await sentimentQuery.getRawMany();

      sentimentResults.forEach((result) => {
        const portalNome = result.portal;
        if (portalMap[portalNome]) {
          portalMap[portalNome].negativo = parseInt(result.negativo, 10) || 0;
          portalMap[portalNome].neutro = parseInt(result.neutro, 10) || 0;
          portalMap[portalNome].quantidade! += parseInt(result.quantidade_total, 10) || 0;
        }
      });
    }

    // Formata o resultado final com percentuais
    const portaisRelevantesPositivas = Object.values(portalMap)
      .map((item) => {
        const quantidade = item.quantidade || 0;
        const positivo = item.positivo || 0;
        const negativo = item.negativo || 0;
        const neutro = item.neutro || 0;
        const percentualPositivo = quantidade > 0 ? ((positivo / quantidade) * 100).toFixed(0) + '%' : '0%';
        const percentualNegativo = quantidade > 0 ? ((negativo / quantidade) * 100).toFixed(0) + '%' : '0%';
        const percentualNeutro = quantidade > 0 ? ((neutro / quantidade) * 100).toFixed(0) + '%' : '0%';

        return {
          portal: item.portal!,
          pontuacao: item.pontuacao || 0,
          quantidade,
          positivo,
          negativo,
          neutro,
          '%positivo': percentualPositivo,
          '%negativo': percentualNegativo,
          '%neutro': percentualNeutro,
        } as PortalItem;
      })
      .sort((a, b) => b.pontuacao - a.pontuacao)
      .slice(0, 5);

    console.log(`Total de portais relevantes positivos: ${portaisRelevantesPositivas.length}`);
    return portaisRelevantesPositivas;
  }

  async getPortaisRelevantesNegativas(filter: DashboardFilterDto): Promise<PortalItem[]> {
    const { dataInicio, dataFim } = filter;

    console.log('Iniciando consulta de portais relevantes negativos com filtros:', {
      dataInicio,
      dataFim,
    });

    // Cria a query base para notícias negativas
    let queryBuilder = this.noticiaRepository.createQueryBuilder('noticia');

    // Aplica o filtro de data
    queryBuilder = this.applyDateFilter(queryBuilder, dataInicio, dataFim);

    // Filtra apenas notícias negativas
    queryBuilder = queryBuilder.andWhere('noticia.avaliacao = :avaliacao', { avaliacao: 'Negativa' });

    // Log da query SQL gerada
    const sql = queryBuilder.getSql();
    console.log('Query SQL gerada para portais negativos:', sql);

    const noticias = await queryBuilder.getMany();
    console.log(`Total de notícias negativas encontradas: ${noticias.length}`);

    // Agrupa notícias por portal e calcula métricas
    const portalMap: Record<string, Partial<PortalItem>> = noticias.reduce(
      (acc, noticia) => {
        if (!noticia.portal) return acc;

        const portalNome = noticia.portal.trim();
        if (!portalNome) return acc;

        if (!acc[portalNome]) {
          acc[portalNome] = {
            portal: portalNome,
            pontuacao: 0,
            quantidade: 0,
            positivo: 0,
            negativo: 0,
            neutro: 0,
          };
        }
        acc[portalNome].pontuacao! += noticia.pontos_new || 0;
        acc[portalNome].quantidade! += 1;
        acc[portalNome].negativo! += 1; // Como a query filtra apenas Negativa, todas são negativas
        return acc;
      },
      {} as Record<string, Partial<PortalItem>>,
    );

    // Query auxiliar para contar notícias positivas e neutras para os portais encontrados
    const portais = Object.keys(portalMap);
    if (portais.length > 0) {
      const sentimentQuery = this.noticiaRepository
        .createQueryBuilder('noticia')
        .select('noticia.portal', 'portal')
        .addSelect("SUM(CASE WHEN noticia.avaliacao = 'Positiva' THEN 1 ELSE 0 END)", 'positivo')
        .addSelect("SUM(CASE WHEN noticia.avaliacao = 'Neutra' THEN 1 ELSE 0 END)", 'neutro')
        .addSelect('COUNT(*)', 'quantidade_total')
        .where('noticia.portal IN (:...portais)', { portais })
        .andWhere('noticia.avaliacao IN (:...avaliacoes)', { avaliacoes: ['Positiva', 'Neutra'] });

      // Aplica o mesmo filtro de data
      this.applyDateFilter(sentimentQuery, dataInicio, dataFim);

      sentimentQuery.groupBy('noticia.portal');

      const sentimentResults = await sentimentQuery.getRawMany();

      sentimentResults.forEach((result) => {
        const portalNome = result.portal;
        if (portalMap[portalNome]) {
          portalMap[portalNome].positivo = parseInt(result.positivo, 10) || 0;
          portalMap[portalNome].neutro = parseInt(result.neutro, 10) || 0;
          portalMap[portalNome].quantidade! += parseInt(result.quantidade_total, 10) || 0;
        }
      });
    }

    // Formata o resultado final com percentuais
    const portaisRelevantesNegativas = Object.values(portalMap)
      .map((item) => {
        const quantidade = item.quantidade || 0;
        const positivo = item.positivo || 0;
        const negativo = item.negativo || 0;
        const neutro = item.neutro || 0;
        const percentualPositivo = quantidade > 0 ? ((positivo / quantidade) * 100).toFixed(0) + '%' : '0%';
        const percentualNegativo = quantidade > 0 ? ((negativo / quantidade) * 100).toFixed(0) + '%' : '0%';
        const percentualNeutro = quantidade > 0 ? ((neutro / quantidade) * 100).toFixed(0) + '%' : '0%';

        return {
          portal: item.portal!,
          pontuacao: item.pontuacao || 0,
          quantidade,
          positivo,
          negativo,
          neutro,
          '%positivo': percentualPositivo,
          '%negativo': percentualNegativo,
          '%neutro': percentualNeutro,
        } as PortalItem;
      })
      .sort((a, b) => b.pontuacao - a.pontuacao)
      .slice(0, 5);

    console.log(`Total de portais relevantes negativos: ${portaisRelevantesNegativas.length}`);
    return portaisRelevantesNegativas;
  }

  async getDashEstrategica(filter: DashboardFilterDto): Promise<DashEstrategicaResponseDto> {
    const { dataInicio, dataFim } = filter;

    console.log('Iniciando consulta de dashboard estratégico com filtros:', {
      dataInicio,
      dataFim,
    });

    // Cria a query base
    let queryBuilder = this.noticiaRepository.createQueryBuilder('noticia');

    // Aplica o filtro de data
    queryBuilder = this.applyDateFilter(queryBuilder, dataInicio, dataFim);

    // Filtra apenas notícias estratégicas com categoria preenchida
    queryBuilder = queryBuilder
      .andWhere('noticia.estrategica = :estrategica', { estrategica: true })
      .andWhere('noticia.categoria IS NOT NULL')
      .andWhere("TRIM(noticia.categoria) != ''");

    // Log da query SQL gerada
    const sql = queryBuilder.getSql();
    console.log('Query SQL gerada para dashboard estratégico:', sql);

    const noticias = await queryBuilder.getMany();
    console.log(`Total de notícias estratégicas com categoria preenchida encontradas: ${noticias.length}`);

    // Calcula o total de notícias estratégicas
    const totalNoticiasEstrategicas = noticias.length;

    // Calcula a soma de pontos_new
    const totalPontuacaoEstrategicas = noticias.reduce(
      (sum, noticia) => sum + (noticia.pontos_new || 0),
      0,
    );

    // Agrupa notícias por data e categoria
    const categoriasValidas = ['Infraestrutura', 'Social', 'Educação', 'Saúde'];
    const noticiasPorData: Record<string, TemaDataItem> = noticias.reduce(
      (acc, noticia) => {
        if (!noticia.data) return acc;

        // Converte a data do banco (DD/MM/YYYY) para YYYY-MM-DD
        const dataObj = moment(noticia.data, 'DD/MM/YYYY', true);
        const data = dataObj.isValid() ? dataObj.format('YYYY-MM-DD') : noticia.data;

        if (!acc[data]) {
          acc[data] = {
            data,
            'total-infraestrutura': 0,
            'total-social': 0,
            'total-educacao': 0,
            'total-saude': 0,
          };
        }

        const categoria = noticia.categoria ? noticia.categoria.trim() : null;
        if (categoria && categoriasValidas.includes(categoria)) {
          switch (categoria) {
            case 'Infraestrutura':
              acc[data]['total-infraestrutura'] += 1;
              break;
            case 'Social':
              acc[data]['total-social'] += 1;
              break;
            case 'Educação':
              acc[data]['total-educacao'] += 1;
              break;
            case 'Saúde':
              acc[data]['total-saude'] += 1;
              break;
          }
        }

        return acc;
      },
      {} as Record<string, TemaDataItem>,
    );

    // Converte para array e ordena por data
    const noticiasTemaPorData = Object.values(noticiasPorData).sort(
      (a, b) => moment(a.data).valueOf() - moment(b.data).valueOf(),
    );

    // Prepara o objeto de resposta
    const response: DashEstrategicaResponseDto = {
      'dash-estrategica': [
        {
          'total-noticias-estratégicas': totalNoticiasEstrategicas,
          'total-pontuacao-estratégicas': totalPontuacaoEstrategicas,
          'total-noticias-tema': noticiasTemaPorData,
        },
      ],
    };

    console.log('Resposta do dashboard estratégico:', JSON.stringify(response, null, 2));
    return response;
  }
}