import { BaseEntity } from 'src/db/base-entity';
import { Column, Entity } from 'typeorm';

@Entity('sections')
export class Section extends BaseEntity {
  @Column({ name: 'title', unique: true })
  title: string;
  @Column({ nullable: true })
  flagStandard: string;

  constructor(title: string, flagStandard: string) {
    super();
    this.title = title;
    this.flagStandard = flagStandard;
  }
}
