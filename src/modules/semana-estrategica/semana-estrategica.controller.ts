import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Delete,
    Param,
    UsePipes,
    ValidationPipe,
    ParseIntPipe,
  } from '@nestjs/common';
  import { SemanaEstrategicaService } from './semana-estrategica.service';
  import { CreateSemanaEstrategicaDto } from './dto/create-semana-estrategica.dto';
  import { UpdateSemanaEstrategicaDto } from './dto/update-semana-estrategica.dto';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiParam,
  } from '@nestjs/swagger';
  import { SemanaEstrategica } from './entities/semana-estrategica.entity';
  
  @ApiTags('semana-estrategica')
  @Controller('semana-estrategica')
  export class SemanaEstrategicaController {
    constructor(
      private readonly semanaEstrategicaService: SemanaEstrategicaService,
    ) {}
  
    @Get()
    @ApiOperation({ summary: 'Listar todas as semanas estratégicas' })
    @ApiResponse({
      status: 200,
      description: 'Lista de semanas estratégicas',
      type: [SemanaEstrategica],
    })
    findAll() {
      return this.semanaEstrategicaService.findAll();
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
      return this.semanaEstrategicaService.remove(+id);
    }
  
    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Cadastrar uma nova semana estratégica' })
    @ApiBody({ type: CreateSemanaEstrategicaDto })
    @ApiResponse({
      status: 201,
      description: 'Semana estratégica criada',
      type: SemanaEstrategica,
    })
    @ApiResponse({ status: 400, description: 'Requisição inválida' })
    create(@Body() createDto: CreateSemanaEstrategicaDto) {
      return this.semanaEstrategicaService.create(createDto);
    }
  
    @Put(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Atualizar uma semana estratégica por ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID da semana estratégica' })
    @ApiBody({ type: UpdateSemanaEstrategicaDto })
    @ApiResponse({
      status: 200,
      description: 'Semana estratégica atualizada',
      type: SemanaEstrategica,
    })
    @ApiResponse({ status: 400, description: 'Requisição inválida' })
    @ApiResponse({ status: 404, description: 'Semana estratégica não encontrada' })
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateDto: UpdateSemanaEstrategicaDto,
    ) {
      return this.semanaEstrategicaService.update(id, updateDto);
    }
  }