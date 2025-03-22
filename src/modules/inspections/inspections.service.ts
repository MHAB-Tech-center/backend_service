import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateInspectionDTO } from 'src/common/dtos/inspections/create-inspection.dto';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { InspectionPlan } from 'src/entities/InspectionPlan.entity';
import { Repository } from 'typeorm';
import { MinesiteService } from '../minesite/minesite.service';
import { UtilsService } from 'src/utils/utils.service';
import { Request } from 'express';
import { Inspector } from 'src/entities/inspector.entity';
import { InspectorsService } from '../inspectors/inspectors.service';
import { Profile } from 'src/entities/profile.entity';
import { SectionsService } from '../sections/sections.service';
import { CreateRecordDTO } from 'src/common/dtos/inspections/create-record.dto';
import { Category } from 'src/entities/category.entity';
import { InspectionRecord } from 'src/entities/inspection-record.entity';
import { CreateInspectionPlanDTO } from 'src/common/dtos/inspections/create-inspection-plan.dto';
import { UUID } from 'crypto';
import { CategoriesService } from '../categories/categories.service';
import { EInspectionStatus } from 'src/common/Enum/EInspectionStatus.enum';
import { EditInspectionRecordDTO } from 'src/common/dtos/inspections/edit-inspection.dto';
import { EditManyInspectionRecordsDTO } from 'src/common/dtos/inspections/edit-many-inspections-records.dto';
import { ReviewInspectionPlanDTO } from 'src/common/dtos/inspections/review-inspection-plan.dto';
import { MailingService } from 'src/integrations/mailing/mailing.service';
import { InspectionReview } from 'src/entities/inspection-review.entity';
import { ReviewsService } from '../reviews/reviews.service';
import { InspectionIdentification } from 'src/entities/inspection-identification.entity';
import { SummaryReport } from 'src/entities/summary-report.entity';
import { CoordinatesService } from 'src/modules/coordinates/coordinates.service';
import { InspectionsResponseDTO } from 'src/common/dtos/responses/inspections-response.dto';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(InspectionPlan)
    private readonly inspectionPlanRepository: Repository<InspectionPlan>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(InspectionIdentification)
    private readonly identificationRepository: Repository<InspectionIdentification>,
    @InjectRepository(SummaryReport)
    private readonly summaryReportRepository: Repository<SummaryReport>,
    @InjectRepository(InspectionRecord)
    private readonly recordRepository: Repository<InspectionRecord>,
    private categoryService: CategoriesService,
    private minesiteService: MinesiteService,
    private utilService: UtilsService,
    private inspectorService: InspectorsService,
    private sectionService: SectionsService,
    private mailingService: MailingService,
    private reviewService: ReviewsService,
    private coordinateService: CoordinatesService,
  ) {}

  async createInspectionPlan(request: Request, dto: CreateInspectionPlanDTO) {
    const mineSite = await this.minesiteService.getById(dto.minesiteId);
    const loggedInUser: Profile = await this.utilService.getLoggedInProfile(
      request,
    );
    const inspector: Inspector = await this.inspectorService.findByEmail(
      loggedInUser.email.toString(),
    );
    const inspectionPlanEntity = new InspectionPlan(
      dto.startDate,
      dto.endDate,
      inspector,
      mineSite,
    );
    const inspectionPlan = await this.inspectionPlanRepository.save(
      inspectionPlanEntity,
    );
    return new ApiResponse(
      true,
      'Inspection plan was created successfully',
      inspectionPlan,
    );
  }

  async getRecordByCategoryAndPseudoName(
    category: Category,
    pseudoName: string,
  ) {
    const record = await this.recordRepository.findOne({
      where: { category: { id: category.id }, pseudoName: pseudoName },
    });
    return record;
  }
  // Create a new inspection plan
  async create(dto: CreateInspectionDTO): Promise<ApiResponse> {
    let inspectionPlan = await this.inspectionPlanRepository.findOne({
      where: { id: dto.inspectionPlanId },
    });
    dto.records.forEach(async (record: CreateRecordDTO) => {
      const section = await this.sectionService.findSectionById(
        record.category.sectionId,
      );
      if (!section) {
        throw new NotFoundException(
          'Make sure the section is not null or undefined on all categories',
        );
      }
      const categoryEntity = new Category(
        record.category.title,
        inspectionPlan,
        null,
      );
      categoryEntity.section = section;
      let category: Category;
      if (
        !(await this.categoryService.existsByTitleInspectionPlan(
          record.category.title,
          dto.inspectionPlanId,
        ))
      ) {
        category = await this.categoryRepository.save(categoryEntity);
      } else {
        category = await this.categoryService.findByTitleInspectionPlan(
          record.category.title,
          dto.inspectionPlanId,
        );
      }
      let inspectionRecord = await this.getRecordByCategoryAndPseudoName(
        category,
        record.pseudoName,
      );
      // Check if the record exist
      if (!inspectionRecord) {
        // create new record
        inspectionRecord = new InspectionRecord(
          record.title,
          record.boxValue,
          record.flagValue,
          category,
        );
      } else {
        // Update the existing record
        inspectionRecord.boxValue = record.boxValue;
        inspectionRecord.flagValue = record.flagValue;
        inspectionRecord.title = record.title;
      }
      // Check the pseudoName

      inspectionRecord.pseudoName = record.pseudoName;
      inspectionRecord = this.utilService.rankInspectionRecord(
        inspectionRecord,
        category,
      );
      if (record.flagValue) {
        record.flagValue.toLowerCase() == 'red'
          ? (inspectionRecord.marks = 40)
          : record.flagValue.toLowerCase() == 'green'
          ? (inspectionRecord.marks = 85)
          : (inspectionRecord.marks = 60);
      }
      await this.recordRepository.save(inspectionRecord);
    });
    let identification = await this.identificationRepository.save(
      this.utilService.getIdentificationIdentity(dto),
    );
    identification.coordinates = await this.coordinateService.saveCoordinate(
      dto.identification.coordinates,
    );
    identification = await this.identificationRepository.save(identification);
    const summaryReport = await this.summaryReportRepository.save(
      this.utilService.getSummaryReportEntity(dto),
    );
    // Change the status to submitted
    console.log(inspectionPlan);
    inspectionPlan.status = EInspectionStatus[EInspectionStatus.SUBMITTED];
    inspectionPlan.summaryReport = summaryReport;
    inspectionPlan.identification = identification;
    await this.inspectionPlanRepository.save(inspectionPlan);
    inspectionPlan = await this.getInspectionPlan(inspectionPlan.id);
    return new ApiResponse(
      true,
      'The inspection records were created successfully',
      inspectionPlan,
    );
  }
  async findRecordByCategoryAndPseudoName(
    category: Category,
    pseudoName: string,
  ) {
    const record = await this.recordRepository.findOne({
      where: {
        category: { id: category.id },
        pseudoName: pseudoName,
      },
    });
    if (!record)
      throw new NotFoundException(
        'The record with the provided pseudoName and category is not found',
      );
    return record;
  }

  async editInspectionRecord(dto: EditInspectionRecordDTO) {
    const category = await this.categoryService.findById(dto.categoryId);
    const recordEntity = await this.findRecordByCategoryAndPseudoName(
      category,
      dto.pseudoName,
    );
    recordEntity.boxValue = dto.data.boxValue;
    recordEntity.flagValue = dto.data.flagValue;
    recordEntity.title = dto.data.title;
    recordEntity.marks = this.utilService.getRecordRank(recordEntity.flagValue);
    return await this.recordRepository.save(recordEntity);
  }
  async editManyInspectionRecords(dto: EditManyInspectionRecordsDTO) {
    dto.data.forEach(async (recordDTO) => {
      const category = await this.categoryService.findById(
        recordDTO.categoryId,
      );
      const recordEntity = await this.findRecordByCategoryAndPseudoName(
        category,
        recordDTO.pseudoName,
      );
      recordEntity.boxValue = recordDTO.data.boxValue;
      recordEntity.flagValue = recordDTO.data.flagValue;
      recordEntity.title = recordDTO.data.title;
      recordEntity.marks = this.utilService.getRecordRank(
        recordEntity.flagValue,
      );
      await this.recordRepository.save(recordEntity);
    });
    return 'All records were updated successfully';
  }
  async reviewInspectionPlan(dto: ReviewInspectionPlanDTO) {
    const inspectionPlan: InspectionPlan = await this.getInspectionPlan(
      dto.planId,
    );
    inspectionPlan.status = EInspectionStatus[EInspectionStatus.REVIEWED];
    const reviews: InspectionReview[] = inspectionPlan.reviews
      ? inspectionPlan.reviews
      : [];

    const review: InspectionReview = await this.reviewService.saveReview(
      dto.reviewMessage,
      inspectionPlan,
    );
    reviews.push(review);
    inspectionPlan.reviews = reviews;
    const plan: InspectionPlan = await this.inspectionPlanRepository.save(
      inspectionPlan,
    );
    // sednd an email
    await this.mailingService.sendEmail(
      '',
      'review',
      inspectionPlan.inspectorInfo.lastName,
      inspectionPlan.inspectorInfo.profile,
      review.comment,
      inspectionPlan.inspectorInfo.email,
    );
    return null;
  }
  async getInspectionPlanByStatus(status: string) {
    const inspectionStatus: EInspectionStatus =
      await this.utilService.getInspectionStatus(status);
    const inspectionPlans = await this.inspectionPlanRepository.find({
      where: { status: inspectionStatus },
    });
    return inspectionPlans;
  }
  async getInspectionPlan(planId: any) {
    const inspectionPlan: InspectionPlan =
      await this.inspectionPlanRepository.findOne({
        where: { id: planId },
        relations: [
          'minesiteInfo',
          'inspectorInfo',
          'identification',
          'identification.coordinates',
          'summaryReport',
        ],
      });
    if (!inspectionPlan)
      throw new NotFoundException(
        'The inspection plan witht the provided Id is not found',
      );
    return inspectionPlan;
  }
  async getCategoriesReportInspectionPlan(planId: UUID): Promise<Category[]> {
    const inspectionPlan: any = await this.getInspectionPlan(planId);
    const categoryList: Category[] = await this.categoryRepository.find({
      where: {
        inspectionPlan: { id: inspectionPlan.id },
      },
      relations: [
        'section',
        'records',
        'inspectionPlan',
        'inspectionPlan.identification',
        'inspectionPlan.summaryReport',
      ],
    });
    categoryList.forEach((category: Category) => {
      category.inspectionPlan = null;
    });
    return categoryList;
  }
  async getCategoriesInspectionPlan(
    planId: UUID,
  ): Promise<InspectionsResponseDTO> {
    const inspectionPlan: InspectionPlan = await this.getInspectionPlan(planId);
    const categoryList: Category[] = await this.categoryRepository.find({
      where: {
        inspectionPlan: { id: inspectionPlan.id },
      },
      relations: ['section', 'records'],
    });
    const inspectionsResponse = new InspectionsResponseDTO(
      inspectionPlan.identification,
      categoryList,
      inspectionPlan.id,
      inspectionPlan.summaryReport,
      inspectionPlan.minesiteInfo,
      inspectionPlan.status,
    );
    return inspectionsResponse;
  }
  async getAllInspectionPlans() {
    return await this.inspectionPlanRepository.find({});
  }
  async getAllInspectionReports(): Promise<InspectionsResponseDTO[]> {
    const inspectionPlans: InspectionPlan[] =
      await this.getAllInspectionPlans();
    let responseDTOs: InspectionsResponseDTO[] = [];
    inspectionPlans.forEach(async (plan: InspectionPlan) => {
      const inspectionPlan = await this.getInspectionPlan(plan.id);
      const categoryList: Category[] = await this.categoryRepository.find({
        where: {
          inspectionPlan: { id: inspectionPlan.id },
        },
        relations: ['section', 'records'],
      });
      const inspectionsResponse = new InspectionsResponseDTO(
        inspectionPlan.identification,
        categoryList,
        inspectionPlan.id,
        inspectionPlan.summaryReport,
        inspectionPlan.minesiteInfo,
        inspectionPlan.status,
      );
      responseDTOs.push(inspectionsResponse);
    });
    return responseDTOs;
  }

  async countAllPlansByProvince(province: string): Promise<number> {
    return await this.inspectionPlanRepository.count({
      where: { minesiteInfo: { province: province } },
    });
  }
  async getCategoriesFilteredByAll(
    status: EInspectionStatus,
    district: string,
    province: string,
    year: number,
    planId: UUID,
  ): Promise<InspectionsResponseDTO> {
    const inspectionPlan: InspectionPlan = await this.getInspectionPlan(planId);
    const categoryList: Category[] = await this.categoryRepository.find({
      where: {
        inspectionPlan: {
          id: inspectionPlan.id,
          year: year,
          status: status,
          minesiteInfo: { province: province, district: district },
        },
      },
      relations: ['section', 'records'],
    });
    const inspectionsResponse = new InspectionsResponseDTO(
      inspectionPlan.identification,
      categoryList,
      inspectionPlan.id,
      inspectionPlan.summaryReport,
      inspectionPlan.minesiteInfo,
      inspectionPlan.status,
    );
    return inspectionsResponse;
  }

  async getReportsFilteredByAllPaginated(
    status: EInspectionStatus,
    district: string,
    province: string,
    year: number,
    page: number,
    limit: number,
  ): Promise<any> {
    page = Math.max(1, page);
    const inspectionPlans: InspectionPlan[] =
      await this.inspectionPlanRepository.find({
        where: {
          year: year,
          status: status,
          minesiteInfo: { province: province, district: district },
        },
        take: limit,
        skip: (page - 1) * limit,
        relations: ['minesiteInfo', 'inspectorInfo'],
      });
    const meta = this.utilService.paginator({
      page,
      limit,
      total: inspectionPlans.length,
    });
    return { inspectionPlans, meta };
  }

  async getReportsFilteredByAllForLoggedInInspector(
    request: Request,
  ): Promise<any> {
    const inspector = await this.inspectorService.getLoggedInInspector(request);
    const inspectionPlans: InspectionPlan[] =
      await this.inspectionPlanRepository.find({
        where: {
          inspectorInfo: { id: inspector.id },
        },
        relations: ['minesiteInfo', 'inspectorInfo'],
      });
    return inspectionPlans;
  }
  async countReportsForLoggedInInspector(request: Request): Promise<number> {
    const inspector = await this.inspectorService.getLoggedInInspector(request);
    return await this.inspectionPlanRepository.count({
      where: { inspectorInfo: { id: inspector.id } },
    });
  }
  async getCurrentPlanForLoggedInInspector(
    request: Request,
  ): Promise<InspectionPlan> {
    const inspector = await this.inspectorService.getLoggedInInspector(request);
    return await this.inspectionPlanRepository.findOne({
      where: {
        inspectorInfo: { id: inspector.id },
        status: EInspectionStatus.IN_PROGRESS,
      },
    });
  }

  async getMyCategoriesFilteredByAll(
    status: EInspectionStatus,
    district: string,
    province: string,
    year: number,
    planId: UUID,
    request: Request,
  ): Promise<InspectionsResponseDTO> {
    const inspectionPlan: InspectionPlan = await this.getInspectionPlan(planId);
    const inspector: Inspector =
      await this.inspectorService.getLoggedInInspector(request);
    const categoryList: Category[] = await this.categoryRepository.find({
      where: {
        inspectionPlan: {
          id: inspectionPlan.id,
          year: year,
          status: status,
          minesiteInfo: { province: province, district: district },
          inspectorInfo: { id: inspector.id },
        },
      },
      relations: ['section', 'records'],
    });
    const inspectionsResponse = new InspectionsResponseDTO(
      inspectionPlan.identification,
      categoryList,
      inspectionPlan.id,
      inspectionPlan.summaryReport,
      inspectionPlan.minesiteInfo,
      inspectionPlan.status,
    );
    return inspectionsResponse;
  }

  async getMyCategoriesFilteredByStatus(
    planId: UUID,
    request: Request,
  ): Promise<InspectionsResponseDTO> {
    const inspectionPlan: InspectionPlan = await this.getInspectionPlan(planId);
    const inspector: Inspector =
      await this.inspectorService.getLoggedInInspector(request);
    const categoryList: Category[] = await this.categoryRepository.find({
      where: {
        inspectionPlan: {
          id: inspectionPlan.id,
          inspectorInfo: { id: inspector.id },
        },
      },
      relations: ['section', 'records'],
    });
    const inspectionsResponse = new InspectionsResponseDTO(
      inspectionPlan.identification,
      categoryList,
      inspectionPlan.id,
      inspectionPlan.summaryReport,
      inspectionPlan.minesiteInfo,
      inspectionPlan.status,
    );
    return inspectionsResponse;
  }

  async getRecordsByCategory(categoryId: UUID): Promise<ApiResponse> {
    const category: any = await this.categoryService.findById(categoryId);
    const records: InspectionRecord[] = await this.recordRepository.find({
      where: {
        category: { id: category.id },
      },
      relations: ['category'],
    });
    return new ApiResponse(
      true,
      'Records were retrieved successfully',
      records,
    );
  }

  async approveOrRejectInspectionPlan(
    action: string,
    planId: UUID,
  ): Promise<InspectionPlan> {
    if (!action) throw new BadRequestException('The action should not be null');
    let status: EInspectionStatus;
    switch (action.toUpperCase()) {
      case 'APPROVE':
        status = EInspectionStatus.APPROVED;
        break;
      case 'REJECT':
        status = EInspectionStatus.REJECTED;
        break;
      default:
        throw new BadRequestException(
          'The provided action is not valid, it should be in [REJECT,APPROVE]',
        );
    }

    let inspectionPlan = await this.getInspectionPlan(planId);
    inspectionPlan.status = status;
    inspectionPlan = await this.inspectionPlanRepository.save(inspectionPlan);
    await this.mailingService.sendEmail(
      '',
      action.toLowerCase(),
      inspectionPlan.inspectorInfo.lastName,
      null,
      null,
      inspectionPlan.inspectorInfo.email,
      `${
        inspectionPlan.createdAt.getDay
      }/${inspectionPlan.createdAt.getMonth()}/${inspectionPlan.createdAt.getFullYear()}`,
    );
    return inspectionPlan;
  }

  // Retrieve all inspection plans
  async findAll(): Promise<InspectionPlan[]> {
    return this.inspectionPlanRepository.find({
      relations: ['minesiteInfo', 'inspectorInfo'],
    });
  }

  // Retrieve an inspection plan by ID
  async findOne(id: any): Promise<InspectionPlan> {
    const inspectionPlan = await this.inspectionPlanRepository.findOne({
      where: { id: id },
      relations: ['minesiteInfo', 'inspectorInfo'],
    });
    if (!inspectionPlan) {
      throw new NotFoundException(`Inspection plan with ID ${id} not found`);
    }
    return inspectionPlan;
  }
  // Update an existing inspection plan
  async update(
    id: number,
    updateInspectionPlanDto: CreateInspectionDTO,
  ): Promise<InspectionPlan> {
    const inspectionPlan = await this.findOne(id);
    Object.assign(inspectionPlan, updateInspectionPlanDto);
    return this.inspectionPlanRepository.save(inspectionPlan);
  }

  // Delete an inspection plan by ID
  async remove(id: number): Promise<void> {
    const inspectionPlan = await this.findOne(id);
    await this.inspectionPlanRepository.remove(inspectionPlan);
  }
}
