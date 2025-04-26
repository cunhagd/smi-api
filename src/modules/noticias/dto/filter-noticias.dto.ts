import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { Avaliacao } from '../entities/noticia.entity';

export class FilterNoticiasDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? value : value))
  from?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? value : value))
  to?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? value : value))
  date?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Util', 'Lixo', 'Neutro'])
  utilidade?: 'Util' | 'Lixo' | 'Neutro';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  estrategica?: boolean;

  @IsOptional()
  @IsString()
  tema?: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  portal?: string;

  @IsOptional()
  @IsIn([Avaliacao.POSITIVA, Avaliacao.NEGATIVA, Avaliacao.NEUTRA, null, ''])
  @Transform(({ value }) => (value === '' ? value : value))
  avaliacao?: Avaliacao | null | '';
}
