import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Mesa } from './mesa.entity';

@Entity({ name: 'mesa_sesion' })
export class MesaSesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Mesa, { nullable: false })
  mesa: Mesa;

  @Column()
  mesa_id: string;

  @Column({ nullable: true })
  cliente_nombre: string;

  @Column({ type: 'datetime', nullable: true })
  inicio_at: Date;

  @Column({ type: 'datetime', nullable: true })
  fin_at: Date;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
