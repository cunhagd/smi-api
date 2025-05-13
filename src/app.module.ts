import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NoticiasModule } from './modules/noticias/noticias.module';
import { SemanaEstrategicaModule } from './modules/semana-estrategica/semana-estrategica.module';
import { Noticia } from './modules/noticias/entities/noticia.entity';
import { Lixeira } from './modules/noticias/entities/lixeira.entity';
import { SemanaEstrategica } from './modules/semana-estrategica/entities/semana-estrategica.entity';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl: string = configService.get<string>('DATABASE_URL')!;
        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [Noticia, Lixeira, SemanaEstrategica],
          synchronize: false,
          logging: true,
        };
      },
      inject: [ConfigService],
    }),
    NoticiasModule,
    SemanaEstrategicaModule,
    DashboardModule,
  ],
})
export class AppModule {}