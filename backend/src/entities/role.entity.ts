import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Permiso } from './permiso.entity';

@Entity({ name: 'role' })
export class Role {
  @PrimaryGeneratedColumn({ type: 'smallint', unsigned: true })
  id: number;

  @Column({ unique: true })
  nombre: string;

  @ManyToMany(() => Permiso, (permiso) => permiso.roles, { cascade: true })
  @JoinTable({ name: 'role_permisos', joinColumn: { name: 'role_id' }, inverseJoinColumn: { name: 'permiso_id' } })
  permisos: Permiso[];
}
