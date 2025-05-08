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
  @Transform(({ value }) => {
    if (value === 'null' || value === '') return null;
    if (typeof value === 'string') {
      const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      return ['Útil', 'Lixo', 'Suporte'].includes(formattedValue) ? formattedValue : undefined;
    }
    return value;
  })
  @IsIn(['Útil', 'Lixo', 'Suporte', null], {
    message: 'Relevância deve ser Útil, Lixo, Suporte ou null',
  })
  relevancia?: 'Útil' | 'Lixo' | 'Suporte' | null;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    console.log(`Valor bruto de estrategica: ${value}, tipo: ${typeof value}`); // Log temporário para depuração
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    } else if (typeof value === 'boolean') {
      return value; // Aceita true/false diretamente
    }
    return undefined;
  })
  estrategica?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    } else if (typeof value === 'boolean') {
      return value;
    }
    return undefined;
  })
  all?: boolean;

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
  @IsIn([Avaliacao.POSITIVA, Avaliacao.NEGATIVA, Avaliacao.NEUTRA, null])
  @Transform(({ value }) => (value === '' ? null : value))
  avaliacao?: Avaliacao | null;
}