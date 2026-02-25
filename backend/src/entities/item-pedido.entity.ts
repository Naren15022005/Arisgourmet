import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Pedido } from './pedido.entity';

@Entity({ name: 'item_pedido' })
export class ItemPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.items, { nullable: false })
  @JoinColumn({ name: 'pedidoId' })
  pedido: Pedido;

  @Column({ name: 'producto_id', type: 'varchar', length: 255 })
  producto_id: string;

  @Column({ type: 'int', default: 1 })
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2, transformer: { from: (v: any) => (v === null ? null : Number(v)), to: (v: any) => v } })
  precio_unitario: number;

  @Column({ name: 'pedidoId', type: 'varchar', length: 36, nullable: true })
  pedidoId?: string | null;

  @Column({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true })
  restaurante_id?: string | null;
}
