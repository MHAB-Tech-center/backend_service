import { Test, TestingModule } from '@nestjs/testing';
import { MinesiteController } from './minesite.controller';
import { MinesiteService } from './minesite.service';
import { CreateMineSiteDTO } from 'src/common/dtos/create-minesite.dto';
import { UUID } from 'crypto';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { MineSite } from 'src/entities/minesite.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MinesiteController', () => {
  let controller: MinesiteController;
  let service: MinesiteService;

  const mockMinesiteService = {
    create: jest.fn(),
    update: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MinesiteController],
      providers: [
        {
          provide: MinesiteService,
          useValue: mockMinesiteService,
        },
      ],
    }).compile();

    controller = module.get<MinesiteController>(MinesiteController);
    service = module.get<MinesiteService>(MinesiteService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      const mockResponse = new ApiResponse(
        true,
        'The minesite was created successfully',
        mockMinesite,
      );

      mockMinesiteService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(dto);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('The minesite was created successfully');
      expect(result.data).toEqual(mockMinesite);
      expect(mockMinesiteService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException when minesite creation fails', async () => {
      const dto: CreateMineSiteDTO = {
        name: 'Test Mine',
        code: 'TEST001',
        province: 'Test Province',
        district: 'Test District',
      };

      mockMinesiteService.create.mockRejectedValue(
        new BadRequestException(
          'The minesite with the provided Id is already registered',
        ),
      );

      await expect(controller.create(dto)).rejects.toThrow(
        new BadRequestException(
          'The minesite with the provided Id is already registered',
        ),
      );
      expect(mockMinesiteService.create).toHaveBeenCalledWith(dto);
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

      const mockMinesite = new MineSite(
        dto.name,
        dto.code,
        dto.province,
        dto.district,
      );
      mockMinesite.id = id;

      const mockResponse = new ApiResponse(
        true,
        'The minesite was updated successfully',
        mockMinesite,
      );

      mockMinesiteService.update.mockResolvedValue(mockResponse);

      const result = await controller.update(id, dto);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('The minesite was updated successfully');
      expect(result.data).toEqual(mockMinesite);
      expect(mockMinesiteService.update).toHaveBeenCalledWith(id, dto);
    });

    it('should throw BadRequestException when minesite update fails', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const dto: CreateMineSiteDTO = {
        name: 'Updated Mine',
        code: 'TEST002',
        province: 'Updated Province',
        district: 'Updated District',
      };

      mockMinesiteService.update.mockRejectedValue(
        new BadRequestException(
          'The minesite with the provided id is not found',
        ),
      );

      await expect(controller.update(id, dto)).rejects.toThrow(
        new BadRequestException(
          'The minesite with the provided id is not found',
        ),
      );
      expect(mockMinesiteService.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('getAll', () => {
    it('should return all minesites successfully', async () => {
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

      const mockResponse = new ApiResponse(
        true,
        'All minsites were retrieved successfully',
        mockMinesites,
      );

      mockMinesiteService.getAll.mockResolvedValue(mockResponse);

      const result = await controller.getAll();

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('All minsites were retrieved successfully');
      expect(result.data).toEqual(mockMinesites);
      expect(mockMinesiteService.getAll).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return a minesite by id successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockMinesite = new MineSite(
        'Test Mine',
        'TEST001',
        'Test Province',
        'Test District',
      );
      mockMinesite.id = id;

      mockMinesiteService.getById.mockResolvedValue(mockMinesite);

      const result = await controller.getById(id);

      expect(result).toEqual(mockMinesite);
      expect(mockMinesiteService.getById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when minesite not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockMinesiteService.getById.mockRejectedValue(
        new NotFoundException(
          'The mine site with the provided id is not found',
        ),
      );

      await expect(controller.getById(id)).rejects.toThrow(
        new NotFoundException(
          'The mine site with the provided id is not found',
        ),
      );
      expect(mockMinesiteService.getById).toHaveBeenCalledWith(id);
    });
  });
});
