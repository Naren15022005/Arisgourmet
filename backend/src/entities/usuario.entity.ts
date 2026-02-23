import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 200 })
  email: string;

  @Column({ nullable: true, length: 200 })
  nombre?: string;

  @Column({ length: 255 })
  password_hash: string;

  @Column({ name: 'role', type: 'enum', enum: ['cliente', 'cocina', 'host', 'admin'], default: 'cliente' })
  role: string;

  @Column({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true })
  restaurante_id?: string | null;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updated_at: Date;
}
