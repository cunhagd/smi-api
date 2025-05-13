import { Injectable, Logger, BadRequestException, NotFoundException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { Noticia, Avaliacao } from './entities/noticia.entity';
import { Lixeira } from './entities/lixeira.entity';
import { SemanaEstrategica } from '../semana-estrategica/entities/semana-estrategica.entity';
import { FilterNoticiasDto } from './dto/filter-noticias.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { format, parse, isValid } from 'date-fns';

@Injectable()
export class NoticiasService {
  private readonly logger = new Logger(NoticiasService.name);

  constructor(
    @InjectRepository(Noticia)
    private readonly noticiaRepository: Repository<Noticia>,
    @InjectRepository(Lixeira)
    private readonly lixeiraRepository: Repository<Lixeira>,
    @InjectRepository(SemanaEstrategica)
    private readonly semanaEstrategicaRepository: Repository<SemanaEstrategica>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(filterDto: FilterNoticiasDto) {
    const {
      from,
      to,
      date,
      before,
      after,
      relevancia,
      estrategica,
      all,
      tema,
      titulo,
      portal,
      avaliacao,
    } = filterDto;
    this.logger.debug(`Valor de estrategica após transformação: ${estrategica}, tipo: ${typeof estrategica}`);
    this.logger.debug(`Valor de all após transformação: ${all}, tipo: ${typeof all}`);

    const fromFormatted = from ? this.convertToDDMMYYYY(from) : undefined;
    const toFormatted = to ? this.convertToDDMMYYYY(to) : undefined;
    const dateFormatted = date ? this.convertToDDMMYYYY(date) : undefined;
    const beforeFormatted = before ? this.convertToDDMMYYYY(before) : undefined;
    const afterFormatted = after ? this.convertToDDMMYYYY(after) : undefined;

    this.logger.debug(
      `Filtros: from=${fromFormatted}, to=${toFormatted}, date=${dateFormatted}, before=${beforeFormatted}, after=${afterFormatted}, relevancia=${relevancia}, estrategica=${estrategica}, all=${all}, tema=${tema}, titulo=${titulo}, portal=${portal}, avaliacao=${avaliacao}`,
    );

    // Validações
    if (fromFormatted && !this.isValidDDMMYYYY(fromFormatted)) {
      throw new BadRequestException('Data "from" inválida');
    }
    if (toFormatted && !this.isValidDDMMYYYY(toFormatted)) {
      throw new BadRequestException('Data "to" inválida');
    }
    if (dateFormatted && !this.isValidDDMMYYYY(dateFormatted)) {
      throw new BadRequestException('Data "date" inválida');
    }
    if (beforeFormatted && !this.isValidDDMMYYYY(beforeFormatted)) {
      throw new BadRequestException('Data "before" inválida');
    }
    if (afterFormatted && !this.isValidDDMMYYYY(afterFormatted)) {
      throw new BadRequestException('Data "after" inválida');
    }

    const validAvaliacoes = [
      Avaliacao.POSITIVA,
      Avaliacao.NEGATIVA,
      Avaliacao.NEUTRA,
      null,
    ];
    if (avaliacao !== undefined && !validAvaliacoes.includes(avaliacao)) {
      throw new BadRequestException(
        'Avaliação deve ser Positiva, Negativa, Neutra ou nula',
      );
    }

    // Se all=true e estrategica=true, buscar todas as notícias estratégicas sem paginação
    if (all === true && estrategica === true) {
      const query = this.noticiaRepository
        .createQueryBuilder('noticia')
        .where('noticia.estrategica = :estrategica', { estrategica: true })
        .andWhere(
          fromFormatted
            ? "TO_DATE(noticia.data, 'DD/MM/YYYY') >= TO_DATE(:from, 'DD/MM/YYYY')"
            : 'TRUE',
          { from: fromFormatted },
        )
        .andWhere(
          toFormatted
            ? "TO_DATE(noticia.data, 'DD/MM/YYYY') <= TO_DATE(:to, 'DD/MM/YYYY')"
            : 'TRUE',
          { to: toFormatted },
        )
        .andWhere(
          relevancia
            ? relevancia === null
              ? 'noticia.relevancia IS NULL'
              : 'noticia.relevancia = :relevancia'
            : 'TRUE',
          { relevancia },
        )
        .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
        .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
          titulo: `%${titulo}%`,
        })
        .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
        .andWhere(
          avaliacao !== undefined
            ? avaliacao === null
              ? 'noticia.avaliacao IS NULL'
              : 'noticia.avaliacao = :avaliacao'
            : 'TRUE',
          { avaliacao },
        )
        .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC')
        .addOrderBy('noticia.id', 'DESC');

      this.logger.debug(`Executando query para all=true e estrategica=true: ${query.getSql()}`);
      const noticias = await query.getMany();
      this.logger.debug(`Notícias estratégicas encontradas: ${noticias.length}`);

      const total = noticias.length;

      const noticiasFormatted = noticias.map((noticia) => ({
        ...noticia,
        data: noticia.data,
        avaliacao: noticia.avaliacao === '' ? null : noticia.avaliacao,
      }));

      return {
        data: noticiasFormatted,
        meta: {
          total,
          date: null,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }

    // Se all=true e relevancia='Lixo', buscar todas as notícias marcadas como "Lixo" sem paginação
    if (all === true && relevancia === 'Lixo') {
      const query = this.noticiaRepository
        .createQueryBuilder('noticia')
        .where('noticia.relevancia = :relevancia', { relevancia: 'Lixo' })
        .andWhere(
          fromFormatted
            ? "TO_DATE(noticia.data, 'DD/MM/YYYY') >= TO_DATE(:from, 'DD/MM/YYYY')"
            : 'TRUE',
          { from: fromFormatted },
        )
        .andWhere(
          toFormatted
            ? "TO_DATE(noticia.data, 'DD/MM/YYYY') <= TO_DATE(:to, 'DD/MM/YYYY')"
            : 'TRUE',
          { to: toFormatted },
        )
        .andWhere(
          estrategica !== undefined
            ? 'noticia.estrategica = :estrategica'
            : 'TRUE',
          { estrategica },
        )
        .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
        .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
          titulo: `%${titulo}%`,
        })
        .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
        .andWhere(
          avaliacao !== undefined
            ? avaliacao === null
              ? 'noticia.avaliacao IS NULL'
              : 'noticia.avaliacao = :avaliacao'
            : 'TRUE',
          { avaliacao },
        )
        .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC')
        .addOrderBy('noticia.id', 'DESC');

      this.logger.debug(`Executando query para all=true e relevancia='Lixo': ${query.getSql()}`);
      const noticias = await query.getMany();
      this.logger.debug(`Notícias na lixeira encontradas: ${noticias.length}`);

      const total = noticias.length;

      const noticiasFormatted = noticias.map((noticia) => ({
        ...noticia,
        data: noticia.data,
        avaliacao: noticia.avaliacao === '' ? null : noticia.avaliacao,
      }));

      return {
        data: noticiasFormatted,
        meta: {
          total,
          date: null,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }

    // Se all=true e relevancia='Suporte', buscar todas as notícias marcadas como "Suporte" sem paginação
    if (all === true && relevancia === 'Suporte') {
      const query = this.noticiaRepository
        .createQueryBuilder('noticia')
        .where('noticia.relevancia = :relevancia', { relevancia: 'Suporte' })
        .andWhere(
          fromFormatted
            ? "TO_DATE(noticia.data, 'DD/MM/YYYY') >= TO_DATE(:from, 'DD/MM/YYYY')"
            : 'TRUE',
          { from: fromFormatted },
        )
        .andWhere(
          toFormatted
            ? "TO_DATE(noticia.data, 'DD/MM/YYYY') <= TO_DATE(:to, 'DD/MM/YYYY')"
            : 'TRUE',
          { to: toFormatted },
        )
        .andWhere(
          estrategica !== undefined
            ? 'noticia.estrategica = :estrategica'
            : 'TRUE',
          { estrategica },
        )
        .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
        .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
          titulo: `%${titulo}%`,
        })
        .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
        .andWhere(
          avaliacao !== undefined
            ? avaliacao === null
              ? 'noticia.avaliacao IS NULL'
              : 'noticia.avaliacao = :avaliacao'
            : 'TRUE',
          { avaliacao },
        )
        .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC')
        .addOrderBy('noticia.id', 'DESC');

      this.logger.debug(`Executando query para all=true e relevancia='Suporte': ${query.getSql()}`);
      const noticias = await query.getMany();
      this.logger.debug(`Notícias de suporte encontradas: ${noticias.length}`);

      const total = noticias.length;

      const noticiasFormatted = noticias.map((noticia) => ({
        ...noticia,
        data: noticia.data,
        avaliacao: noticia.avaliacao === '' ? null : noticia.avaliacao,
      }));

      return {
        data: noticiasFormatted,
        meta: {
          total,
          date: null,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }

    // Se all=true e relevancia='Útil', buscar todas as notícias marcadas como "Útil" sem paginação
    if (all === true && relevancia === 'Útil') {
      const query = this.noticiaRepository
        .createQueryBuilder('noticia')
        .where('noticia.relevancia = :relevancia', { relevancia: 'Útil' })
        .andWhere(
          fromFormatted
            ? "TO_DATE(noticia.data, 'DD/MM/YYYY') >= TO_DATE(:from, 'DD/MM/YYYY')"
            : 'TRUE',
          { from: fromFormatted },
        )
        .andWhere(
          toFormatted
            ? "TO_DATE(noticia.data, 'DD/MM/YYYY') <= TO_DATE(:to, 'DD/MM/YYYY')"
            : 'TRUE',
          { to: toFormatted },
        )
        .andWhere(
          estrategica !== undefined
            ? 'noticia.estrategica = :estrategica'
            : 'TRUE',
          { estrategica },
        )
        .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
        .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
          titulo: `%${titulo}%`,
        })
        .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
        .andWhere(
          avaliacao !== undefined
            ? avaliacao === null
              ? 'noticia.avaliacao IS NULL'
              : 'noticia.avaliacao = :avaliacao'
            : 'TRUE',
          { avaliacao },
        )
        .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC')
        .addOrderBy('noticia.id', 'DESC');

      this.logger.debug(`Executando query para all=true e relevancia='Útil': ${query.getSql()}`);
      const noticias = await query.getMany();
      this.logger.debug(`Notícias úteis encontradas: ${noticias.length}`);

      const total = noticias.length;

      const noticiasFormatted = noticias.map((noticia) => ({
        ...noticia,
        data: noticia.data,
        avaliacao: noticia.avaliacao === '' ? null : noticia.avaliacao,
      }));

      return {
        data: noticiasFormatted,
        meta: {
          total,
          date: null,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }

    // Lógica para navegação por data
    let currentDate = dateFormatted;
    let allDates: { noticia_data: string }[] = [];

    if (!currentDate) {
      // Obtém todas as datas distintas no intervalo com filtros
      const datesQuery = this.noticiaRepository
        .createQueryBuilder('noticia')
        .select('noticia.data', 'noticia_data')
        .where('noticia.data IS NOT NULL')
        .andWhere(
          fromFormatted
            ? "TO_DATE(noticia.data, 'DD/MM/YYYY') >= TO_DATE(:from, 'DD/MM/YYYY')"
            : 'TRUE',
          { from: fromFormatted },
        )
        .andWhere(
          toFormatted
            ? "TO_DATE(noticia.data, 'DD/MM/YYYY') <= TO_DATE(:to, 'DD/MM/YYYY')"
            : 'TRUE',
          { to: toFormatted },
        )
        .andWhere(
          relevancia
            ? relevancia === null
              ? 'noticia.relevancia IS NULL'
              : 'noticia.relevancia = :relevancia'
            : 'TRUE',
          { relevancia },
        )
        .andWhere(
          estrategica !== undefined
            ? 'noticia.estrategica = :estrategica'
            : 'TRUE',
          { estrategica },
        )
        .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
        .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
          titulo: `%${titulo}%`,
        })
        .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
        .andWhere(
          avaliacao !== undefined
            ? avaliacao === null
              ? 'noticia.avaliacao IS NULL'
              : 'noticia.avaliacao = :avaliacao'
            : 'TRUE',
          { avaliacao },
        )
        .groupBy('noticia.data')
        .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC');

      allDates = await datesQuery.getRawMany();
      this.logger.debug(`Datas encontradas: ${JSON.stringify(allDates)}`);

      if (allDates.length === 0) {
        return {
          data: [],
          meta: {
            total: 0,
            date: null,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }

      if (beforeFormatted) {
        const previousDate = allDates.find(
          (d) =>
            parse(d.noticia_data, 'dd/MM/yyyy', new Date()) <
            parse(beforeFormatted, 'dd/MM/yyyy', new Date()),
        );
        currentDate = previousDate?.noticia_data || allDates[allDates.length - 1].noticia_data;
      } else if (afterFormatted) {
        const nextDate = allDates.find(
          (d) =>
            parse(d.noticia_data, 'dd/MM/yyyy', new Date()) >
            parse(afterFormatted, 'dd/MM/yyyy', new Date()),
        );
        currentDate = nextDate?.noticia_data || allDates[0].noticia_data;
      } else {
        currentDate = allDates[0].noticia_data;
      }

      this.logger.debug(`Data selecionada: ${currentDate}`);
    }

    // Query para todas as notícias da data selecionada
    const query = this.noticiaRepository
      .createQueryBuilder('noticia')
      .where('noticia.data = :currentDate', { currentDate })
      .andWhere(
        relevancia
          ? relevancia === null
            ? 'noticia.relevancia IS NULL'
            : 'noticia.relevancia = :relevancia'
          : 'TRUE',
        { relevancia },
      )
      .andWhere(
        estrategica !== undefined
          ? 'noticia.estrategica = :estrategica'
          : 'TRUE',
        { estrategica },
      )
      .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
      .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
        titulo: `%${titulo}%`,
      })
      .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
      .andWhere(
        avaliacao !== undefined
          ? avaliacao === null
            ? 'noticia.avaliacao IS NULL'
            : 'noticia.avaliacao = :avaliacao'
          : 'TRUE',
        { avaliacao },
      )
      .orderBy('noticia.id', 'DESC');

    this.logger.debug(`Executando query: ${query.getSql()}`);
    const noticias = await query.getMany();
    this.logger.debug(`Notícias encontradas: ${noticias.length}`);

    // Query para contar o total de notícias no intervalo
    const totalQuery = this.noticiaRepository
      .createQueryBuilder('noticia')
      .where(
        fromFormatted
          ? "TO_DATE(noticia.data, 'DD/MM/YYYY') >= TO_DATE(:from, 'DD/MM/YYYY')"
          : 'TRUE',
        { from: fromFormatted },
      )
      .andWhere(
        toFormatted
          ? "TO_DATE(noticia.data, 'DD/MM/YYYY') <= TO_DATE(:to, 'DD/MM/YYYY')"
          : 'TRUE',
        { to: toFormatted },
      )
      .andWhere(
        relevancia
          ? relevancia === null
            ? 'noticia.relevancia IS NULL'
            : 'noticia.relevancia = :relevancia'
          : 'TRUE',
        { relevancia },
      )
      .andWhere(
        estrategica !== undefined
          ? 'noticia.estrategica = :estrategica'
          : 'TRUE',
        { estrategica },
      )
      .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
      .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
        titulo: `%${titulo}%`,
      })
      .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
      .andWhere(
        avaliacao !== undefined
          ? avaliacao === null
            ? 'noticia.avaliacao IS NULL'
            : 'noticia.avaliacao = :avaliacao'
          : 'TRUE',
        { avaliacao },
      );

    const total = dateFormatted ? noticias.length : await totalQuery.getCount();
    this.logger.debug(`Total de notícias: ${total}`);

    // Determina hasNext e hasPrevious
    const currentDateIndex = allDates.findIndex((d) => d.noticia_data === currentDate);
    const hasNext = currentDateIndex > 0;
    const hasPrevious = currentDateIndex < allDates.length - 1;

    const noticiasFormatted = noticias.map((noticia) => ({
      ...noticia,
      data: noticia.data,
      avaliacao: noticia.avaliacao === '' ? null : noticia.avaliacao,
    }));

    return {
      data: noticiasFormatted,
      meta: {
        total,
        date: currentDate,
        hasNext: dateFormatted ? false : hasNext,
        hasPrevious: dateFormatted ? false : hasPrevious,
      },
    };
  }

  async moveToTrash() {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    this.logger.debug('Buscando notícias marcadas como Lixo');

    // Buscar todas as notícias com relevancia='Lixo'
    const noticiasLixo = await queryRunner.manager
      .createQueryBuilder(Noticia, 'noticia')
      .where('noticia.relevancia = :relevancia', { relevancia: 'Lixo' })
      .getMany();

    this.logger.debug(`Notícias marcadas como Lixo encontradas: ${noticiasLixo.length}`);

    if (noticiasLixo.length === 0) {
      return { message: 'Nenhuma notícia marcada como Lixo encontrada', count: 0 };
    }

    // Converter notícias para entidades Lixeira
    const lixeiraEntities = noticiasLixo.map((noticia) => {
      const lixeira = new Lixeira();
      lixeira.id = noticia.id;
      lixeira.relevancia = noticia.relevancia;
      lixeira.data = noticia.data;
      lixeira.portal = noticia.portal;
      lixeira.titulo = noticia.titulo;
      lixeira.tema = noticia.tema;
      lixeira.avaliacao = noticia.avaliacao;
      lixeira.pontos = noticia.pontos;
      lixeira.estrategica = noticia.estrategica;
      lixeira.link = noticia.link;
      lixeira.autor = noticia.autor;
      lixeira.pontos_new = noticia.pontos_new;
      lixeira.categoria = noticia.categoria;
      lixeira.subcategoria = noticia.subcategoria;
      lixeira.ciclo = noticia.ciclo;
      return lixeira;
    });

    // Inserir na tabela lixeira
    await queryRunner.manager.save(Lixeira, lixeiraEntities);
    this.logger.debug(`Notícias inseridas na tabela lixeira: ${lixeiraEntities.length}`);

    // Remover da tabela noticias
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Noticia)
      .where('relevancia = :relevancia', { relevancia: 'Lixo' })
      .execute();

    this.logger.debug(`Notícias removidas da tabela noticias: ${noticiasLixo.length}`);

    await queryRunner.commitTransaction();

    return {
      message: 'Notícias marcadas como Lixo movidas com sucesso para a lixeira',
      count: noticiasLixo.length,
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    this.logger.error(`Erro ao mover notícias para a lixeira: ${error.message}`, error.stack);
    throw new HttpException('Erro ao mover notícias para a lixeira', 500);
  } finally {
    await queryRunner.release();
  }
}

  async getStrategicDates(): Promise<string[]> {
    this.logger.debug('Buscando datas com notícias estratégicas');

    const datesQuery = this.noticiaRepository
      .createQueryBuilder('noticia')
      .select('noticia.data', 'noticia_data')
      .where('noticia.estrategica = :estrategica', { estrategica: true })
      .andWhere('noticia.data IS NOT NULL')
      .groupBy('noticia.data')
      .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC');

    const result = await datesQuery.getRawMany();
    this.logger.debug(`Datas estratégicas encontradas: ${JSON.stringify(result)}`);

    return result.map((row) => row.noticia_data);
  }

  async getTrashDates(): Promise<string[]> {
    this.logger.debug('Buscando datas com notícias marcadas como Lixo');
    try {
      const datesQuery = this.noticiaRepository
        .createQueryBuilder('noticia')
        .select('noticia.data', 'noticia_data')
        .where('noticia.relevancia = :relevancia', { relevancia: 'Lixo' })
        .andWhere('noticia.data IS NOT NULL')
        .groupBy('noticia.data')
        .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC');

      const result = await datesQuery.getRawMany();
      this.logger.debug(`Datas com notícias na lixeira encontradas: ${JSON.stringify(result)}`);
      return result.map((row) => row.noticia_data);
    } catch (error) {
      this.logger.error(`Erro ao buscar datas de notícias na lixeira: ${error.message}`, error.stack);
      throw new HttpException(`Erro ao buscar datas de notícias na lixeira: ${error.message}`, 500);
    }
  }

  async getSuportDates(): Promise<string[]> {
    this.logger.debug('Buscando datas com notícias marcadas como Suporte');
    try {
      const datesQuery = this.noticiaRepository
        .createQueryBuilder('noticia')
        .select('noticia.data', 'noticia_data')
        .where('noticia.relevancia = :relevancia', { relevancia: 'Suporte' })
        .andWhere('noticia.data IS NOT NULL')
        .groupBy('noticia.data')
        .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC');

      const result = await datesQuery.getRawMany();
      this.logger.debug(`Datas com notícias de suporte encontradas: ${JSON.stringify(result)}`);
      return result.map((row) => row.noticia_data);
    } catch (error) {
      this.logger.error(`Erro ao buscar datas de notícias de suporte: ${error.message}`, error.stack);
      throw new HttpException(`Erro ao buscar datas de notícias de suporte: ${error.message}`, 500);
    }
  }

  async getUtilDates(): Promise<string[]> {
    this.logger.debug('Buscando datas com notícias marcadas como Útil');
    try {
      const datesQuery = this.noticiaRepository
        .createQueryBuilder('noticia')
        .select('noticia.data', 'noticia_data')
        .where('noticia.relevancia = :relevancia', { relevancia: 'Útil' })
        .andWhere('noticia.data IS NOT NULL')
        .groupBy('noticia.data')
        .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC');

      const result = await datesQuery.getRawMany();
      this.logger.debug(`Datas com notícias úteis encontradas: ${JSON.stringify(result)}`);
      return result.map((row) => row.noticia_data);
    } catch (error) {
      this.logger.error(`Erro ao buscar datas de notícias úteis: ${error.message}`, error.stack);
      throw new HttpException(`Erro ao buscar datas de notícias úteis: ${error.message}`, 500);
    }
  }

  async getNullDates(): Promise<string[]> {
    this.logger.debug('Buscando datas com notícias marcadas como null');
    try {
      const datesQuery = this.noticiaRepository
        .createQueryBuilder('noticia')
        .select('noticia.data', 'noticia_data')
        .where('noticia.relevancia IS NULL')
        .andWhere('noticia.data IS NOT NULL')
        .groupBy('noticia.data')
        .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC');

      const result = await datesQuery.getRawMany();
      this.logger.debug(`Datas com notícias nulas encontradas: ${JSON.stringify(result)}`);
      return result.map((row) => row.noticia_data);
    } catch (error) {
      this.logger.error(`Erro ao buscar datas de notícias nulas: ${error.message}`, error.stack);
      throw new HttpException(`Erro ao buscar datas de notícias nulas: ${error.message}`, 500);
    }
  }

  async update(id: number, updateDto: UpdateNoticiaDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.debug(`Atualizando notícia ID ${id}, DTO: ${JSON.stringify(updateDto)}`);

      const noticia = await queryRunner.manager.findOne(Noticia, {
        where: { id },
      });
      if (!noticia) {
        throw new NotFoundException(`Notícia com ID ${id} não encontrada`);
      }

      const fieldsToUpdate: Partial<Noticia> = {};
      if (updateDto.relevancia !== undefined) {
        fieldsToUpdate.relevancia = updateDto.relevancia;
      }
      if (updateDto.tema !== undefined) {
        fieldsToUpdate.tema = updateDto.tema;
      }
      if (updateDto.avaliacao !== undefined) {
        fieldsToUpdate.avaliacao = updateDto.avaliacao;
      }
      if (updateDto.estrategica !== undefined) {
        fieldsToUpdate.estrategica = updateDto.estrategica;
        if (fieldsToUpdate.estrategica === false) {
          fieldsToUpdate.categoria = null;
          fieldsToUpdate.subcategoria = null;
          fieldsToUpdate.ciclo = null;
          this.logger.debug('Estratégica definida como false: limpando categoria, subcategoria e ciclo');
        }
      }
      if (updateDto.categoria !== undefined && fieldsToUpdate.estrategica !== false) {
        fieldsToUpdate.categoria = updateDto.categoria;
      }
      if (updateDto.subcategoria !== undefined && fieldsToUpdate.estrategica !== false) {
        fieldsToUpdate.subcategoria = updateDto.subcategoria;
      }
      if (updateDto.ciclo !== undefined && fieldsToUpdate.estrategica !== false) {
        fieldsToUpdate.ciclo = updateDto.ciclo;
      }

      this.logger.debug(`Campos a atualizar: ${JSON.stringify(fieldsToUpdate)}`);

      if (Object.keys(fieldsToUpdate).length === 0) {
        throw new BadRequestException(
          'Pelo menos um campo deve ser fornecido para atualização',
        );
      }

      this.logger.debug(`Executando atualização com campos: ${JSON.stringify(fieldsToUpdate)}`);
      await queryRunner.manager.update(Noticia, { id }, fieldsToUpdate);

      const updatedNoticia = await queryRunner.manager.findOneOrFail(Noticia, {
        where: { id },
      });

      let pontos_new: number = 0;
      if (updatedNoticia.avaliacao === Avaliacao.POSITIVA) {
        pontos_new = updatedNoticia.pontos;
      } else if (updatedNoticia.avaliacao === Avaliacao.NEGATIVA) {
        pontos_new = -Math.abs(updatedNoticia.pontos);
      } else if (updatedNoticia.avaliacao === Avaliacao.NEUTRA) {
        pontos_new = 0;
      } else if (updatedNoticia.avaliacao === null) {
        pontos_new = 0;
      }

      this.logger.debug(`Calculado pontos_new: ${pontos_new}`);
      await queryRunner.manager.update(Noticia, { id }, { pontos_new });

      const finalNoticia = await queryRunner.manager.findOneOrFail(Noticia, {
        where: { id },
      });

      await queryRunner.commitTransaction();
      this.logger.debug(`Notícia ID ${id} atualizada com sucesso`);

      return {
        ...finalNoticia,
        avaliacao: finalNoticia.avaliacao ?? null,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Erro ao atualizar notícia ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error instanceof HttpException
        ? error
        : new HttpException('Erro interno ao atualizar notícia', 500);
    } finally {
      await queryRunner.release();
    }
  }

  private convertToDDMMYYYY(dateStr: string): string | undefined {
    try {
      const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
      if (!isValid(parsedDate)) {
        throw new Error('Data inválida');
      }
      return format(parsedDate, 'dd/MM/yyyy');
    } catch (error) {
      this.logger.warn(`Erro ao converter data ${dateStr}: ${error.message}`);
      throw new BadRequestException(`Data inválida: ${dateStr}`);
    }
  }

  private isValidDDMMYYYY(dateStr: string): boolean {
    try {
      const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
      return isValid(parsedDate);
    } catch {
      return false;
    }
  }
}