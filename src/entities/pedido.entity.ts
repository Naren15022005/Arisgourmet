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

@Entity()
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mesa_id: string;

  @Column({ nullable: true })
  restaurante_id: string;

  @Column({ type: 'enum', enum: PedidoEstado, default: PedidoEstado.PENDIENTE })
  estado: PedidoEstado;

  @OneToMany(() => ItemPedido, (item) => item.pedido, { cascade: true })
  items: ItemPedido[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
