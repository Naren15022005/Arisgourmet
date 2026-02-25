import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MesaEstado {
  LIBRE = 'libre',
  OCUPADA = 'ocupada',
  ACTIVA = 'activa',
  INACTIVA = 'inactiva',
  LIBERADA = 'liberada',
}

@Entity({ name: 'mesa' })
export class Mesa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true })
  restaurante_id?: string | null;

  @Column({ name: 'codigo_qr', unique: true })
  codigo: string;

  @Column({ type: 'enum', enum: MesaEstado, default: MesaEstado.LIBRE })
  estado: MesaEstado;

  @Column({ name: 'ultima_actividad_at', type: 'datetime', nullable: true })
  ultima_actividad_at?: Date | null;

  @Column({ name: 'ocupado', type: 'tinyint', default: 0 })
  ocupado: number;

  @Column({ name: 'ocupado_desde', type: 'timestamp', nullable: true })
  ocupado_desde?: Date | null;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updated_at: Date;
}
