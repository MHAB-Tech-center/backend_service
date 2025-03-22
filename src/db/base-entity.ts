import { ApiProperty } from '@nestjs/swagger';
import {
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';

export class BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  // Common utility methods
  public isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  public isDeleted(): boolean {
    return !!this.deletedAt;
  }

  public softDelete(): void {
    this.deletedAt = new Date();
    this.status = 'DELETED';
  }

  public restore(): void {
    this.deletedAt = null;
    this.status = 'ACTIVE';
  }
}
