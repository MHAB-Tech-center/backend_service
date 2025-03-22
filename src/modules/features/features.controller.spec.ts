import { Test, TestingModule } from '@nestjs/testing';
import { FeaturesController } from './features.controller';
import { SystemFeatureService } from './features.service';
import { CreateSystemFeatureDTO } from './dtos/create-feature.dto';
import { CreateMultipleFeaturesDTO } from './dtos/ceratee-features.dto';
import { UUID } from 'crypto';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { SystemFeature } from 'src/entities/system-feature.entity';
import { NotFoundException } from '@nestjs/common';

describe('FeaturesController', () => {
  let controller: FeaturesController;
  let service: SystemFeatureService;

  const mockSystemFeatureService = {
    getSystemFeatures: jest.fn(),
    createMultipleSystemFeatures: jest.fn(),
    createSystemFeature: jest.fn(),
    updateSystemFeature: jest.fn(),
    deleteSystemFeature: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeaturesController],
      providers: [
        {
          provide: SystemFeatureService,
          useValue: mockSystemFeatureService,
        },
      ],
    }).compile();

    controller = module.get<FeaturesController>(FeaturesController);
    service = module.get<SystemFeatureService>(SystemFeatureService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSystemFeatures', () => {
    it('should return all system features successfully', async () => {
      const mockFeatures = [
        new SystemFeature('Feature 1'),
        new SystemFeature('Feature 2'),
      ];

      mockSystemFeatureService.getSystemFeatures.mockResolvedValue(
        mockFeatures,
      );

      const result = await controller.getSystemFeatures();

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('All features were retrieved successfully');
      expect(result.data).toEqual(mockFeatures);
      expect(mockSystemFeatureService.getSystemFeatures).toHaveBeenCalled();
    });
  });

  describe('createMultipleSystemFeatures', () => {
    it('should create multiple system features successfully', async () => {
      const dto: CreateMultipleFeaturesDTO = {
        features: [{ name: 'Feature 1' }, { name: 'Feature 2' }],
      };

      const mockFeatures = [
        new SystemFeature('Feature 1'),
        new SystemFeature('Feature 2'),
      ];

      mockSystemFeatureService.createMultipleSystemFeatures.mockResolvedValue(
        mockFeatures,
      );

      const result = await controller.createMultipleSystemFeatures(dto);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Multiple features were created successfully',
      );
      expect(result.data).toEqual(mockFeatures);
      expect(
        mockSystemFeatureService.createMultipleSystemFeatures,
      ).toHaveBeenCalledWith(dto);
    });
  });

  describe('createSystemFeature', () => {
    it('should create a system feature successfully', async () => {
      const dto: CreateSystemFeatureDTO = {
        name: 'Test Feature',
      };

      const mockFeature = new SystemFeature(dto.name);

      mockSystemFeatureService.createSystemFeature.mockResolvedValue(
        mockFeature,
      );

      const result = await controller.createSystemFeature(dto);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'The system feature was created successfully',
      );
      expect(result.data).toEqual(mockFeature);
      expect(mockSystemFeatureService.createSystemFeature).toHaveBeenCalledWith(
        dto,
      );
    });
  });

  describe('updateSystemFeature', () => {
    it('should update a system feature successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const dto: CreateSystemFeatureDTO = {
        name: 'Updated Feature',
      };

      const mockFeature = new SystemFeature(dto.name);
      mockFeature.id = id;

      mockSystemFeatureService.updateSystemFeature.mockResolvedValue(
        mockFeature,
      );

      const result = await controller.updateSystemFeature(id, dto);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'The system feature was uploaded successfully',
      );
      expect(result.data).toEqual(mockFeature);
      expect(mockSystemFeatureService.updateSystemFeature).toHaveBeenCalledWith(
        id,
        dto,
      );
    });

    it('should throw NotFoundException when feature not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const dto: CreateSystemFeatureDTO = {
        name: 'Updated Feature',
      };

      mockSystemFeatureService.updateSystemFeature.mockRejectedValue(
        new NotFoundException(`System feature with ID "${id}" not found`),
      );

      await expect(controller.updateSystemFeature(id, dto)).rejects.toThrow(
        new NotFoundException(`System feature with ID "${id}" not found`),
      );
      expect(mockSystemFeatureService.updateSystemFeature).toHaveBeenCalledWith(
        id,
        dto,
      );
    });
  });

  describe('deleteSystemFeature', () => {
    it('should delete a system feature successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockSystemFeatureService.deleteSystemFeature.mockResolvedValue(
        'System feature deleted successfully',
      );

      const result = await controller.deleteSystemFeature(id);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('system featuree was retrieved successfully');
      expect(result.data).toBe('System feature deleted successfully');
      expect(mockSystemFeatureService.deleteSystemFeature).toHaveBeenCalledWith(
        id,
      );
    });

    it('should throw NotFoundException when feature not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockSystemFeatureService.deleteSystemFeature.mockRejectedValue(
        new NotFoundException(`System feature with ID "${id}" not found`),
      );

      await expect(controller.deleteSystemFeature(id)).rejects.toThrow(
        new NotFoundException(`System feature with ID "${id}" not found`),
      );
      expect(mockSystemFeatureService.deleteSystemFeature).toHaveBeenCalledWith(
        id,
      );
    });
  });
});
