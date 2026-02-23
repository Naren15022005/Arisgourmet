import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Pedido } from './pedido.entity';

@Entity({ name: 'pedido_items' })
export class ItemPedido {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ManyToOne(() => Pedido, (pedido) => pedido.items, { nullable: false })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ name: 'producto_id', type: 'bigint', unsigned: true })
  producto_id: number;

  @Column({ type: 'int', default: 1 })
  cantidad: number;

  @Column({ name: 'price_cents', type: 'bigint', unsigned: true })
  price_cents: number; // stored as cents

  @Column({ name: 'restaurante_id', type: 'bigint', unsigned: true, nullable: true })
  restaurante_id?: number | null;
}
