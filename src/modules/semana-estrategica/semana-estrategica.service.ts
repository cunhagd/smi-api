import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, DataSource, Not } from 'typeorm';
  import { SemanaEstrategica } from './entities/semana-estrategica.entity';
  import { CreateSemanaEstrategicaDto } from './dto/create-semana-estrategica.dto';
  import { UpdateSemanaEstrategicaDto } from './dto/update-semana-estrategica.dto';
  import { parse, isValid } from 'date-fns';
  
  @Injectable()
  export class SemanaEstrategicaService {
    private readonly logger = new Logger(SemanaEstrategicaService.name);
  
    constructor(
      @InjectRepository(SemanaEstrategica)
      private semanaEstrategicaRepository: Repository<SemanaEstrategica>,
      private dataSource: DataSource,
    ) {}
  
    async findAll() {
      return this.semanaEstrategicaRepository.find();
    }

    async remove(id: number) {
      const semana = await this.semanaEstrategicaRepository.findOne({ where: { id } });
      if (!semana) {
        throw new NotFoundException(`Semana estratégica com ID ${id} não encontrada`);
      }
      await this.semanaEstrategicaRepository.delete(id);
      return { message: `Semana estratégica com ID ${id} excluída com sucesso` };
    }
  
    async create(createDto: CreateSemanaEstrategicaDto) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
  
      try {
        this.logger.debug('Cadastrando nova semana estratégica');
  
        if (!createDto.data_inicial || !createDto.data_final || !createDto.ciclo) {
          throw new BadRequestException(
            'Campos obrigatórios: data_inicial, data_final, ciclo',
          );
        }
  
        if (
          !this.isValidDDMMYYYY(createDto.data_inicial) ||
          !this.isValidDDMMYYYY(createDto.data_final)
        ) {
          throw new BadRequestException(
            'As datas devem estar no formato DD/MM/YYYY',
          );
        }
  
        const startDate = parse(createDto.data_inicial, 'dd/MM/yyyy', new Date());
        const endDate = parse(createDto.data_final, 'dd/MM/yyyy', new Date());
        if (startDate > endDate) {
          throw new BadRequestException(
            'A data inicial não pode ser posterior à data final',
          );
        }
  
        const existingSemanas = await queryRunner.manager.find(SemanaEstrategica);
        for (const semana of existingSemanas) {
          const existingStart = parse(
            semana.data_inicial,
            'dd/MM/yyyy',
            new Date(),
          );
          const existingEnd = parse(semana.data_final, 'dd/MM/yyyy', new Date());
  
          const noOverlap =
            startDate.getTime() > existingEnd.getTime() ||
            endDate.getTime() < existingStart.getTime();
  
          if (!noOverlap) {
            throw new BadRequestException(
              `As datas selecionadas se sobrepõem a uma semana estratégica existente (ID: ${semana.id}, Ciclo: ${semana.ciclo}, de ${semana.data_inicial} a ${semana.data_final})`,
            );
          }
        }
  
        const semana = queryRunner.manager.create(SemanaEstrategica, createDto);
        const savedSemana = await queryRunner.manager.save(semana);
  
        await queryRunner.commitTransaction();
        this.logger.debug(
          `Semana estratégica ID ${savedSemana.id} criada com sucesso`,
        );
        return savedSemana;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(
          `Erro ao cadastrar semana estratégica: ${error.message}`,
          error.stack,
        );
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  
    async update(id: number, updateDto: UpdateSemanaEstrategicaDto) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
  
      try {
        this.logger.debug(`Atualizando semana estratégica ID ${id}`);
  
        const semana = await queryRunner.manager.findOne(SemanaEstrategica, {
          where: { id },
        });
        if (!semana) {
          throw new NotFoundException(
            `Semana estratégica com ID ${id} não encontrada`,
          );
        }
  
        const fieldsToUpdate: Partial<SemanaEstrategica> = {};
        if (updateDto.data_inicial !== undefined) {
          if (!this.isValidDDMMYYYY(updateDto.data_inicial)) {
            throw new BadRequestException(
              'data_inicial deve estar no formato DD/MM/YYYY',
            );
          }
          fieldsToUpdate.data_inicial = updateDto.data_inicial;
        }
        if (updateDto.data_final !== undefined) {
          if (!this.isValidDDMMYYYY(updateDto.data_final)) {
            throw new BadRequestException(
              'data_final deve estar no formato DD/MM/YYYY',
            );
          }
          fieldsToUpdate.data_final = updateDto.data_final;
        }
        if (updateDto.ciclo !== undefined) {
          fieldsToUpdate.ciclo = updateDto.ciclo;
        }
        if (updateDto.categoria !== undefined) {
          fieldsToUpdate.categoria = updateDto.categoria;
        }
        if (updateDto.subcategoria !== undefined) {
          fieldsToUpdate.subcategoria = updateDto.subcategoria;
        }
  
        if (Object.keys(fieldsToUpdate).length === 0) {
          throw new BadRequestException(
            'Pelo menos um campo deve ser fornecido para atualização',
          );
        }
  
        const checkDataInicial = fieldsToUpdate.data_inicial || semana.data_inicial;
        const checkDataFinal = fieldsToUpdate.data_final || semana.data_final;
        const startDate = parse(checkDataInicial, 'dd/MM/yyyy', new Date());
        const endDate = parse(checkDataFinal, 'dd/MM/yyyy', new Date());
        if (startDate > endDate) {
          throw new BadRequestException(
            'A data inicial não pode ser posterior à data final',
          );
        }
  
        const existingSemanas = await queryRunner.manager.find(SemanaEstrategica, {
          where: { id: Not(id) },
        });
        for (const existingSemana of existingSemanas) {
          const existingStart = parse(
            existingSemana.data_inicial,
            'dd/MM/yyyy',
            new Date(),
          );
          const existingEnd = parse(
            existingSemana.data_final,
            'dd/MM/yyyy',
            new Date(),
          );
  
          const noOverlap =
            startDate.getTime() > existingEnd.getTime() ||
            endDate.getTime() < existingStart.getTime();
  
          if (!noOverlap) {
            throw new BadRequestException(
              `As datas selecionadas se sobrepõem a uma semana estratégica existente (ID: ${existingSemana.id}, Ciclo: ${existingSemana.ciclo}, de ${existingSemana.data_inicial} a ${existingSemana.data_final})`,
            );
          }
        }
  
        await queryRunner.manager.update(SemanaEstrategica, { id }, fieldsToUpdate);
        const updatedSemana = await queryRunner.manager.findOneOrFail(
          SemanaEstrategica,
          { where: { id } },
        );
  
        await queryRunner.commitTransaction();
        this.logger.debug(
          `Semana estratégica ID ${id} atualizada com sucesso`,
        );
        return updatedSemana;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(
          `Erro ao atualizar semana estratégica ID ${id}: ${error.message}`,
          error.stack,
        );
        throw error;
      } finally {
        await queryRunner.release();
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