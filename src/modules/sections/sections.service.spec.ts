import { Test, TestingModule } from '@nestjs/testing';
import { SectionsService } from './sections.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Section } from 'src/entities/section.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UUID } from 'crypto';
import { CreateSectionDTO } from 'src/common/dtos/sections/create-section.dto';
import { UpdateSectionFlagDTO } from 'src/common/dtos/sections/update-flag.dto';

describe('SectionsService', () => {
  let service: SectionsService;
  let repository: Repository<Section>;

  const mockRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionsService,
        {
          provide: getRepositoryToken(Section),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SectionsService>(SectionsService);
    repository = module.get<Repository<Section>>(getRepositoryToken(Section));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new section successfully', async () => {
      const dto: CreateSectionDTO = {
        title: 'Test Section',
        flagStandard: 'RED',
      };

      const mockSection = new Section(dto.title, dto.flagStandard);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockSection);

      const result = await service.create(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('The section was created successfully');
      expect(result.data).toEqual(mockSection);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { title: dto.title },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockSection);
    });

    it('should throw BadRequestException if section already exists', async () => {
      const dto: CreateSectionDTO = {
        title: 'Existing Section',
        flagStandard: 'RED',
      };

      mockRepository.findOne.mockResolvedValue(
        new Section(dto.title, dto.flagStandard),
      );

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { title: dto.title },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a section successfully', async () => {
      const id = '123' as UUID;
      const dto: CreateSectionDTO = {
        title: 'Updated Section',
        flagStandard: 'YELLOW',
      };

      const existingSection = new Section('Old Title', 'RED');
      const updatedSection = new Section(dto.title, dto.flagStandard);

      mockRepository.findOne.mockResolvedValue(existingSection);
      mockRepository.save.mockResolvedValue(updatedSection);

      const result = await service.update(id, dto);

      expect(result).toEqual(updatedSection);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedSection);
    });

    it('should throw NotFoundException if section does not exist', async () => {
      const id = '123' as UUID;
      const dto: CreateSectionDTO = {
        title: 'Updated Section',
        flagStandard: 'YELLOW',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(id, dto)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateFlagStandard', () => {
    it('should update flag standard to RED successfully', async () => {
      const id = '123' as UUID;
      const dto: UpdateSectionFlagDTO = {
        flagStandard: 'RED',
      };

      const existingSection = new Section('Test Section', 'YELLOW');
      const updatedSection = new Section('Test Section', 'RED');

      mockRepository.findOne.mockResolvedValue(existingSection);
      mockRepository.save.mockResolvedValue(updatedSection);

      const result = await service.updateFlagStandard(id, dto);

      expect(result).toEqual(updatedSection);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedSection);
    });

    it('should update flag standard to YELLOW successfully', async () => {
      const id = '123' as UUID;
      const dto: UpdateSectionFlagDTO = {
        flagStandard: 'YELLOW',
      };

      const existingSection = new Section('Test Section', 'RED');
      const updatedSection = new Section('Test Section', 'YELLOW');

      mockRepository.findOne.mockResolvedValue(existingSection);
      mockRepository.save.mockResolvedValue(updatedSection);

      const result = await service.updateFlagStandard(id, dto);

      expect(result).toEqual(updatedSection);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedSection);
    });

    it('should throw BadRequestException for invalid flag standard', async () => {
      const id = '123' as UUID;
      const dto: UpdateSectionFlagDTO = {
        flagStandard: 'INVALID',
      };

      const existingSection = new Section('Test Section', 'RED');

      mockRepository.findOne.mockResolvedValue(existingSection);

      await expect(service.updateFlagStandard(id, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if section does not exist', async () => {
      const id = '123' as UUID;
      const dto: UpdateSectionFlagDTO = {
        flagStandard: 'RED',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateFlagStandard(id, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getSectionByTitle', () => {
    it('should get section by title successfully', async () => {
      const title = 'Test Section';
      const mockSection = new Section(title, 'RED');

      mockRepository.findOne.mockResolvedValue(mockSection);

      const result = await service.getSectionByTitle(title);

      expect(result.success).toBe(true);
      expect(result.message).toBe('The section was retrieved successfully');
      expect(result.data).toEqual(mockSection);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { title },
      });
    });

    it('should throw NotFoundException if section does not exist', async () => {
      const title = 'Non-existent Section';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getSectionByTitle(title)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { title },
      });
    });
  });

  describe('findSectionByTitle', () => {
    it('should find section by title successfully', async () => {
      const title = 'Test Section';
      const mockSection = new Section(title, 'RED');

      mockRepository.findOne.mockResolvedValue(mockSection);

      const result = await service.findSectionByTitle(title);

      expect(result).toEqual(mockSection);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { title },
      });
    });

    it('should throw NotFoundException if section does not exist', async () => {
      const title = 'Non-existent Section';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findSectionByTitle(title)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { title },
      });
    });
  });

  describe('findSectionById', () => {
    it('should find section by id successfully', async () => {
      const id = '123' as UUID;
      const mockSection = new Section('Test Section', 'RED');

      mockRepository.findOne.mockResolvedValue(mockSection);

      const result = await service.findSectionById(id);

      expect(result).toEqual(mockSection);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('getAllSections', () => {
    it('should get all sections successfully', async () => {
      const mockSections = [
        new Section('Section 1', 'RED'),
        new Section('Section 2', 'YELLOW'),
      ];

      mockRepository.find.mockResolvedValue(mockSections);

      const result = await service.getAllSections();

      expect(result).toEqual(mockSections);
      expect(mockRepository.find).toHaveBeenCalledWith({});
    });
  });

  describe('existsByTitle', () => {
    it('should return true if section exists', async () => {
      const title = 'Test Section';
      const mockSection = new Section(title, 'RED');

      mockRepository.findOne.mockResolvedValue(mockSection);

      const result = await service.existsByTitle(title);

      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { title },
      });
    });

    it('should return false if section does not exist', async () => {
      const title = 'Non-existent Section';

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.existsByTitle(title);

      expect(result).toBe(false);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { title },
      });
    });
  });

  describe('existsById', () => {
    it('should return true if section exists', async () => {
      const id = '123' as UUID;
      const mockSection = new Section('Test Section', 'RED');

      mockRepository.findOne.mockResolvedValue(mockSection);

      const result = await service.existsById(id);

      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should return false if section does not exist', async () => {
      const id = '123' as UUID;

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.existsById(id);

      expect(result).toBe(false);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});
