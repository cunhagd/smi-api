import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoticiaPostagem } from './entities/noticia-postagem.entity';
import { CreateNoticiaPostagemDto } from './dto/create-noticia-postagem.dto';
import { PortaisService } from '../portais/portais.service';
import { Avaliacao } from './entities/noticia-postagem.entity';

@Injectable()
export class NoticiasPostagemService {
  constructor(
    @InjectRepository(NoticiaPostagem)
    private noticiaRepository: Repository<NoticiaPostagem>,
    private portaisService: PortaisService,
  ) {}

  async create(createNoticiaDto: CreateNoticiaPostagemDto): Promise<NoticiaPostagem> {
    // Buscar portal para preenchimento automático
    const portal = await this.portaisService.findByNome(createNoticiaDto.portal);
    if (!portal) {
      throw new HttpException('Portal não encontrado', HttpStatus.NOT_FOUND);
    }

    // Mapear DTO para entidade
    const noticia = new NoticiaPostagem();
    noticia.data = createNoticiaDto.data;
    noticia.titulo = createNoticiaDto.titulo;
    noticia.corpo = createNoticiaDto.corpo;
    noticia.link = createNoticiaDto.link;
    noticia.portal = createNoticiaDto.portal;
    noticia.tema = createNoticiaDto.tema;
    noticia.avaliacao = createNoticiaDto.avaliacao;
    noticia.estrategica = createNoticiaDto.estrategica === 'Sim' ? true : false;
    noticia.pontos = portal.pontos;
    noticia.abrangencia = portal.abrangencia;
    noticia.relevancia = createNoticiaDto.relevancia;
    noticia.autor = null;
    // Calcular pontos_new com base na avaliação
    noticia.pontos_new =
      createNoticiaDto.avaliacao === Avaliacao.POSITIVA
        ? portal.pontos
        : createNoticiaDto.avaliacao === Avaliacao.NEGATIVA
        ? -portal.pontos
        : 0; // Neutra
    noticia.categoria = null;
    noticia.subcategoria = null;
    noticia.ciclo = null;

    // Salvar no banco
    return this.noticiaRepository.save(noticia);
  }
}