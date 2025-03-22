import { Test, TestingModule } from '@nestjs/testing';
import { MinesiteService } from './minesite.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MineSite } from 'src/entities/minesite.entity';
import { UUID } from 'crypto';
import { CreateMineSiteDTO } from 'src/common/dtos/create-minesite.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiResponse } from 'src/common/payload/ApiResponse';

describe('MinesiteService', () => {
  let service: MinesiteService;
  let minesiteRepository: Repository<MineSite>;

  const mockMinesiteRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinesiteService,
        {
          provide: getRepositoryToken(MineSite),
          useValue: mockMinesiteRepository,
        },
      ],
    }).compile();

    service = module.get<MinesiteService>(MinesiteService);
    minesiteRepository = module.get<Repository<MineSite>>(
      getRepositoryToken(MineSite),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a minesite successfully', async () => {
      const dto: CreateMineSiteDTO = {
        name: 'Test Mine',
        code: 'TEST001',
        province: 'Test Province',
        district: 'Test District',
      };

      const mockMinesite = new MineSite(
        dto.name,
        dto.code,
        dto.province,
        dto.district,
      );

      mockMinesiteRepository.findOne.mockResolvedValue(null);
      mockMinesiteRepository.save.mockResolvedValue(mockMinesite);

      const result = await service.create(dto);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('The minesite was created successfully');
      expect(result.data.name).toEqual(mockMinesite.name);
      expect(result.data.code).toEqual(mockMinesite.code);
      expect(result.data.province).toEqual(mockMinesite.province);
      expect(result.data.district).toEqual(mockMinesite.district);
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { code: dto.code },
      });
      const savedMinesite = mockMinesiteRepository.save.mock.calls[0][0];
      expect(savedMinesite.name).toEqual(mockMinesite.name);
      expect(savedMinesite.code).toEqual(mockMinesite.code);
      expect(savedMinesite.province).toEqual(mockMinesite.province);
      expect(savedMinesite.district).toEqual(mockMinesite.district);
    });

    it('should throw BadRequestException when minesite code already exists', async () => {
      const dto: CreateMineSiteDTO = {
        name: 'Test Mine',
        code: 'TEST001',
        province: 'Test Province',
        district: 'Test District',
      };

      mockMinesiteRepository.findOne.mockResolvedValue(
        new MineSite(
          'Existing Mine',
          dto.code,
          'Existing Province',
          'Existing District',
        ),
      );

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException(
          'The minesite with the provided Id is already registered',
        ),
      );
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { code: dto.code },
      });
    });
  });

  describe('update', () => {
    it('should update a minesite successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const dto: CreateMineSiteDTO = {
        name: 'Updated Mine',
        code: 'TEST002',
        province: 'Updated Province',
        district: 'Updated District',
      };

      const existingMinesite = new MineSite(
        'Test Mine',
        'TEST001',
        'Test Province',
        'Test District',
      );
      existingMinesite.id = id;

      const updatedMinesite = new MineSite(
        dto.name,
        dto.code,
        dto.province,
        dto.district,
      );
      updatedMinesite.id = id;

      mockMinesiteRepository.findOne.mockResolvedValue(existingMinesite);
      mockMinesiteRepository.save.mockResolvedValue(updatedMinesite);

      const result = await service.update(id, dto);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('The minesite was updated successfully');
      expect(result.data).toEqual(updatedMinesite);
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockMinesiteRepository.save).toHaveBeenCalledWith(updatedMinesite);
    });

    it('should throw BadRequestException when minesite not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const dto: CreateMineSiteDTO = {
        name: 'Updated Mine',
        code: 'TEST002',
        province: 'Updated Province',
        district: 'Updated District',
      };

      mockMinesiteRepository.findOne.mockResolvedValue(null);

      await expect(service.update(id, dto)).rejects.toThrow(
        new BadRequestException(
          'The minesite with the provided id is not found',
        ),
      );
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('getById', () => {
    it('should return a minesite by id', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockMinesite = new MineSite(
        'Test Mine',
        'TEST001',
        'Test Province',
        'Test District',
      );
      mockMinesite.id = id;

      mockMinesiteRepository.findOne.mockResolvedValue(mockMinesite);

      const result = await service.getById(id);

      expect(result).toEqual(mockMinesite);
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should throw NotFoundException when minesite not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockMinesiteRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(id)).rejects.toThrow(
        new NotFoundException(
          'The mine site with the provided id is not found',
        ),
      );
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('getAll', () => {
    it('should return all minesites', async () => {
      const mockMinesites = [
        new MineSite(
          'Test Mine 1',
          'TEST001',
          'Test Province 1',
          'Test District 1',
        ),
        new MineSite(
          'Test Mine 2',
          'TEST002',
          'Test Province 2',
          'Test District 2',
        ),
      ];

      mockMinesiteRepository.find.mockResolvedValue(mockMinesites);

      const result = await service.getAll();

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('All minsites were retrieved successfully');
      expect(result.data).toEqual(mockMinesites);
      expect(mockMinesiteRepository.find).toHaveBeenCalledWith({});
    });
  });

  describe('findById', () => {
    it('should return a minesite by id', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockMinesite = new MineSite(
        'Test Mine',
        'TEST001',
        'Test Province',
        'Test District',
      );
      mockMinesite.id = id;

      mockMinesiteRepository.findOne.mockResolvedValue(mockMinesite);

      const result = await service.findById(id);

      expect(result).toEqual(mockMinesite);
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should throw NotFoundException when minesite not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockMinesiteRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(
        new NotFoundException('The minesite with the provided Id is not found'),
      );
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('findByCode', () => {
    it('should return a minesite by code', async () => {
      const code = 'TEST001';
      const mockMinesite = new MineSite(
        'Test Mine',
        code,
        'Test Province',
        'Test District',
      );

      mockMinesiteRepository.findOne.mockResolvedValue(mockMinesite);

      const result = await service.findByCode(code);

      expect(result).toEqual(mockMinesite);
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { code },
      });
    });

    it('should throw NotFoundException when minesite not found', async () => {
      const code = 'TEST001';

      mockMinesiteRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode(code)).rejects.toThrow(
        new NotFoundException(
          'The minesite with the provided code is not found',
        ),
      );
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { code },
      });
    });
  });

  describe('existsById', () => {
    it('should return true when minesite exists', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockMinesite = new MineSite(
        'Test Mine',
        'TEST001',
        'Test Province',
        'Test District',
      );
      mockMinesite.id = id;

      mockMinesiteRepository.findOne.mockResolvedValue(mockMinesite);

      const result = await service.existsById(id);

      expect(result).toBe(true);
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should return false when minesite does not exist', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockMinesiteRepository.findOne.mockResolvedValue(null);

      const result = await service.existsById(id);

      expect(result).toBe(false);
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('existsByCode', () => {
    it('should return true when minesite exists', async () => {
      const code = 'TEST001';
      const mockMinesite = new MineSite(
        'Test Mine',
        code,
        'Test Province',
        'Test District',
      );

      mockMinesiteRepository.findOne.mockResolvedValue(mockMinesite);

      const result = await service.existsByCode(code);

      expect(result).toBe(true);
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { code },
      });
    });

    it('should return false when minesite does not exist', async () => {
      const code = 'TEST001';

      mockMinesiteRepository.findOne.mockResolvedValue(null);

      const result = await service.existsByCode(code);

      expect(result).toBe(false);
      expect(mockMinesiteRepository.findOne).toHaveBeenCalledWith({
        where: { code },
      });
    });
  });
});
