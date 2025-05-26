import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortaisService } from './portais.service';
import { PortaisController } from './portais.controller';
import { Portal } from './entities/portais.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Portal])],
  controllers: [PortaisController],
  providers: [PortaisService],
  exports: [PortaisService],
})
export class PortaisModule {}