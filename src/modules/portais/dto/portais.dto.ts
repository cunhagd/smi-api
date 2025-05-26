import { IsString, IsInt, IsOptional, IsIn, IsUrl, IsNotEmpty } from 'class-validator';
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

export class CreatePortalDto {
  @ApiProperty({ description: 'Nome do portal' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do portal não pode estar vazio' })
  nome: string;

  @ApiProperty({ description: 'Pontuação do portal' })
  @IsInt()
  @IsOptional()
  pontos: number;

  @ApiProperty({ description: 'Abrangência do portal', enum: ['Regional', 'Local', 'Nacional'] })
  @IsString()
  @IsIn(['Regional', 'Local', 'Nacional'], { message: 'Abrangência deve ser Regional, Local ou Nacional' })
  abrangencia: string;

  @ApiProperty({ description: 'Prioridade do portal', enum: ['Baixa', 'Média', 'Alta'] })
  @IsString()
  @IsIn(['Baixa', 'Média', 'Alta'], { message: 'Prioridade deve ser Baixa, Média ou Alta' })
  prioridade: string;

  @ApiProperty({ description: 'URL do portal', nullable: true })
  @IsUrl({}, { message: 'URL inválida' })
  @IsOptional()
  url: string;
}   