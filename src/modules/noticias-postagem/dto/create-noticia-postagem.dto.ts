import { IsString, Matches, MaxLength, IsEnum, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Data da notícia no formato DD/MM/AAAA', example: '26/05/2025' })
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'Data deve estar no formato DD/MM/AAAA',
  })
  data: string;

  @ApiProperty({ description: 'Título da notícia', example: 'Notícia de Teste' })
  @IsString()
  @MaxLength(255, { message: 'Título deve ter no máximo 255 caracteres' })
  titulo: string;

  @ApiProperty({ description: 'Corpo da notícia', example: 'Conteúdo da notícia aqui...' })
  @IsString()
  @MaxLength(49000, { message: 'Corpo deve ter no máximo 49.000 caracteres' })
  corpo: string;

  @ApiProperty({ description: 'Link da notícia', example: 'https://exemplo.com/noticia' })
  @IsString()
  @MaxLength(2048, { message: 'Link deve ter no máximo 2048 caracteres' })
  link: string;

  @ApiProperty({ description: 'Nome do portal', example: 'O Tempo' })
  @IsString()
  portal: string;

  @ApiProperty({ description: 'Tema da notícia', enum: Tema, example: 'Educação' })
  @IsEnum(Tema, { message: 'Tema inválido' })
  tema: Tema;

  @ApiProperty({ description: 'Avaliação da notícia', enum: Avaliacao, example: 'Positiva' })
  @IsEnum(Avaliacao, { message: 'Avaliação inválida' })
  avaliacao: Avaliacao;

  @ApiProperty({ description: 'Indica se a notícia é estratégica', enum: ['Sim', 'Não'], example: 'Sim' })
  @IsIn(['Sim', 'Não'], { message: 'Estratégica deve ser "Sim" ou "Não"' })
  estrategica: 'Sim' | 'Não';

  @ApiProperty({ description: 'Relevância da notícia', enum: ['Útil', 'Suporte'], example: 'Útil' })
  @IsString()
  @IsNotEmpty({ message: 'Relevância é obrigatória' })
  @IsIn(['Útil', 'Suporte'], { message: 'Relevância deve ser Útil ou Suporte' })
  relevancia: string;
}