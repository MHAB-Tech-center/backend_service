import { Global, Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionPlan } from 'src/entities/InspectionPlan.entity';
import { Category } from 'src/entities/category.entity';
import { InspectionRecord } from 'src/entities/inspection-record.entity';
import { InspectionIdentification } from 'src/entities/inspection-identification.entity';
import { SummaryReport } from 'src/entities/summary-report.entity';
import { CoordinatesModule } from '../coordinates/coordinates.module';

@Global()
@Module({
  providers: [InspectionsService],
  imports: [
    TypeOrmModule.forFeature([
      InspectionPlan,
      Category,
      InspectionRecord,
      InspectionIdentification,
      SummaryReport,
    ]),
    CoordinatesModule,
  ],
  controllers: [InspectionsController],
  exports: [InspectionsService],
})
export class InspectionsModule {}
