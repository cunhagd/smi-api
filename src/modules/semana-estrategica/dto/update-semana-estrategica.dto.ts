import {
    IsOptional,
    IsString,
    IsInt,
    Min,
    IsIn,
    MaxLength,
  } from 'class-validator';
  
  export class UpdateSemanaEstrategicaDto {
    @IsOptional()
    @IsString()
    data_inicial?: string;
  
    @IsOptional()
    @IsString()
    data_final?: string;
  
    @IsOptional()
    @IsInt()
    @Min(1)
    ciclo?: number;
  
    @IsOptional()
    @IsString()
    @IsIn(['Educação', 'Social', 'Infraestrutura', 'Saúde'])
    categoria?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(250)
    subcategoria?: string;
  }