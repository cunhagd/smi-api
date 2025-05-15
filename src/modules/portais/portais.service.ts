import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portal } from './entities/portais.entity';
import { PortalResponseDto } from './dto/portais.dto';

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
}