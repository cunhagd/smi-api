import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portal } from './entities/portais.entity';
import { PortalResponseDto, CreatePortalDto, PortalListResponseDto, UpdatePortalDto } from './dto/portais.dto';

@Injectable()
export class PortaisService {
  constructor(
    @InjectRepository(Portal)
    private portaisRepository: Repository<Portal>,
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
}