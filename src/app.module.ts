import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NoticiasModule } from './modules/noticias/noticias.module';
import { SemanaEstrategicaModule } from './modules/semana-estrategica/semana-estrategica.module';
import { Noticia } from './modules/noticias/entities/noticia.entity';
import { SemanaEstrategica } from './modules/semana-estrategica/entities/semana-estrategica.entity';

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
          entities: [Noticia, SemanaEstrategica],
          synchronize: false,
          logging: true, // Ativa logs para depuração no Railway
        };
      },
      inject: [ConfigService],
    }),
    NoticiasModule,
    SemanaEstrategicaModule,
  ],
})
export class AppModule {}