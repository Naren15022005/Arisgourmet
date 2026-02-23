import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from './role.entity';

@Entity({ name: 'permiso' })
export class Permiso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clave', unique: true, length: 255 })
  clave: string;

  @Column({ nullable: true })
  descripcion?: string;

  @ManyToMany(() => Role, (role) => role.permisos)
  roles: Role[];
}
