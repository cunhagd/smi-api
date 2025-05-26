import { Controller, Post, Body, HttpException, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { NoticiasPostagemService } from './noticias-postagem.service';
import { CreateNoticiaPostagemDto } from './dto/create-noticia-postagem.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { NoticiaPostagem } from './entities/noticia-postagem.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('noticias-postagem')
@Controller('noticias-postagem')
export class NoticiasPostagemController {
  constructor(private readonly noticiasPostagemService: NoticiasPostagemService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Cria uma nova notícia' })
  @ApiBody({
    type: CreateNoticiaPostagemDto,
    description: 'Dados para criação de uma notícia',
    examples: {
      exemploNoticia: {
        summary: 'Exemplo de notícia',
        value: {
          data: '26/05/2025',
          titulo: 'Notícia de Teste',
          corpo: 'Conteúdo da notícia aqui...',
          link: 'https://exemplo.com/noticia',
          portal: 'O Tempo',
          tema: 'Educação',
          avaliacao: 'Positiva',
          estrategica: 'Sim',
          relevancia: 'Útil',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Notícia criada com sucesso',
    type: NoticiaPostagem,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos fornecidos',
    type: BadRequestException,
  })
  @ApiResponse({
    status: 404,
    description: 'Portal não encontrado',
    type: NotFoundException,
  })
  async create(@Body() createNoticiaDto: CreateNoticiaPostagemDto): Promise<NoticiaPostagem> {
    try {
      return await this.noticiasPostagemService.create(createNoticiaDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}