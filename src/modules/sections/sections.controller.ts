import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseFilters,
} from '@nestjs/common';
import { SectionsService } from './sections.service';
import { CreateSectionDTO } from 'src/common/dtos/sections/create-section.dto';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { CustomExceptionFilter } from 'src/exceptions/CustomExceptionFilter';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/decorators/public.decorator';
import { UUID } from 'crypto';
import { UpdateSectionFlagDTO } from 'src/common/dtos/sections/update-flag.dto';
import { Roles } from 'src/utils/decorators/roles.decorator';

@Controller('sections')
@ApiTags('section')
@ApiBearerAuth()
@UseFilters(CustomExceptionFilter) // Apply filter to the controller
export class SectionsController {
  constructor(private sectionService: SectionsService) {}

  @Post('create')
  // @Roles('ADMIN')
  @Public()
  async create(@Body() dto: CreateSectionDTO): Promise<ApiResponse> {
    return this.sectionService.create(dto);
  }
  @Put('update/:id')
  @Roles('ADMIN')
  async update(@Param('id') id: UUID, @Body() dto: CreateSectionDTO) {
    return new ApiResponse(
      true,
      'The section was updated successfully',
      await this.sectionService.update(id, dto),
    );
  }
  @Patch('change-flag/:id')
  @Roles('ADMIN')
  async updateFlagStandard(
    @Param('id') id: UUID,
    @Body() dto: UpdateSectionFlagDTO,
  ) {
    return new ApiResponse(
      true,
      'The section was updated successfully',
      await this.sectionService.updateFlagStandard(id, dto),
    );
  }

  @Get('by-title/:title')
  async getSectionByTitle(@Param('title') title: string): Promise<ApiResponse> {
    return this.sectionService.getSectionByTitle(title);
  }
  @Get('all')
  async getAllSections() {
    return new ApiResponse(
      true,
      'All sections are retrieved successfully',
      await this.sectionService.getAllSections(),
    );
  }
}
