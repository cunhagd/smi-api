import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('portais')
export class Portal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'integer' })
  pontos: number;

  @Column({ type: 'text' })
  abrangencia: string;

  @Column({ type: 'text' })
  prioridade: string;

  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ type: 'text', nullable: true })
  nome2: string | null;

  @Column({ type: 'text', nullable: true })
  nome_modulo: string | null;
}