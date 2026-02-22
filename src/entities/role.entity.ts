import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Permiso } from './permiso.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @ManyToMany(() => Permiso, (permiso) => permiso.roles, { cascade: true })
  @JoinTable({ name: 'role_permisos' })
  permisos: Permiso[];
}
