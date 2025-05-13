import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { NoticiasService } from './noticias.service';
import { FilterNoticiasDto } from './dto/filter-noticias.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Noticia } from './entities/noticia.entity';

@ApiTags('noticias')
@Controller('noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Listar notícias por dia com navegação' })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    example: '2025-04-20',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    example: '2025-04-25',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2025-04-25',
  })
  @ApiQuery({
    name: 'before',
    required: false,
    type: String,
    example: '2025-04-25',
  })
  @ApiQuery({
    name: 'after',
    required: false,
    type: String,
    example: '2025-04-24',
  })
  @ApiQuery({
    name: 'relevancia',
    required: false,
    type: String,
    example: 'Util',
  })
  @ApiQuery({
    name: 'estrategica',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    example: true,
    description: 'Se true e estrategica=true, retorna todas as notícias estratégicas sem paginação',
  })
  @ApiQuery({
    name: 'avaliacao',
    required: false,
    type: String,
    example: 'Positiva',
  })
  @ApiQuery({ name: 'tema', required: false, type: String, example: 'Social' })
  @ApiQuery({ name: 'titulo', required: false, type: String, example: 'Minas' })
  @ApiQuery({
    name: 'portal',
    required: false,
    type: String,
    example: 'Mauá Agora',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de notícias',
    type: [Noticia],
  })
  async findAll(@Query() filterDto: FilterNoticiasDto) {
    return this.noticiasService.findAll(filterDto);
  }

  @Get('move-to-trash')
  @ApiOperation({ summary: 'Mover notícias marcadas como Lixo para a tabela lixeira' })
  @ApiResponse({
    status: 200,
    description: 'Notícias marcadas como Lixo movidas com sucesso',
    type: Object,
  })
  async moveToTrash() {
    return this.noticiasService.moveToTrash();
  }

  @Get('strategic-dates')
  @ApiOperation({ summary: 'Listar datas com notícias estratégicas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de datas no formato DD/MM/YYYY',
    type: [String],
  })
  async getStrategicDates() {
    return this.noticiasService.getStrategicDates();
  }

  @Get('trash-dates')
  @ApiOperation({ summary: 'Listar datas com notícias marcadas como Lixo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de datas no formato DD/MM/YYYY',
    type: [String],
  })
  async getTrashDates() {
    return this.noticiasService.getTrashDates();
  }

  @Get('suport-dates')
  @ApiOperation({ summary: 'Listar datas com notícias marcadas como Suporte' })
  @ApiResponse({
    status: 200,
    description: 'Lista de datas no formato DD/MM/YYYY',
    type: [String],
  })
  async getSuportDates() {
    return this.noticiasService.getSuportDates();
  }

  @Get('util-dates')
  @ApiOperation({ summary: 'Listar datas com notícias marcadas como Útil' })
  @ApiResponse({
    status: 200,
    description: 'Lista de datas no formato DD/MM/YYYY',
    type: [String],
  })
  async getUtiltDates() {
    return this.noticiasService.getSuportDates();
  }

  @Get('null-dates')
  @ApiOperation({ summary: 'Listar datas com notícias marcadas como null' })
  @ApiResponse({
    status: 200,
    description: 'Lista de datas no formato DD/MM/YYYY',
    type: [String],
  })
  async getNullDates() {
    return this.noticiasService.getSuportDates();
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Atualizar uma notícia por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID da notícia' })
  @ApiBody({
    type: UpdateNoticiaDto,
    examples: {
      example1: {
        value: {
          estrategica: true,
          relevancia: 'Útil',
          tema: 'Educação',
          avaliacao: 'Positiva',
          categoria: 'Educação',
          subcategoria: 'Cultura e Turismo',
          ciclo: 21,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Notícia atualizada', type: Noticia })
  @ApiResponse({ status: 400, description: 'Requisição inválida' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateNoticiaDto,
  ) {
    return this.noticiasService.update(id, updateDto);
  }
}