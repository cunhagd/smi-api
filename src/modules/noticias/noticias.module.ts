import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticiasController } from './noticias.controller';
import { NoticiasService } from './noticias.service';
import { Noticia } from './entities/noticia.entity';
import { Lixeira } from './entities/lixeira.entity';
import { SemanaEstrategica } from '../semana-estrategica/entities/semana-estrategica.entity';
import { SemanaEstrategicaModule } from '../semana-estrategica/semana-estrategica.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Noticia, Lixeira, SemanaEstrategica]),
    SemanaEstrategicaModule,
  ],
  controllers: [NoticiasController],
  providers: [NoticiasService],
})
export class NoticiasModule {}