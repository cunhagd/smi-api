import {
    IsString,
    IsInt,
    Min,
    IsNotEmpty,
    IsOptional,
    IsIn,
    MaxLength,
  } from 'class-validator';
  
  export class CreateSemanaEstrategicaDto {
    @IsNotEmpty()
    @IsString()
    data_inicial: string;
  
    @IsNotEmpty()
    @IsString()
    data_final: string;
  
    @IsNotEmpty()
    @IsInt()
    @Min(20)
    ciclo: number;
  
    @IsOptional()
    @IsString()
    @IsIn(['Educação', 'Gestão', 'Infraestrutura', 'Saúde'])
    categoria?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(250)
    subcategoria?: string;
  }