import { Test, TestingModule } from '@nestjs/testing';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { CreateSectionDTO } from 'src/common/dtos/sections/create-section.dto';
import { UpdateSectionFlagDTO } from 'src/common/dtos/sections/update-flag.dto';
import { UUID } from 'crypto';
import { Section } from 'src/entities/section.entity';
import { ApiResponse } from 'src/common/payload/ApiResponse';

describe('SectionsController', () => {
  let controller: SectionsController;
  let service: SectionsService;

  const mockSectionsService = {
    create: jest.fn(),
    update: jest.fn(),
    updateFlagStandard: jest.fn(),
    getSectionByTitle: jest.fn(),
    getAllSections: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SectionsController],
      providers: [
        {
          provide: SectionsService,
          useValue: mockSectionsService,
        },
      ],
    }).compile();

    controller = module.get<SectionsController>(SectionsController);
    service = module.get<SectionsService>(SectionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new section', async () => {
      const dto: CreateSectionDTO = {
        title: 'Test Section',
        flagStandard: 'RED',
      };

      const mockSection = new Section(dto.title, dto.flagStandard);
      const mockResponse = new ApiResponse(
        true,
        'The section was created successfully',
        mockSection,
      );

      mockSectionsService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(dto);

      expect(result).toEqual(mockResponse);
      expect(mockSectionsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update a section', async () => {
      const id = '123' as UUID;
      const dto: CreateSectionDTO = {
        title: 'Updated Section',
        flagStandard: 'YELLOW',
      };

      const mockSection = new Section(dto.title, dto.flagStandard);
      const mockResponse = new ApiResponse(
        true,
        'The section was updated successfully',
        mockSection,
      );

      mockSectionsService.update.mockResolvedValue(mockSection);

      const result = await controller.update(id, dto);

      expect(result).toEqual(mockResponse);
      expect(mockSectionsService.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('updateFlagStandard', () => {
    it('should update flag standard of a section', async () => {
      const id = '123' as UUID;
      const dto: UpdateSectionFlagDTO = {
        flagStandard: 'RED',
      };

      const mockSection = new Section('Test Section', dto.flagStandard);
      const mockResponse = new ApiResponse(
        true,
        'The section was updated successfully',
        mockSection,
      );

      mockSectionsService.updateFlagStandard.mockResolvedValue(mockSection);

      const result = await controller.updateFlagStandard(id, dto);

      expect(result).toEqual(mockResponse);
      expect(mockSectionsService.updateFlagStandard).toHaveBeenCalledWith(
        id,
        dto,
      );
    });
  });

  describe('getSectionByTitle', () => {
    it('should get section by title', async () => {
      const title = 'Test Section';
      const mockSection = new Section(title, 'RED');
      const mockResponse = new ApiResponse(
        true,
        'The section was retrieved successfully',
        mockSection,
      );

      mockSectionsService.getSectionByTitle.mockResolvedValue(mockResponse);

      const result = await controller.getSectionByTitle(title);

      expect(result).toEqual(mockResponse);
      expect(mockSectionsService.getSectionByTitle).toHaveBeenCalledWith(title);
    });
  });

  describe('getAllSections', () => {
    it('should get all sections', async () => {
      const mockSections = [
        new Section('Section 1', 'RED'),
        new Section('Section 2', 'YELLOW'),
      ];

      const mockResponse = new ApiResponse(
        true,
        'All sections are retrieved successfully',
        mockSections,
      );

      mockSectionsService.getAllSections.mockResolvedValue(mockSections);

      const result = await controller.getAllSections();

      expect(result).toEqual(mockResponse);
      expect(mockSectionsService.getAllSections).toHaveBeenCalled();
    });
  });
});
