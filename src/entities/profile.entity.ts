/* eslint-disable */
/*
 @auhor : © 2024 Valens Niyonsenga <valensniyonsenga2003@gmail.com>
*/

/**
 * @file
 * @brief User entity
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  TableInheritance,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { EAccountStatus } from '../common/Enum/EAccountStatus.enum';
import { Role } from 'src/entities/role.entity';
import { InitiatorAudit } from 'src/audits/Initiator.audit';
import { UUID } from 'crypto';
import { ELoginStatus } from 'src/common/Enum/ELoginStatus.enum';
import { RMBRole } from './RMBRole.entity';

@Entity('users')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Profile extends InitiatorAudit {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column({ unique: true })
  email: String;

  @Column({
    nullable: true,
    default: null,
  })
  last_login: Date;

  @Column({
    name: 'profile_picture',
    nullable: true,
  })
  profile_pic: string;

  @Column({
    nullable: true,
  })
  password: String;

  @Column({
    nullable: true,
  })
  activationCode: number;

  @Column()
  status: String;
  @Column({ nullable: true })
  loginStatus: String;

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];

  constructor(email: String, password: string) {
    super();
    this.email = email;
    this.password = password;
    this.loginStatus =
      ELoginStatus.FOR_VERIFICATION[ELoginStatus.FOR_VERIFICATION];
    // this.profile_pic=this.profile_pic
    this.status = EAccountStatus[EAccountStatus.WAIT_EMAIL_VERIFICATION];
  }
}
