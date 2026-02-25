import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Pedido } from './pedido.entity';

@Entity({ name: 'historial_estado_pedido' })
export class HistorialEstadoPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pedido, { nullable: false })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ name: 'pedido_id' })
  pedido_id: string;

  @Column()
  estado_anterior: string;

  @Column()
  estado_nuevo: string;

  @Column({ type: 'text', nullable: true })
  nota?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
