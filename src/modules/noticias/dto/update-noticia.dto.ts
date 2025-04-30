import { IsOptional, IsBoolean, IsString, IsIn, IsInt, MaxLength } from 'class-validator';
import { Avaliacao } from '../entities/noticia.entity';

export class UpdateNoticiaDto {
  @IsOptional()
  @IsString()
  @IsIn(['Útil', 'Lixo', 'Suporte', null], {
    message: 'Relevância deve ser Útil, Lixo, Suporte ou nula',
  })
  relevancia?: string | null;

  @IsOptional()
  @IsString()
  @IsIn([
    'Agricultura',
    'Social',
    'Segurança Pública',
    'Saúde',
    'Política',
    'Meio Ambiente',
    'Infraestrutura',
    'Educação',
    'Economia',
    'Cultura',
    null,
  ], {
    message: 'Tema deve ser um dos valores permitidos ou nulo',
  })
  tema?: string | null;

  @IsOptional()
  @IsIn([Avaliacao.POSITIVA, Avaliacao.NEGATIVA, Avaliacao.NEUTRA, null], {
    message: 'Avaliação deve ser Positiva, Negativa, Neutra ou nula',
  })
  avaliacao?: Avaliacao | null;

  @IsOptional()
  @IsBoolean()
  estrategica?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['Educação', 'Social', 'Infraestrutura', 'Saúde', null], {
    message: 'Categoria deve ser Educação, Social, Infraestrutura, Saúde ou nula',
  })
  categoria?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(250, {
    message: 'Subcategoria não pode exceder 250 caracteres',
  })
  subcategoria?: string | null;

  @IsOptional()
  @IsInt()
  ciclo?: number | null;
}