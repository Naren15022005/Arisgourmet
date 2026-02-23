import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'tiempo' })
export class Tiempo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  producto_id: string;

  @Column({ type: 'int' })
  tiempo_base_minutos: number;

  @Column({ type: 'int', nullable: true })
  tiempo_estimado_actual_minutos?: number | null;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  created_at: Date;

  @Column({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true })
  restaurante_id?: string | null;
}
