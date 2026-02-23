import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'producto' })
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  nombre: string;

  @Column('text', { nullable: true })
  descripcion?: string;

  @Column({ name: 'precio', type: 'decimal', precision: 10, scale: 2, transformer: { from: (v: any) => (v === null ? null : Number(v)), to: (v: any) => v } })
  precio: number; // decimal in DB

  @Column({ type: 'tinyint', width: 1, default: 1 })
  disponible: boolean;

  @Column({ type: 'int', default: 0 })
  tiempo_base_minutos: number;

  @Column({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true })
  restaurante_id?: string | null;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updated_at: Date;
}
