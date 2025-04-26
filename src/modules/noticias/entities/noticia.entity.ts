import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Avaliacao {
  POSITIVA = 'Positiva',
  NEGATIVA = 'Negativa',
  NEUTRA = 'Neutra',
}

@Entity('noticias')
export class Noticia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', nullable: true })
  relevancia: boolean;

  @Column({ type: 'text' })
  data: string;

  @Column({ type: 'text' })
  portal: string;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  tema: string;

  @Column({ type: 'text', nullable: true })
  avaliacao: string;

  @Column({ type: 'integer' })
  pontos: number;

  @Column({ type: 'boolean', default: false })
  estrategica: boolean;

  @Column({ type: 'text' })
  link: string;

  @Column({ type: 'text', nullable: true })
  autor: string;

  @Column({ type: 'integer', default: 0 })
  pontos_new: number;

  @Column({ type: 'text', nullable: true })
  categoria: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  subcategoria: string | null;
}