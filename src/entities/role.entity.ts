/* eslint-disable */
/*
 @auhor : © 2024 Valens Niyonsenga <valensniyonsenga2003@gmail.com>
*/

/**
 * @file
 * @brief Role entity
 */
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InitiatorAudit } from 'src/audits/Initiator.audit';
import { Profile } from './profile.entity';

@Entity('roles')
export class Role extends InitiatorAudit {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: true })
  role_name: String;
  @ManyToMany(() => Profile)
  users: Profile[];
}
