import { IsOptional, IsBoolean, IsString, IsIn } from 'class-validator';
import { Avaliacao } from '../entities/noticia.entity';

export class UpdateNoticiaDto {
  @IsOptional()
  @IsString()
  @IsIn(['util', 'lixo', 'suporte', null], {
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
  estrategica?: boolean | null;
}