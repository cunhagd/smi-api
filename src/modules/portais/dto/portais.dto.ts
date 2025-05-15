import { IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PortalResponseDto {
  @ApiProperty({ description: 'Nome do portal' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Pontuação do portal', nullable: true })
  @IsInt()
  @IsOptional()
  pontos: number;

  @ApiProperty({ description: 'Abrangência do portal', nullable: true })
  @IsString()
  @IsOptional()
  abrangencia: string;

  @ApiProperty({ description: 'Prioridade do portal', nullable: true })
  @IsString()
  @IsOptional()
  prioridade: string;
}