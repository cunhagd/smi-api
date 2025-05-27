import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortaisService } from './portais.service';
import { PortaisController } from './portais.controller';
import { Portal } from './entities/portais.entity';
import { LixeiraPortal } from './entities/lixeira-portal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Portal, LixeiraPortal])],
  controllers: [PortaisController],
  providers: [PortaisService],
  exports: [PortaisService],
})
export class PortaisModule {}