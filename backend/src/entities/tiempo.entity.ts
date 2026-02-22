import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Tiempo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  producto_id: string;

  @Column({ type: 'int' })
  tiempo_base_minutos: number;

  @Column({ type: 'int', nullable: true })
  tiempo_estimado_actual_minutos: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  restaurante_id: string;
}
