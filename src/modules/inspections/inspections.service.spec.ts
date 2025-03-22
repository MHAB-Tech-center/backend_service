import { Test, TestingModule } from '@nestjs/testing';
import { InspectionsService } from './inspections.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InspectionPlan } from 'src/entities/InspectionPlan.entity';
import { Repository } from 'typeorm';
import { Category } from 'src/entities/category.entity';
import { InspectionRecord } from 'src/entities/inspection-record.entity';
import { InspectionIdentification } from 'src/entities/inspection-identification.entity';
import { SummaryReport } from 'src/entities/summary-report.entity';
import { MinesiteService } from '../minesite/minesite.service';
import { UtilsService } from 'src/utils/utils.service';
import { InspectorsService } from '../inspectors/inspectors.service';
import { SectionsService } from '../sections/sections.service';
import { CategoriesService } from '../categories/categories.service';
import { ReviewsService } from '../reviews/reviews.service';
import { MailingService } from 'src/integrations/mailing/mailing.service';
import { UUID } from 'crypto';
import { CreateInspectionPlanDTO } from 'src/common/dtos/inspections/create-inspection-plan.dto';
import { Request } from 'express';
import { Profile } from 'src/entities/profile.entity';
import { Inspector } from 'src/entities/inspector.entity';
import { MineSite } from 'src/entities/minesite.entity';
import { EInspectionStatus } from 'src/common/Enum/EInspectionStatus.enum';
import { NotFoundException } from '@nestjs/common';

describe('InspectionsService', () => {
  let service: InspectionsService;
  let inspectionPlanRepository: Repository<InspectionPlan>;
  let categoryRepository: Repository<Category>;
  let recordRepository: Repository<InspectionRecord>;
  let identificationRepository: Repository<InspectionIdentification>;
  let summaryReportRepository: Repository<SummaryReport>;
  let minesiteService: MinesiteService;
  let utilsService: UtilsService;
  let inspectorsService: InspectorsService;
  let sectionsService: SectionsService;
  let categoriesService: CategoriesService;
  let reviewsService: ReviewsService;
  let mailingService: MailingService;
  let coordinatesService: any;

  const mockInspectionPlanRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockCategoryRepository = {
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockRecordRepository = {
    save: jest.fn(),
  };

  const mockIdentificationRepository = {
    save: jest.fn(),
  };

  const mockSummaryReportRepository = {
    save: jest.fn(),
  };

  const mockMinesiteService = {
    getById: jest.fn(),
  };

  const mockUtilsService = {
    getLoggedInProfile: jest.fn(),
    getInspectionStatus: jest.fn(),
  };

  const mockInspectorsService = {
    findByEmail: jest.fn(),
  };

  const mockSectionsService = {
    findSectionById: jest.fn(),
  };

  const mockCategoriesService = {
    existsByTitleInspectionPlan: jest.fn(),
    findByTitleInspectionPlan: jest.fn(),
  };

  const mockReviewsService = {
    saveReview: jest.fn(),
  };

  const mockMailingService = {
    sendEmail: jest.fn(),
  };

  const mockCoordinatesService = {
    saveCoordinates: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionsService,
        {
          provide: getRepositoryToken(InspectionPlan),
          useValue: mockInspectionPlanRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(InspectionRecord),
          useValue: mockRecordRepository,
        },
        {
          provide: getRepositoryToken(InspectionIdentification),
          useValue: mockIdentificationRepository,
        },
        {
          provide: getRepositoryToken(SummaryReport),
          useValue: mockSummaryReportRepository,
        },
        {
          provide: MinesiteService,
          useValue: mockMinesiteService,
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
        {
          provide: InspectorsService,
          useValue: mockInspectorsService,
        },
        {
          provide: SectionsService,
          useValue: mockSectionsService,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
        {
          provide: MailingService,
          useValue: mockMailingService,
        },
        {
          provide: 'CoordinatesService',
          useValue: mockCoordinatesService,
        },
      ],
    }).compile();

    service = module.get<InspectionsService>(InspectionsService);
    inspectionPlanRepository = module.get<Repository<InspectionPlan>>(
      getRepositoryToken(InspectionPlan),
    );
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    recordRepository = module.get<Repository<InspectionRecord>>(
      getRepositoryToken(InspectionRecord),
    );
    identificationRepository = module.get<Repository<InspectionIdentification>>(
      getRepositoryToken(InspectionIdentification),
    );
    summaryReportRepository = module.get<Repository<SummaryReport>>(
      getRepositoryToken(SummaryReport),
    );
    minesiteService = module.get<MinesiteService>(MinesiteService);
    utilsService = module.get<UtilsService>(UtilsService);
    inspectorsService = module.get<InspectorsService>(InspectorsService);
    sectionsService = module.get<SectionsService>(SectionsService);
    categoriesService = module.get<CategoriesService>(CategoriesService);
    reviewsService = module.get<ReviewsService>(ReviewsService);
    mailingService = module.get<MailingService>(MailingService);
    coordinatesService = module.get<any>('CoordinatesService');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInspectionPlan', () => {
    it('should create an inspection plan successfully', async () => {
      const dto: CreateInspectionPlanDTO = {
        minesiteId: '123e4567-e89b-12d3-a456-426614174000' as UUID,
        startDate: new Date(),
        endDate: new Date(),
      };

      const mockRequest = {
        get: jest.fn(),
        header: jest.fn(),
        accepts: jest.fn(),
        acceptsCharsets: jest.fn(),
        acceptsEncodings: jest.fn(),
        acceptsLanguages: jest.fn(),
        range: jest.fn(),
        param: jest.fn(),
        is: jest.fn(),
        protocol: 'http',
        secure: false,
        ip: '::1',
        ips: [],
        subdomains: [],
        path: '/',
        hostname: 'localhost',
        host: 'localhost',
        fresh: false,
        stale: true,
        xhr: false,
        body: {},
        cookies: {},
        method: 'GET',
        params: {},
        query: {},
        route: {},
        signedCookies: {},
        originalUrl: '/',
        url: '/',
        baseUrl: '',
        app: {},
        res: {},
        next: jest.fn(),
        user: {
          email: 'test@example.com',
        },
      } as unknown as Request;

      const mockProfile: Profile = {
        id: '123e4567-e89b-12d3-a456-426614174000' as UUID,
        email: 'test@example.com',
        last_login: new Date(),
        profile_pic: 'test.jpg',
        password: 'hashedPassword',
        created_at: new Date(),
        updated_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
        is_active: true,
        is_deleted: false,
        deleted_at: null,
        deletedBy: null,
        activationCode: 123456,
        status: 'active',
        loginStatus: 'online',
        roles: [],
        severity: 'low',
      } as Profile;

      const mockInspector: Inspector = {
        id: '123e4567-e89b-12d3-a456-426614174000' as UUID,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profile: mockProfile,
      } as Inspector;

      const mockMineSite: MineSite = {
        id: dto.minesiteId,
      } as MineSite;

      const mockInspectionPlan: InspectionPlan = {
        id: '123e4567-e89b-12d3-a456-426614174001' as UUID,
        startDate: dto.startDate,
        endDate: dto.endDate,
        inspectorInfo: mockInspector,
        minesiteInfo: mockMineSite,
        status: EInspectionStatus.IN_PROGRESS,
      } as InspectionPlan;

      mockMinesiteService.getById.mockResolvedValue(mockMineSite);
      mockUtilsService.getLoggedInProfile.mockResolvedValue(mockProfile);
      mockInspectorsService.findByEmail.mockResolvedValue(mockInspector);
      mockInspectionPlanRepository.save.mockResolvedValue(mockInspectionPlan);

      const result = await service.createInspectionPlan(mockRequest, dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Inspection plan was created successfully');
      expect(result.data).toEqual(mockInspectionPlan);
      expect(mockMinesiteService.getById).toHaveBeenCalledWith(dto.minesiteId);
      expect(mockUtilsService.getLoggedInProfile).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(mockInspectorsService.findByEmail).toHaveBeenCalledWith(
        mockProfile.email.toString(),
      );
      expect(mockInspectionPlanRepository.save).toHaveBeenCalled();
    });
  });

  describe('getInspectionPlanByStatus', () => {
    it('should return inspection plans by status', async () => {
      const status = 'in_progress';
      const mockInspectionPlans: InspectionPlan[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000' as UUID,
          status: EInspectionStatus.IN_PROGRESS,
        } as InspectionPlan,
      ];

      mockUtilsService.getInspectionStatus.mockResolvedValue(
        EInspectionStatus.IN_PROGRESS,
      );
      mockInspectionPlanRepository.find.mockResolvedValue(mockInspectionPlans);

      const result = await service.getInspectionPlanByStatus(status);

      expect(result).toEqual(mockInspectionPlans);
      expect(mockUtilsService.getInspectionStatus).toHaveBeenCalledWith(status);
      expect(mockInspectionPlanRepository.find).toHaveBeenCalledWith({
        where: { status: EInspectionStatus.IN_PROGRESS },
      });
    });
  });

  describe('findOne', () => {
    it('should return an inspection plan when found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockInspectionPlan: InspectionPlan = {
        id,
        minesiteInfo: {} as MineSite,
        inspectorInfo: {} as Inspector,
      } as InspectionPlan;

      mockInspectionPlanRepository.findOne.mockResolvedValue(
        mockInspectionPlan,
      );

      const result = await service.findOne(id);

      expect(result).toEqual(mockInspectionPlan);
      expect(mockInspectionPlanRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['minesiteInfo', 'inspectorInfo'],
      });
    });

    it('should throw NotFoundException when inspection plan not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockInspectionPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException(`Inspection plan with ID ${id} not found`),
      );
      expect(mockInspectionPlanRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['minesiteInfo', 'inspectorInfo'],
      });
    });
  });
});
