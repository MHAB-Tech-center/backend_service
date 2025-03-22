import { Test, TestingModule } from '@nestjs/testing';
import { SystemFeatureService } from './features.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemFeature } from 'src/entities/system-feature.entity';
import { UUID } from 'crypto';
import { CreateSystemFeatureDTO } from './dtos/create-feature.dto';
import { CreateMultipleFeaturesDTO } from './dtos/ceratee-features.dto';
import { NotFoundException } from '@nestjs/common';

describe('SystemFeatureService', () => {
  let service: SystemFeatureService;
  let systemFeatureRepository: Repository<SystemFeature>;

  const mockSystemFeatureRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemFeatureService,
        {
          provide: getRepositoryToken(SystemFeature),
          useValue: mockSystemFeatureRepository,
        },
      ],
    }).compile();

    service = module.get<SystemFeatureService>(SystemFeatureService);
    systemFeatureRepository = module.get<Repository<SystemFeature>>(
      getRepositoryToken(SystemFeature),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      mockSystemFeatureRepository.save
        .mockResolvedValueOnce(mockFeatures[0])
        .mockResolvedValueOnce(mockFeatures[1]);

      const result = await service.createMultipleSystemFeatures(dto);

      expect(result).toEqual(mockFeatures);
      expect(mockSystemFeatureRepository.save).toHaveBeenCalledTimes(2);
      expect(mockSystemFeatureRepository.save).toHaveBeenCalledWith(
        expect.any(SystemFeature),
      );
    });
  });

  describe('createSystemFeature', () => {
    it('should create a system feature successfully', async () => {
      const dto: CreateSystemFeatureDTO = {
        name: 'Test Feature',
      };

      const mockFeature = new SystemFeature(dto.name);

      mockSystemFeatureRepository.create.mockReturnValue(mockFeature);
      mockSystemFeatureRepository.save.mockResolvedValue(mockFeature);

      const result = await service.createSystemFeature(dto);

      expect(result).toEqual(mockFeature);
      expect(mockSystemFeatureRepository.create).toHaveBeenCalledWith({
        name: dto.name,
      });
      expect(mockSystemFeatureRepository.save).toHaveBeenCalledWith(
        mockFeature,
      );
    });
  });

  describe('updateSystemFeature', () => {
    it('should update a system feature successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const dto: CreateSystemFeatureDTO = {
        name: 'Updated Feature',
      };

      const existingFeature = new SystemFeature('Test Feature');
      existingFeature.id = id;

      const updatedFeature = new SystemFeature(dto.name);
      updatedFeature.id = id;

      mockSystemFeatureRepository.findOne.mockResolvedValue(existingFeature);
      mockSystemFeatureRepository.save.mockResolvedValue(updatedFeature);

      const result = await service.updateSystemFeature(id, dto);

      expect(result).toEqual(updatedFeature);
      expect(mockSystemFeatureRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockSystemFeatureRepository.save).toHaveBeenCalledWith(
        updatedFeature,
      );
    });

    it('should throw NotFoundException when feature not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const dto: CreateSystemFeatureDTO = {
        name: 'Updated Feature',
      };

      mockSystemFeatureRepository.findOne.mockResolvedValue(null);

      await expect(service.updateSystemFeature(id, dto)).rejects.toThrow(
        new NotFoundException(`System feature with ID "${id}" not found`),
      );
      expect(mockSystemFeatureRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('deleteSystemFeature', () => {
    it('should delete a system feature successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockSystemFeatureRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteSystemFeature(id);

      expect(result).toBe('System feature deleted successfully');
      expect(mockSystemFeatureRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when feature not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockSystemFeatureRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deleteSystemFeature(id)).rejects.toThrow(
        new NotFoundException(`System feature with ID "${id}" not found`),
      );
      expect(mockSystemFeatureRepository.delete).toHaveBeenCalledWith(id);
    });
  });

  describe('findFeatureById', () => {
    it('should return a feature by id successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockFeature = new SystemFeature('Test Feature');
      mockFeature.id = id;

      mockSystemFeatureRepository.findOne.mockResolvedValue(mockFeature);

      const result = await service.findFeatureById(id);

      expect(result).toEqual(mockFeature);
      expect(mockSystemFeatureRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should throw NotFoundException when feature not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockSystemFeatureRepository.findOne.mockResolvedValue(null);

      await expect(service.findFeatureById(id)).rejects.toThrow(
        new NotFoundException(
          'The system feature with the provided id is not found',
        ),
      );
      expect(mockSystemFeatureRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('getSystemFeatures', () => {
    it('should return all system features', async () => {
      const mockFeatures = [
        new SystemFeature('Feature 1'),
        new SystemFeature('Feature 2'),
      ];

      mockSystemFeatureRepository.find.mockResolvedValue(mockFeatures);

      const result = await service.getSystemFeatures();

      expect(result).toEqual(mockFeatures);
      expect(mockSystemFeatureRepository.find).toHaveBeenCalledWith({});
    });
  });
});
