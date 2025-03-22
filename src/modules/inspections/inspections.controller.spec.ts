import { Test, TestingModule } from '@nestjs/testing';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';
import { CreateInspectionPlanDTO } from 'src/common/dtos/inspections/create-inspection-plan.dto';
import { UUID } from 'crypto';
import { Request } from 'express';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { InspectionPlan } from 'src/entities/InspectionPlan.entity';
import { EInspectionStatus } from 'src/common/Enum/EInspectionStatus.enum';
import { EditInspectionRecordDTO } from 'src/common/dtos/inspections/edit-inspection.dto';
import { EditManyInspectionRecordsDTO } from 'src/common/dtos/inspections/edit-many-inspections-records.dto';
import { ReviewInspectionPlanDTO } from 'src/common/dtos/inspections/review-inspection-plan.dto';

describe('InspectionsController', () => {
  let controller: InspectionsController;
  let service: InspectionsService;

  const mockInspectionsService = {
    createInspectionPlan: jest.fn(),
    getInspectionPlanByStatus: jest.fn(),
    editInspectionRecord: jest.fn(),
    editManyInspectionRecords: jest.fn(),
    reviewInspectionPlan: jest.fn(),
    getInspectionPlan: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionsController],
      providers: [
        {
          provide: InspectionsService,
          useValue: mockInspectionsService,
        },
      ],
    }).compile();

    controller = module.get<InspectionsController>(InspectionsController);
    service = module.get<InspectionsService>(InspectionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createInspectionPlan', () => {
    it('should create an inspection plan successfully', async () => {
      const dto: CreateInspectionPlanDTO = {
        minesiteId: '123e4567-e89b-12d3-a456-426614174000' as UUID,
        startDate: new Date(),
        endDate: new Date(),
      };

      const request = {} as Request;

      const mockResponse = new ApiResponse(
        true,
        'Inspection plan was created successfully',
        {} as InspectionPlan,
      );

      mockInspectionsService.createInspectionPlan.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.createInspectionPlan(dto, request);

      expect(result).toEqual(mockResponse);
      expect(mockInspectionsService.createInspectionPlan).toHaveBeenCalledWith(
        request,
        dto,
      );
    });
  });

  describe('editInspectionRecord', () => {
    it('should edit an inspection record successfully', async () => {
      const dto: EditInspectionRecordDTO = {
        categoryId: '123e4567-e89b-12d3-a456-426614174000' as UUID,
        pseudoName: 'test',
        data: {
          title: 'Test Record',
          boxValue: 'test',
          flagValue: 'green',
          pseudoName: 'test',
          category: {
            title: 'Test Category',
            sectionId: '123e4567-e89b-12d3-a456-426614174001' as UUID,
          },
        },
      };

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Test Record',
      };

      mockInspectionsService.editInspectionRecord.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.editInspectionRecord(dto);

      expect(result).toEqual(
        new ApiResponse(
          true,
          'The inspection record was updated successfully',
          mockResponse,
        ),
      );
      expect(mockInspectionsService.editInspectionRecord).toHaveBeenCalledWith(
        dto,
      );
    });
  });

  describe('editManyInspectionRecords', () => {
    it('should edit multiple inspection records successfully', async () => {
      const dto: EditManyInspectionRecordsDTO = {
        data: [
          {
            categoryId: '123e4567-e89b-12d3-a456-426614174000' as UUID,
            pseudoName: 'test1',
            data: {
              title: 'Test Record 1',
              boxValue: 'test1',
              flagValue: 'green',
              pseudoName: 'test1',
              category: {
                title: 'Test Category',
                sectionId: '123e4567-e89b-12d3-a456-426614174001' as UUID,
              },
            },
          },
          {
            categoryId: '123e4567-e89b-12d3-a456-426614174002' as UUID,
            pseudoName: 'test2',
            data: {
              title: 'Test Record 2',
              boxValue: 'test2',
              flagValue: 'red',
              pseudoName: 'test2',
              category: {
                title: 'Test Category',
                sectionId: '123e4567-e89b-12d3-a456-426614174001' as UUID,
              },
            },
          },
        ],
      };

      const mockResponse = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Record 1',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Test Record 2',
        },
      ];

      mockInspectionsService.editManyInspectionRecords.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.editManyInspectionRecords(dto);

      expect(result).toEqual(
        new ApiResponse(
          true,
          'All records were updated successfully',
          mockResponse,
        ),
      );
      expect(
        mockInspectionsService.editManyInspectionRecords,
      ).toHaveBeenCalledWith(dto);
    });
  });

  describe('reviewInspectionPlan', () => {
    it('should review an inspection plan successfully', async () => {
      const dto: ReviewInspectionPlanDTO = {
        planId: '123e4567-e89b-12d3-a456-426614174000' as UUID,
        reviewMessage: 'Test review message',
      };

      const mockResponse = null;

      mockInspectionsService.reviewInspectionPlan.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.reviewInspectionPlan(dto);

      expect(result).toEqual(
        new ApiResponse(
          true,
          'The inspection plan was reviewed successfully',
          mockResponse,
        ),
      );
      expect(mockInspectionsService.reviewInspectionPlan).toHaveBeenCalledWith(
        dto,
      );
    });
  });

  describe('getInspectionPlanByStatus', () => {
    it('should get inspection plans by status', async () => {
      const status = 'submitted';
      const mockResponse = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: EInspectionStatus.SUBMITTED,
        },
      ];

      mockInspectionsService.getInspectionPlanByStatus.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getInspectionPlanByStatus(status);

      expect(result).toEqual(
        new ApiResponse(
          true,
          'The inspection plan were retrieved successfully',
          mockResponse,
        ),
      );
      expect(
        mockInspectionsService.getInspectionPlanByStatus,
      ).toHaveBeenCalledWith(status);
    });
  });

  describe('getInspectionPlan', () => {
    it('should get an inspection plan by id', async () => {
      const planId = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockResponse = {
        id: planId,
        status: EInspectionStatus.IN_PROGRESS,
      };

      mockInspectionsService.getInspectionPlan.mockResolvedValue(mockResponse);

      const result = await controller.getInspectionPlan(planId);

      expect(result).toEqual(
        new ApiResponse(
          true,
          'The inspection plan was retrieved successfully',
          mockResponse,
        ),
      );
      expect(mockInspectionsService.getInspectionPlan).toHaveBeenCalledWith(
        planId,
      );
    });
  });

  describe('getAllInspectionPlans', () => {
    it('should get all inspection plans', async () => {
      const mockResponse = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: EInspectionStatus.IN_PROGRESS,
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          status: EInspectionStatus.SUBMITTED,
        },
      ];

      mockInspectionsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.getAllInspectionPlans();

      expect(result).toEqual(
        new ApiResponse(
          true,
          'All inspection plans were retrieved successfully',
          mockResponse,
        ),
      );
      expect(mockInspectionsService.findAll).toHaveBeenCalled();
    });
  });
});
