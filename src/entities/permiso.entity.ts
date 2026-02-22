import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from './role.entity';

@Entity()
export class Permiso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  clave: string;

  @Column({ nullable: true })
  descripcion: string;

  @ManyToMany(() => Role, (role) => role.permisos)
  roles: Role[];
}
