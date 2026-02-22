import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'token_hash', length: 255 })
  token_hash: string;

  @Column({ default: false })
  revoked: boolean;

  @Column({ name: 'replaced_by_token_id', type: 'bigint', nullable: true })
  replaced_by_token_id?: string | null;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expires_at?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
