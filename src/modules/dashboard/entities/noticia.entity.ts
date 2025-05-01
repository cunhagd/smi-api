import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'noticias' })
export class Noticia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  data: string;

  @Column({ nullable: true })
  titulo: string;

  @Column({ nullable: true })
  corpo: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  autor: string;

  @Column({ nullable: true })
  abrangencia: string;

  @Column({ nullable: true })
  pontos: number;

  @Column({ nullable: true })
  obrigatorias: string;

  @Column({ nullable: true })
  adicionais: string;

  @Column({ nullable: true })
  portal: string;

  @Column({ nullable: true })
  tema: string;

  @Column({ nullable: true })
  avaliacao: string;

  @Column({ nullable: true })
  cita_gov: boolean;

  @Column({ nullable: true })
  relatorio: boolean;

  @Column({ nullable: true })
  relevancia: boolean;

  @Column({ nullable: true })
  pontos_new: number;

  @Column({ nullable: true })
  estrategica: boolean;

  @Column({ nullable: true })
  categoria: string;

  @Column({ nullable: true })
  subcategoria: string;

  @Column({ nullable: true })
  link_ideia: string;

  @Column({ nullable: true })
  ideiafixa: boolean;
}