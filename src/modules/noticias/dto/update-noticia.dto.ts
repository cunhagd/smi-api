import { IsOptional, IsBoolean, IsString, IsIn } from 'class-validator';
import { Avaliacao } from '../entities/noticia.entity';

export class UpdateNoticiaDto {
  @IsOptional()
  @IsBoolean()
  relevancia?: boolean | null;

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
  ])
  tema?: string;

  @IsOptional()
  @IsIn([Avaliacao.POSITIVA, Avaliacao.NEGATIVA, Avaliacao.NEUTRA, null, ''], {
    message: 'Avaliação deve ser Positiva, Negativa, Neutra, nula ou vazia',
  })
  avaliacao?: Avaliacao | null | '';

  @IsOptional()
  @IsBoolean()
  estrategica?: boolean;
}