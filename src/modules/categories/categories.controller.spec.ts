import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { NotFoundException } from '@nestjs/common';
import { UUID } from 'crypto';
import { ApiResponse } from 'src/common/payload/ApiResponse';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategoriesService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCategory', () => {
    it('should return category when found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      const mockCategory = {
        id: id,
        title: 'Test Category',
        inspectionPlan: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Test Plan',
        },
      };

      mockCategoriesService.findById.mockResolvedValue(mockCategory);

      const result = await controller.getCategory(id);

      const expectedResponse = new ApiResponse(
        true,
        'The category was retrieved successfully',
        mockCategory,
      );

      expect(result).toEqual(expectedResponse);
      expect(mockCategoriesService.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when category not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockCategoriesService.findById.mockRejectedValue(
        new NotFoundException('The category with the provided Id is not found'),
      );

      await expect(controller.getCategory(id)).rejects.toThrow(
        new NotFoundException('The category with the provided Id is not found'),
      );
      expect(mockCategoriesService.findById).toHaveBeenCalledWith(id);
    });
  });
});
