import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ItemPedido } from './item-pedido.entity';

export enum PedidoEstado {
  PENDIENTE = 'pendiente',
  ACEPTADO = 'aceptado',
  PREPARANDO = 'preparando',
  LISTO = 'listo',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
}

@Entity({ name: 'pedidos' })
export class Pedido {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'mesa_id', type: 'bigint', unsigned: true, nullable: true })
  mesa_id?: number | null;

  @Column({ name: 'restaurante_id', type: 'bigint', unsigned: true })
  restaurante_id: number;

  @Column({ type: 'enum', enum: PedidoEstado, default: PedidoEstado.PENDIENTE })
  estado: PedidoEstado;

  @OneToMany(() => ItemPedido, (item) => item.pedido, { cascade: true })
  items: ItemPedido[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
