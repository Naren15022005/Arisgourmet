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

@Entity({ name: 'pedido' })
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mesa_id', type: 'varchar', length: 255 })
  mesa_id: string;

  @Column({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true })
  restaurante_id?: string | null;

  @Column({ type: 'enum', enum: PedidoEstado, default: PedidoEstado.PENDIENTE })
  estado: PedidoEstado;

  @OneToMany(() => ItemPedido, (item) => item.pedido, { cascade: true })
  items: ItemPedido[];

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updated_at: Date;
}
