import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { Noticia, Avaliacao } from './entities/noticia.entity';
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
    @InjectRepository(SemanaEstrategica)
    private readonly semanaEstrategicaRepository: Repository<SemanaEstrategica>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(filterDto: FilterNoticiasDto) {
    const {
      from,
      to,
      date,
      utilidade,
      estrategica,
      tema,
      titulo,
      portal,
      avaliacao,
    } = filterDto;

    const fromFormatted = from ? this.convertToDDMMYYYY(from) : undefined;
    const toFormatted = to ? this.convertToDDMMYYYY(to) : undefined;
    const dateFormatted = date ? this.convertToDDMMYYYY(date) : undefined;

    this.logger.debug(
      `Filtros: from=${fromFormatted}, to=${toFormatted}, date=${dateFormatted}, utilidade=${utilidade}, estrategica=${estrategica}, tema=${tema}, titulo=${titulo}, portal=${portal}, avaliacao=${avaliacao}`,
    );

    if (fromFormatted && !this.isValidDDMMYYYY(fromFormatted)) {
      throw new BadRequestException('Data "from" inválida');
    }
    if (toFormatted && !this.isValidDDMMYYYY(toFormatted)) {
      throw new BadRequestException('Data "to" inválida');
    }
    if (dateFormatted && !this.isValidDDMMYYYY(dateFormatted)) {
      throw new BadRequestException('Data "date" inválida');
    }

    const validAvaliacoes = [
      Avaliacao.POSITIVA,
      Avaliacao.NEGATIVA,
      Avaliacao.NEUTRA,
      null,
      '',
    ];
    if (avaliacao !== undefined && !validAvaliacoes.includes(avaliacao)) {
      throw new BadRequestException(
        'Avaliação deve ser Positiva, Negativa, Neutra, nula ou vazia',
      );
    }

    let currentDate = dateFormatted;
    if (!currentDate) {
      const latestDateQuery = this.noticiaRepository
        .createQueryBuilder('noticia')
        .select('noticia.data')
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
          utilidade
            ? utilidade === 'Neutro'
              ? 'noticia.relevancia IS NULL'
              : 'noticia.relevancia = :utilidade'
            : 'TRUE',
          {
            utilidade:
              utilidade === 'Util' ? true : utilidade === 'Lixo' ? false : null,
          },
        )
        .andWhere(
          estrategica !== undefined
            ? 'noticia.estrategica = :estrategica'
            : 'TRUE',
          { estrategica: estrategica === true ? true : false },
        )
        .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
        .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
          titulo: `%${titulo}%`,
        })
        .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
        .andWhere(
          avaliacao !== undefined
            ? avaliacao === ''
              ? 'noticia.avaliacao = :emptyAvaliacao OR noticia.avaliacao IS NULL'
              : 'noticia.avaliacao = :avaliacao'
            : 'TRUE',
          { avaliacao, emptyAvaliacao: '' },
        )
        .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC')
        .limit(1);

      const latestDate = await latestDateQuery.getRawOne();
      currentDate = latestDate?.data || format(new Date(), 'dd/MM/yyyy');

      if (toFormatted && currentDate) {
        const currentDateParsed = parse(currentDate, 'dd/MM/yyyy', new Date());
        const toDateParsed = parse(toFormatted, 'dd/MM/yyyy', new Date());
        if (currentDateParsed > toDateParsed) {
          currentDate = toFormatted;
        }
      }

      this.logger.debug(`Data selecionada: ${currentDate}`);
    }

    const query = this.noticiaRepository
      .createQueryBuilder('noticia')
      .where('noticia.data = :currentDate', { currentDate })
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
        utilidade
          ? utilidade === 'Neutro'
            ? 'noticia.relevancia IS NULL'
            : 'noticia.relevancia = :utilidade'
          : 'TRUE',
        {
          utilidade:
            utilidade === 'Util' ? true : utilidade === 'Lixo' ? false : null,
        },
      )
      .andWhere(
        estrategica !== undefined
          ? 'noticia.estrategica = :estrategica'
          : 'TRUE',
        { estrategica: estrategica === true ? true : false },
      )
      .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
      .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
        titulo: `%${titulo}%`,
      })
      .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
      .andWhere(
        avaliacao !== undefined
          ? avaliacao === ''
            ? 'noticia.avaliacao = :emptyAvaliacao OR noticia.avaliacao IS NULL'
            : 'noticia.avaliacao = :avaliacao'
          : 'TRUE',
        { avaliacao, emptyAvaliacao: '' },
      )
      .orderBy("TO_DATE(noticia.data, 'DD/MM/YYYY')", 'DESC')
      .addOrderBy('noticia.id', 'DESC');

    this.logger.debug(
      `Executando query com estrategica=${estrategica}, SQL: ${query.getSql()}`,
    );
    const noticias = await query.getMany();
    this.logger.debug(`Notícias encontradas: ${noticias.length}`);

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
        utilidade
          ? utilidade === 'Neutro'
            ? 'noticia.relevancia IS NULL'
            : 'noticia.relevancia = :utilidade'
          : 'TRUE',
        {
          utilidade:
            utilidade === 'Util' ? true : utilidade === 'Lixo' ? false : null,
        },
      )
      .andWhere(
        estrategica !== undefined
          ? 'noticia.estrategica = :estrategica'
          : 'TRUE',
        { estrategica: estrategica === true ? true : false },
      )
      .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
      .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
        titulo: `%${titulo}%`,
      })
      .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
      .andWhere(
        avaliacao !== undefined
          ? avaliacao === ''
            ? 'noticia.avaliacao = :emptyAvaliacao OR noticia.avaliacao IS NULL'
            : 'noticia.avaliacao = :avaliacao'
          : 'TRUE',
        { avaliacao, emptyAvaliacao: '' },
      );

    const total = await totalQuery.getCount();
    this.logger.debug(`Total de notícias: ${total}`);

    const hasNext =
      (await this.noticiaRepository
        .createQueryBuilder('noticia')
        .where(
          "TO_DATE(noticia.data, 'DD/MM/YYYY') > TO_DATE(:currentDate, 'DD/MM/YYYY')",
          { currentDate },
        )
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
          utilidade
            ? utilidade === 'Neutro'
              ? 'noticia.relevancia IS NULL'
              : 'noticia.relevancia = :utilidade'
            : 'TRUE',
          {
            utilidade:
              utilidade === 'Util' ? true : utilidade === 'Lixo' ? false : null,
          },
        )
        .andWhere(
          estrategica !== undefined
            ? 'noticia.estrategica = :estrategica'
            : 'TRUE',
          { estrategica: estrategica === true ? true : false },
        )
        .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
        .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
          titulo: `%${titulo}%`,
        })
        .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
        .andWhere(
          avaliacao !== undefined
            ? avaliacao === ''
              ? 'noticia.avaliacao = :emptyAvaliacao OR noticia.avaliacao IS NULL'
              : 'noticia.avaliacao = :avaliacao'
            : 'TRUE',
          { avaliacao, emptyAvaliacao: '' },
        )
        .limit(1)
        .getCount()) > 0;

    const hasPrevious =
      (await this.noticiaRepository
        .createQueryBuilder('noticia')
        .where(
          "TO_DATE(noticia.data, 'DD/MM/YYYY') < TO_DATE(:currentDate, 'DD/MM/YYYY')",
          { currentDate },
        )
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
          utilidade
            ? utilidade === 'Neutro'
              ? 'noticia.relevancia IS NULL'
              : 'noticia.relevancia = :utilidade'
            : 'TRUE',
          {
            utilidade:
              utilidade === 'Util' ? true : utilidade === 'Lixo' ? false : null,
          },
        )
        .andWhere(
          estrategica !== undefined
            ? 'noticia.estrategica = :estrategica'
            : 'TRUE',
          { estrategica: estrategica === true ? true : false },
        )
        .andWhere(tema ? 'noticia.tema ILIKE :tema' : 'TRUE', { tema })
        .andWhere(titulo ? 'noticia.titulo ILIKE :titulo' : 'TRUE', {
          titulo: `%${titulo}%`,
        })
        .andWhere(portal ? 'noticia.portal ILIKE :portal' : 'TRUE', { portal })
        .andWhere(
          avaliacao !== undefined
            ? avaliacao === ''
              ? 'noticia.avaliacao = :emptyAvaliacao OR noticia.avaliacao IS NULL'
              : 'noticia.avaliacao = :avaliacao'
            : 'TRUE',
          { avaliacao, emptyAvaliacao: '' },
        )
        .limit(1)
        .getCount()) > 0;

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
        hasNext,
        hasPrevious,
      },
    };
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
        fieldsToUpdate.relevancia = updateDto.relevancia === null ? undefined : updateDto.relevancia;
      }
      if (updateDto.tema !== undefined) {
        fieldsToUpdate.tema = updateDto.tema === null ? undefined : updateDto.tema;
      }
      if (updateDto.avaliacao !== undefined) {
        fieldsToUpdate.avaliacao = (updateDto.avaliacao === '' || updateDto.avaliacao === null ? null : updateDto.avaliacao) as string | undefined;
      }
      if (updateDto.estrategica !== undefined) {
        fieldsToUpdate.estrategica = updateDto.estrategica;
        if (updateDto.estrategica === false) {
          fieldsToUpdate.categoria = null as unknown as string | undefined;
          fieldsToUpdate.subcategoria = null as unknown as string | undefined;
          this.logger.debug('Estratégica definida como false: limpando categoria e subcategoria');
        }
      }
  
      this.logger.debug(`Campos a atualizar: ${JSON.stringify(fieldsToUpdate)}`);
  
      if (Object.keys(fieldsToUpdate).length === 0) {
        throw new BadRequestException(
          'Pelo menos um campo deve ser fornecido para atualização',
        );
      }
  
      if (fieldsToUpdate.estrategica === true) {
        this.logger.debug(`Buscando semana estratégica para data ${noticia.data}`);
        const semana = await queryRunner.manager
          .createQueryBuilder(SemanaEstrategica, 'semana')
          .where(
            "TO_DATE(:data, 'DD/MM/YYYY') BETWEEN TO_DATE(semana.data_inicial, 'DD/MM/YYYY') AND TO_DATE(semana.data_final, 'DD/MM/YYYY')",
            { data: noticia.data },
          )
          .getOne();
  
        if (semana) {
          fieldsToUpdate.categoria = semana.categoria;
          fieldsToUpdate.subcategoria = semana.subcategoria;
          this.logger.debug(
            `Semana estratégica encontrada: categoria=${semana.categoria}, subcategoria=${semana.subcategoria}`,
          );
        } else {
          fieldsToUpdate.categoria = null as unknown as string | undefined;
          fieldsToUpdate.subcategoria = null as unknown as string | undefined;
          this.logger.debug('Nenhuma semana estratégica encontrada');
        }
      }
  
      this.logger.debug(`Executando atualização com campos: ${JSON.stringify(fieldsToUpdate)}`);
      await queryRunner.manager.update(Noticia, { id }, fieldsToUpdate);
  
      const updatedNoticia = await queryRunner.manager.findOneOrFail(Noticia, {
        where: { id },
      });
  
      let pontos_new: number = 0; // Padrão para null ou undefined
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
      await queryRunner.manager.update(
        Noticia,
        { id },
        { pontos_new: pontos_new },
      );
  
      const finalNoticia = await queryRunner.manager.findOneOrFail(Noticia, {
        where: { id },
      });
  
      await queryRunner.commitTransaction();
      this.logger.debug(`Notícia ID ${id} atualizada com sucesso`);
  
      return {
        ...finalNoticia,
        avaliacao: finalNoticia.avaliacao ?? null, // Garante que '' ou undefined vire null
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