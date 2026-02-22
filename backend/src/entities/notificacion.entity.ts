import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tipo: string;

  @Column('text')
  mensaje: string;

  @Column({ nullable: true })
  usuario_id: string;

  @Column({ default: false })
  leido: boolean;

  @CreateDateColumn()
  created_at: Date;
}
