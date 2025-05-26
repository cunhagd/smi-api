import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticiasPostagemController } from './noticias-postagem.controller';
import { NoticiasPostagemService } from './noticias-postagem.service';
import { NoticiaPostagem } from './entities/noticia-postagem.entity';
import { PortaisModule } from '../portais/portais.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoticiaPostagem]),
    forwardRef(() => PortaisModule),
  ],
  controllers: [NoticiasPostagemController],
  providers: [NoticiasPostagemService],
})
export class NoticiasPostagemModule {}