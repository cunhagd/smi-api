import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException, HttpException, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { PortaisService } from './portais.service';
import { PortalResponseDto, CreatePortalDto, PortalListResponseDto, UpdatePortalDto } from './dto/portais.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { NotFoundException } from '@nestjs/common';
import { Portal } from './entities/portais.entity';

@ApiTags('portais')
@Controller('portais')
export class PortaisController {
  constructor(private readonly portaisService: PortaisService) {}

  @Get('cadastrados')
  @ApiOperation({ summary: 'Lista todos os portais cadastrados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de portais no formato { nome: { id, pontos, abrangencia, prioridade, url } }',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          pontos: { type: 'integer', example: 50 },
          abrangencia: { type: 'string', example: 'Regional' },
          prioridade: { type: 'string', example: 'Alta' },
          url: { type: 'string', nullable: true, example: 'https://otempo.com' },
        },
      },
    },
  })
  async findAll(): Promise<{ [key: string]: Omit<PortalListResponseDto, 'nome'> }> {
    return this.portaisService.findAll();
  }

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

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Cria um novo portal' })
  @ApiBody({ type: CreatePortalDto, description: 'Dados para criação de um portal' })
  @ApiResponse({ status: 201, description: 'Portal criado com sucesso', type: Portal })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos' })
  async create(@Body() createPortalDto: CreatePortalDto): Promise<Portal> {
    try {
      return await this.portaisService.create(createPortalDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('cadastrados/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Atualiza um portal pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do portal', example: 1 })
  @ApiBody({
    type: UpdatePortalDto,
    description: 'Dados para atualização do portal (campos opcionais)',
    examples: {
      exemploAtualizacao: {
        summary: 'Exemplo de atualização',
        value: {
          pontos: 30,
          abrangencia: 'Nacional',
          prioridade: 'Média',
          url: 'https://novourl.com',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Portal atualizado com sucesso', type: Portal })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos' })
  @ApiResponse({ status: 404, description: 'Portal não encontrado' })
  async update(@Param('id') id: string, @Body() updatePortalDto: UpdatePortalDto): Promise<Portal> {
    const idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) {
      throw new BadRequestException('ID deve ser um número válido');
    }
    try {
      return await this.portaisService.update(idNumber, updatePortalDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('cadastrados/:id')
  @ApiOperation({ summary: 'Remove um portal pelo ID e o move para a lixeira' })
  @ApiParam({ name: 'id', description: 'ID do portal', example: 1 })
  @ApiResponse({ status: 200, description: 'Portal movido para lixeira', schema: { type: 'object', properties: { message: { type: 'string', example: 'Portal movido para lixeira' } } } })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Portal não encontrado' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    const idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) {
      throw new BadRequestException('ID deve ser um número válido');
    }
    try {
      return await this.portaisService.delete(idNumber);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}