import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Avaliacao {
  POSITIVA = 'Positiva',
  NEGATIVA = 'Negativa',
  NEUTRA = 'Neutra',
}

@Entity('lixeira')
export class Lixeira {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  relevancia: string | null;

  @Column({ type: 'text' })
  data: string;

  @Column({ type: 'text' })
  portal: string;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  tema: string | null;

  @Column({ type: 'text', nullable: true })
  avaliacao: string | null;

  @Column({ type: 'integer' })
  pontos: number;

  @Column({ type: 'boolean', default: false })
  estrategica: boolean;

  @Column({ type: 'text' })
  link: string;

  @Column({ type: 'text', nullable: true })
  autor: string | null;

  @Column({ type: 'integer', default: 0 })
  pontos_new: number;

  @Column({ type: 'text', nullable: true })
  categoria: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  subcategoria: string | null;

  @Column({ type: 'integer', nullable: true })
  ciclo: number | null;
}