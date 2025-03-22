import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from 'src/entities/category.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UUID } from 'crypto';
import { InspectionPlan } from 'src/entities/InspectionPlan.entity';
import { Section } from 'src/entities/section.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: Repository<Category>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('existsByTitleInspectionPlan', () => {
    it('should return true when category exists', async () => {
      const title = 'Test Category';
      const planId = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      const mockCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Category',
        inspectionPlan: { id: planId },
      };

      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.existsByTitleInspectionPlan(title, planId);

      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          title: title,
          inspectionPlan: { id: planId },
        },
      });
    });

    it('should return false when category does not exist', async () => {
      const title = 'Test Category';
      const planId = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.existsByTitleInspectionPlan(title, planId);

      expect(result).toBe(false);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          title: title,
          inspectionPlan: { id: planId },
        },
      });
    });
  });

  describe('findByTitleInspectionPlan', () => {
    it('should return category when found', async () => {
      const title = 'Test Category';
      const planId = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      const mockCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Category',
        inspectionPlan: { id: planId },
      };

      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findByTitleInspectionPlan(title, planId);

      expect(result).toEqual(mockCategory);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          title: title,
          inspectionPlan: { id: planId },
        },
      });
    });

    it('should return null when category not found', async () => {
      const title = 'Test Category';
      const planId = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByTitleInspectionPlan(title, planId);

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          title: title,
          inspectionPlan: { id: planId },
        },
      });
    });
  });

  describe('findById', () => {
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

      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findById(id);

      expect(result).toEqual(mockCategory);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: id },
        relations: ['inspectionPlan'],
      });
    });

    it('should throw NotFoundException when category not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(
        new NotFoundException('The category with the provided Id is not found'),
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: id },
        relations: ['inspectionPlan'],
      });
    });
  });
});
