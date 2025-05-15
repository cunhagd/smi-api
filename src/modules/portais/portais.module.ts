import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortaisController } from './portais.controller';
import { PortaisService } from './portais.service';
import { Portal } from './entities/portais.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Portal])],
  controllers: [PortaisController],
  providers: [PortaisService],
})
export class PortaisModule {}