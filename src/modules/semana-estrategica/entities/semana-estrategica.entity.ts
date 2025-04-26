import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('semana_estrategica')
export class SemanaEstrategica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  data_inicial: string;

  @Column({ type: 'text' })
  data_final: string;

  @Column({ type: 'integer' })
  ciclo: number;

  @Column({ type: 'text' })
  categoria: string;

  @Column({ type: 'varchar', length: 250 })
  subcategoria: string;
}