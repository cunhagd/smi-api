import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portal } from './entities/portais.entity';
import { LixeiraPortal } from './entities/lixeira-portal.entity';
import { PortalResponseDto, CreatePortalDto, PortalListResponseDto, UpdatePortalDto } from './dto/portais.dto';

@Injectable()
export class PortaisService {
  private readonly logger = new Logger(PortaisService.name);

  constructor(
    @InjectRepository(Portal)
    private portaisRepository: Repository<Portal>,
    @InjectRepository(LixeiraPortal)
    private lixeiraPortaisRepository: Repository<LixeiraPortal>,
  ) {}

  async findByNome(nome: string): Promise<PortalResponseDto> {
    if (!nome || nome.trim() === '') {
      throw new BadRequestException('O nome do portal não pode estar vazio');
    }

    const portal = await this.portaisRepository.findOne({
      where: { nome: nome.trim() },
    });

    if (!portal) {
      throw new NotFoundException(`Portal com nome "${nome}" não encontrado`);
    }

    return {
      nome: portal.nome,
      pontos: portal.pontos,
      abrangencia: portal.abrangencia,
      prioridade: portal.prioridade,
    };
  }

  async findAll(): Promise<{ [key: string]: Omit<PortalListResponseDto, 'nome'> }> {
    const portais = await this.portaisRepository.find();
    const result: { [key: string]: Omit<PortalListResponseDto, 'nome'> } = {};

    portais.forEach((portal) => {
      result[portal.nome] = {
        id: portal.id,
        pontos: portal.pontos,
        abrangencia: portal.abrangencia,
        prioridade: portal.prioridade,
        url: portal.url,
      };
    });

    return result;
  }

  async create(createPortalDto: CreatePortalDto): Promise<Portal> {
    const existingPortal = await this.portaisRepository.findOne({
      where: { nome: createPortalDto.nome.trim() },
    });
    if (existingPortal) {
      throw new BadRequestException(`Portal com nome "${createPortalDto.nome}" já existe`);
    }

    const portal = new Portal();
    portal.nome = createPortalDto.nome.trim();
    portal.pontos = createPortalDto.pontos;
    portal.abrangencia = createPortalDto.abrangencia;
    portal.prioridade = createPortalDto.prioridade;
    portal.url = createPortalDto.url || null;
    portal.nome2 = null;
    portal.nome_modulo = null;

    return this.portaisRepository.save(portal);
  }

  async update(id: number, updatePortalDto: UpdatePortalDto): Promise<Portal> {
    const portal = await this.portaisRepository.findOne({ where: { id } });
    if (!portal) {
      throw new NotFoundException(`Portal com ID "${id}" não encontrado`);
    }

    if (updatePortalDto.pontos !== undefined) {
      portal.pontos = updatePortalDto.pontos;
    }
    if (updatePortalDto.abrangencia !== undefined) {
      portal.abrangencia = updatePortalDto.abrangencia;
    }
    if (updatePortalDto.prioridade !== undefined) {
      portal.prioridade = updatePortalDto.prioridade;
    }
    if (updatePortalDto.url !== undefined) {
      portal.url = updatePortalDto.url;
    }

    return this.portaisRepository.save(portal);
  }

  async delete(id: number): Promise<{ message: string }> {
    return await this.portaisRepository.manager.transaction(async (transactionalEntityManager) => {
      const portal = await transactionalEntityManager.findOne(Portal, { where: { id } });
      if (!portal) {
        throw new NotFoundException(`Portal com ID "${id}" não encontrado`);
      }

      const lixeiraPortal = new LixeiraPortal();
      lixeiraPortal.nome = portal.nome;
      lixeiraPortal.pontos = portal.pontos;
      lixeiraPortal.abrangencia = portal.abrangencia;
      lixeiraPortal.prioridade = portal.prioridade;
      lixeiraPortal.url = portal.url;
      lixeiraPortal.nome2 = portal.nome2;
      lixeiraPortal.nome_modulo = portal.nome_modulo;

      this.logger.debug(`Copiando portal ID ${id} para lixeira: ${JSON.stringify(lixeiraPortal)}`);

      await transactionalEntityManager.save(LixeiraPortal, lixeiraPortal);
      await transactionalEntityManager.remove(Portal, portal);

      return { message: 'Portal movido para lixeira' };
    });
  }
}