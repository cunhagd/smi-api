import { IsString, IsInt, IsIn, IsUrl, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PortalResponseDto {
  @ApiProperty({ description: 'Nome do portal', example: 'O Tempo' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Pontuação do portal', example: 50 })
  @IsInt()
  pontos: number;

  @ApiProperty({ description: 'Abrangência do portal', example: 'Regional' })
  @IsString()
  abrangencia: string;

  @ApiProperty({ description: 'Prioridade do portal', example: 'Alta' })
  @IsString()
  prioridade: string;
}

export class PortalListResponseDto {
  @ApiProperty({ description: 'ID do portal', example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ description: 'Nome do portal', example: 'O Tempo' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Pontuação do portal', example: 50 })
  @IsInt()
  pontos: number;

  @ApiProperty({ description: 'Abrangência do portal', example: 'Regional' })
  @IsString()
  abrangencia: string;

  @ApiProperty({ description: 'Prioridade do portal', example: 'Alta' })
  @IsString()
  prioridade: string;

  @ApiProperty({ description: 'URL do portal', example: 'https://otempo.com', nullable: true })
  @IsUrl({}, { message: 'URL inválida' })
  @IsOptional()
  url: string | null;
}

export class CreatePortalDto {
  @ApiProperty({ description: 'Nome do portal', example: 'Portal Teste' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do portal não pode estar vazio' })
  nome: string;

  @ApiProperty({ description: 'Pontuação do portal', example: 50 })
  @IsInt()
  @IsNotEmpty({ message: 'Pontuação do portal é obrigatória' })
  pontos: number;

  @ApiProperty({ description: 'Abrangência do portal', enum: ['Regional', 'Local', 'Nacional'], example: 'Regional' })
  @IsString()
  @IsIn(['Regional', 'Local', 'Nacional'], { message: 'Abrangência deve ser Regional, Local ou Nacional' })
  abrangencia: string;

  @ApiProperty({ description: 'Prioridade do portal', enum: ['Baixa', 'Média', 'Alta'], example: 'Baixa' })
  @IsString()
  @IsIn(['Baixa', 'Média', 'Alta'], { message: 'Prioridade deve ser Baixa, Média ou Alta' })
  prioridade: string;

  @ApiProperty({ description: 'URL do portal', example: 'https://novoportal.com', nullable: true })
  @IsUrl({}, { message: 'URL inválida' })
  @IsOptional()
  url: string | null;
}

export class UpdatePortalDto {
  @ApiProperty({ description: 'Pontuação do portal', example: 50, required: false })
  @IsInt()
  @IsOptional()
  pontos?: number;

  @ApiProperty({ description: 'Abrangência do portal', enum: ['Regional', 'Local', 'Nacional'], example: 'Regional', required: false })
  @IsString()
  @IsIn(['Regional', 'Local', 'Nacional'], { message: 'Abrangência deve ser Regional, Local ou Nacional' })
  @IsOptional()
  abrangencia?: string;

  @ApiProperty({ description: 'Prioridade do portal', enum: ['Baixa', 'Média', 'Alta'], example: 'Baixa', required: false })
  @IsString()
  @IsIn(['Baixa', 'Média', 'Alta'], { message: 'Prioridade deve ser Baixa, Média ou Alta' })
  @IsOptional()
  prioridade?: string;

  @ApiProperty({ description: 'URL do portal', example: 'https://novoportal.com', nullable: true, required: false })
  @IsUrl({}, { message: 'URL inválida' })
  @IsOptional()
  url?: string | null;
}