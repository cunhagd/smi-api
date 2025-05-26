import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { NoticiasPostagemService } from './noticias-postagem.service';
import { CreateNoticiaPostagemDto } from './dto/create-noticia-postagem.dto';

@Controller('noticias-postagem')
export class NoticiasPostagemController {
  constructor(private readonly noticiasPostagemService: NoticiasPostagemService) {}

  @Post()
  async create(@Body() createNoticiaDto: CreateNoticiaPostagemDto) {
    try {
      return await this.noticiasPostagemService.create(createNoticiaDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}