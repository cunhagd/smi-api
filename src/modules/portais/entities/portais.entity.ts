import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('portais')
export class Portal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  nome: string;

  @Column({ type: 'integer', nullable: true })
  pontos: number;

  @Column({ type: 'text', nullable: true })
  abrangencia: string;

  @Column({ type: 'text', nullable: true })
  prioridade: string;

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({ type: 'text', nullable: true })
  nome2: string;

  @Column({ type: 'text', nullable: true })
  nome_modulo: string;
}