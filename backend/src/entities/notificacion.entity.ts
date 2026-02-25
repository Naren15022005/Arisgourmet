import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'notificacion' })
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tipo: string;

  @Column('text')
  mensaje: string;

  @Column({ nullable: true })
  usuario_id: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  leido: boolean;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
