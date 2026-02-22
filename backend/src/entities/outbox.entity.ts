import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'outbox' })
export class Outbox {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'aggregate_type', length: 100 })
  aggregate_type: string;

  @Column({ name: 'aggregate_id', length: 100, nullable: true })
  aggregate_id?: string | null;

  @Column({ name: 'event_type', length: 150 })
  event_type: string;

  @Column({ type: 'json', nullable: true })
  payload?: any;

  @Column({ default: false })
  processed: boolean;

  @Column({ name: 'processed_at', type: 'datetime', nullable: true })
  processed_at?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
