import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from './role.entity';

@Entity({ name: 'permisos' })
export class Permiso {
  @PrimaryGeneratedColumn({ type: 'smallint', unsigned: true })
  id: number;

  @Column({ name: 'nombre', unique: true, length: 100 })
  nombre: string;

  @Column({ nullable: true })
  descripcion?: string;

  @ManyToMany(() => Role, (role) => role.permisos)
  roles: Role[];
}
