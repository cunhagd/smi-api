import { IsString, Matches, MaxLength, IsEnum, IsIn } from 'class-validator';
import { Avaliacao } from '../../noticias/entities/noticia.entity';

export enum Tema {
  AGRICULTURA = 'Agricultura',
  SOCIAL = 'Social',
  SEGURANCA_PUBLICA = 'Segurança Pública',
  SAUDE = 'Saúde',
  POLITICA = 'Política',
  MEIO_AMBIENTE = 'Meio Ambiente',
  INFRAESTRUTURA = 'Infraestrutura',
  EDUCACAO = 'Educação',
  ECONOMIA = 'Economia',
  CULTURA = 'Cultura',
}

export class CreateNoticiaPostagemDto {
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'Data deve estar no formato DD/MM/AAAA',
  })
  data: string;

  @IsString()
  @MaxLength(255, { message: 'Título deve ter no máximo 255 caracteres' })
  titulo: string;

  @IsString()
  @MaxLength(49000, { message: 'Corpo deve ter no máximo 49.000 caracteres' })
  corpo: string;

  @IsString()
  @MaxLength(2048, { message: 'Link deve ter no máximo 2048 caracteres' })
  link: string;

  @IsString()
  portal: string;

  @IsEnum(Tema, { message: 'Tema inválido' })
  tema: Tema;

  @IsEnum(Avaliacao, { message: 'Avaliação inválida' })
  avaliacao: Avaliacao;

  @IsIn(['Sim', 'Não'], { message: 'Estratégica deve ser "Sim" ou "Não"' })
  estrategica: 'Sim' | 'Não';
}