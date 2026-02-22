import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Mesa } from './mesa.entity';

@Entity()
export class MesaSesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Mesa, { nullable: false })
  mesa: Mesa;

  @Column()
  mesa_id: string;

  @Column({ nullable: true })
  cliente_nombre: string;

  @Column({ type: 'timestamp', nullable: true })
  inicio_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  fin_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
