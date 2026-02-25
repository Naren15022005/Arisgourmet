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

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  last_error?: string | null;

  @Column({ name: 'next_retry_at', type: 'datetime', nullable: true })
  next_retry_at?: Date | null;

  @Column({ name: 'dlq', type: 'boolean', default: false })
  dlq: boolean;

  @Column({ name: 'dlq_reason', type: 'text', nullable: true })
  dlq_reason?: string | null;

  @Column({ name: 'processed_at', type: 'datetime', nullable: true })
  processed_at?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
