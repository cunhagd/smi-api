import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Noticia } from '../noticias/entities/noticia.entity';
import { Portal } from '../portais/entities/portais.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Noticia, Portal])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}