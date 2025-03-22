import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UseFilters,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { dot } from 'node:test/reporters';
import { CreateSectionDTO } from 'src/common/dtos/sections/create-section.dto';
import { UpdateSectionFlagDTO } from 'src/common/dtos/sections/update-flag.dto';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { Section } from 'src/entities/section.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
  ) {}

  async create(dto: CreateSectionDTO): Promise<ApiResponse> {
    if (await this.existsByTitle(dto.title))
      throw new BadRequestException(
        'The section with the provided Id already exists',
      );

    const sectionEntity = new Section(dto.title, dto.flagStandard);
    const section = await this.sectionRepository.save(sectionEntity);
    return new ApiResponse(
      true,
      'The section was created successfully',
      section,
    );
  }

  async update(id: UUID, dto: CreateSectionDTO): Promise<Section> {
    const sectionEntity = await this.findSectionById(id);
    sectionEntity.flagStandard = this.getFlag(dto);
    sectionEntity.title = dto.title;
    const section = await this.sectionRepository.save(sectionEntity);
    return section;
  }
  getFlag(dto: CreateSectionDTO){
    switch (dto.flagStandard.toUpperCase()) {
      case 'RED':
        return 'RED';
      case 'YELLOW':
        return 'YELLOW';
      default:
        throw new BadRequestException(
          'The flag provided is invalid; It should be red or yellow',
        );
    }
  }
  async updateFlagStandard(
    id: UUID,
    dto: UpdateSectionFlagDTO,
  ): Promise<Section> {
    const sectionEntity = await this.findSectionById(id);
    switch (dto.flagStandard.toUpperCase()) {
      case 'RED':
        sectionEntity.flagStandard = 'RED';
        break;
      case 'YELLOW':
        sectionEntity.flagStandard = 'YELLOW';
        break;
      default:
        throw new BadRequestException(
          'The flag provided is invalid; It should be red or yellow',
        );
    }
    const section = await this.sectionRepository.save(sectionEntity);
    return section;
  }

  async getSectionByTitle(title: string): Promise<ApiResponse> {
    if (!(await this.existsByTitle(title)))
      throw new NotFoundException(
        'The section with the provided title is not found',
      );
    const section = await this.sectionRepository.findOne({
      where: {
        title: title,
      },
    });
    return new ApiResponse(
      true,
      'The section was retrieved successfully',
      section,
    );
  }

  async findSectionByTitle(title: string) {
    if (!(await this.existsByTitle(title)))
      throw new NotFoundException(
        'The section with the provided title is not found',
      );
    return await this.sectionRepository.findOne({
      where: {
        title: title,
      },
    });
  }
  async findSectionById(id: UUID) {
    const section = await this.sectionRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!section) {
      throw new NotFoundException(
        'The section with the provided id is not found',
      );
    }
    return section;
  }

  async getAllSections() {
    const sections = await this.sectionRepository.find({});
    return sections;
  }

  async existsByTitle(title: any): Promise<boolean> {
    const section = await this.sectionRepository.findOne({
      where: {
        title: title,
      },
    });
    return section != null;
  }
  async existsById(id: UUID): Promise<boolean> {
    const section = await this.sectionRepository.findOne({
      where: {
        id: id,
      },
    });
    return section != null;
  }
}
