import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portal } from './entities/portais.entity';
import { PortalResponseDto, CreatePortalDto } from './dto/portais.dto';

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

  async create(createPortalDto: CreatePortalDto): Promise<Portal> {
    // Verificar se o nome do portal já existe
    const existingPortal = await this.portaisRepository.findOne({
      where: { nome: createPortalDto.nome.trim() },
    });
    if (existingPortal) {
      throw new BadRequestException(`Portal com nome "${createPortalDto.nome}" já existe`);
    }

    // Mapear DTO para entidade
    const portal = new Portal();
    portal.nome = createPortalDto.nome.trim();
    portal.pontos = createPortalDto.pontos;
    portal.abrangencia = createPortalDto.abrangencia;
    portal.prioridade = createPortalDto.prioridade;
    portal.url = createPortalDto.url || null;
    portal.nome2 = null; // Não fornecido pelo frontend
    portal.nome_modulo = null; // Não fornecido pelo frontend

    // Salvar no banco
    return this.portaisRepository.save(portal);
  }
}