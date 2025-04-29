import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { Avaliacao } from '../entities/noticia.entity';

export class FilterNoticiasDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  from?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  to?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  date?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  before?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  after?: string;

  @IsOptional()
  @IsString()
  @IsIn(['util', 'lixo', 'suporte'])
  relevancia?: 'Útil' | 'Lixo' | 'Suporte';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
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
  @Transform(({ value }) => (value === '' ? null : value))
  avaliacao?: Avaliacao | null;
}