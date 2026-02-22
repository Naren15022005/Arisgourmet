import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Evento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tipo: string;

  @Column('text', { nullable: true })
  metadata: string;

  @CreateDateColumn()
  created_at: Date;
}
