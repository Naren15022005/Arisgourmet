import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column({ default: true })
  disponible: boolean;

  @Column({ type: 'int', default: 0 })
  tiempo_base_minutos: number;

  @Column({ nullable: true })
  restaurante_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
