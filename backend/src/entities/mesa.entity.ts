import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MesaEstado {
  LIBRE = 'libre',
  OCUPADA = 'ocupada',
  ACTIVA = 'activa',
  INACTIVA = 'inactiva',
  LIBERADA = 'liberada',
}

@Entity()
export class Mesa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo_qr: string;

  @Column({ type: 'enum', enum: MesaEstado, default: MesaEstado.LIBRE })
  estado: MesaEstado;

  @Column({ default: false })
  ocupado: boolean;

  @Column({ type: 'timestamp', nullable: true })
  ocupado_desde: Date;

  @Column({ nullable: true })
  ultima_actividad_at: Date;

  @Column({ nullable: true })
  restaurante_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
