import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MesaEstado {
  LIBRE = 'libre',
  OCUPADA = 'ocupada',
  RESERVADA = 'reservada',
  ACTIVA = 'activa',
  INACTIVA = 'inactiva',
  LIBERADA = 'liberada',
}

@Entity({ name: 'mesa' })
export class Mesa {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true })
  restaurante_id: string | number;

  @Column({ name: 'codigo_qr', unique: true })
  codigo: string;

  @Column({ name: 'nombre', nullable: true, select: false })
  nombre?: string;

  @Column({ type: 'enum', enum: MesaEstado, default: MesaEstado.LIBRE })
  estado: MesaEstado;

  @Column({ type: 'json', nullable: true, select: false })
  metadata?: any;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
