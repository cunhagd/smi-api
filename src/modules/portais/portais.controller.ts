import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { PortaisService } from './portais.service';
import { PortalResponseDto } from './dto/portais.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('portais')
@Controller('portais')
export class PortaisController {
  constructor(private readonly portaisService: PortaisService) {}

  @Get(':nome')
  @ApiOperation({ summary: 'Obtém informações de um portal pelo nome' })
  @ApiParam({ name: 'nome', description: 'Nome do portal', example: 'O Tempo' })
  @ApiResponse({ status: 200, description: 'Informações do portal', type: PortalResponseDto })
  @ApiResponse({ status: 400, description: 'Nome do portal inválido' })
  @ApiResponse({ status: 404, description: 'Portal não encontrado' })
  async findByNome(@Param('nome') nome: string): Promise<PortalResponseDto> {
    if (!nome) {
      throw new BadRequestException('O nome do portal é obrigatório');
    }
    return this.portaisService.findByNome(nome);
  }
}