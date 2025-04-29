import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemanaEstrategicaController } from './semana-estrategica.controller';
import { SemanaEstrategicaService } from './semana-estrategica.service';
import { SemanaEstrategica } from './entities/semana-estrategica.entity';
import { Noticia } from '../noticias/entities/noticia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SemanaEstrategica, Noticia])],
  controllers: [SemanaEstrategicaController],
  providers: [SemanaEstrategicaService],
  exports: [SemanaEstrategicaService], // Exportar o service para uso em outros módulos
})
export class SemanaEstrategicaModule {}