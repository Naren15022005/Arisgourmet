import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Pedido } from './pedido.entity';

@Entity()
export class HistorialEstadoPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pedido, { nullable: false })
  pedido: Pedido;

  @Column()
  pedido_id: string;

  @Column()
  estado_anterior: string;

  @Column()
  estado_nuevo: string;

  @Column({ nullable: true })
  nota: string;

  @CreateDateColumn()
  created_at: Date;
}
