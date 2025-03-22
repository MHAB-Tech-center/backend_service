import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Profile } from './profile.entity';
import { BaseEntity } from 'src/db/base-entity';

@Entity()
export abstract class Person extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'date', name: 'dob' })
  dob: Date;

  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string;

  @Column({ name: 'national_id', length: 50, unique: true })
  nationalId: string;

  @OneToOne(() => Profile)
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column({ nullable: true, length: 100 })
  province: string;

  @Column({ nullable: true, length: 100 })
  district: string;

  @Column({ nullable: true, length: 100 })
  sector: string;

  @Column({ nullable: true, length: 100 })
  cell: string;

  constructor(
    firstName: string,
    lastName: string,
    email: string,
    dob: Date,
    phoneNumber: string,
    nationalId: string,
    province?: string,
    district?: string,
    sector?: string,
    cell?: string,
  ) {
    super();
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.dob = dob;
    this.phoneNumber = phoneNumber;
    this.nationalId = nationalId;
    this.province = province;
    this.district = district;
    this.sector = sector;
    this.cell = cell;
    this.status = 'ACTIVE';
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email format');
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  validatePhoneNumber() {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(this.phoneNumber)) {
      throw new Error('Invalid phone number format');
    }
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  getAddress(): string {
    return [this.province, this.district, this.sector, this.cell]
      .filter(Boolean)
      .join(', ');
  }
}
