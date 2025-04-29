import { BaseEntity } from 'src/db/base-entity';
import { MineSite } from './minesite.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Inspector } from './inspector.entity';
import { InspectionReview } from './inspection-review.entity';
import { InspectionIdentification } from './inspection-identification.entity';
import { SummaryReport } from './summary-report.entity';
import { EInspectionStatus } from 'src/common/Enum/EInspectionStatus.enum';

@Entity('inspection_plans')
export class InspectionPlan extends BaseEntity {
  @ManyToOne(() => MineSite)
  minesiteInfo: MineSite;

  @ManyToOne(() => Inspector)
  @JoinColumn({ name: 'inspector_id' })
  inspectorInfo: Inspector;

  @OneToOne(() => InspectionIdentification)
  @JoinColumn({ name: 'identification_id' })
  identification: InspectionIdentification;

  @OneToOne(() => SummaryReport)
  @JoinColumn({ name: 'summary_id' })
  summaryReport: SummaryReport;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  year: number;

  @Column({
    name: 'status',
    nullable: true,
  })
  status: EInspectionStatus;

  @OneToMany(() => InspectionReview, (review) => review.inspectionPlan, {
    eager: false,
  })
  reviews: InspectionReview[];

  constructor(
    startDate: Date,
    endDate: Date,
    inspector: Inspector,
    minesite: MineSite,
  ) {
    super();
    this.startDate = startDate;
    this.endDate = endDate;
    this.inspectorInfo = inspector;
    this.minesiteInfo = minesite;
    this.status = EInspectionStatus[EInspectionStatus.IN_PROGRESS];
  }
}
