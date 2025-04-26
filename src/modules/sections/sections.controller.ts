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
import { ERole } from 'src/common/Enum/ERole.enum';

@Controller('sections')
@ApiTags('section')
@ApiBearerAuth()
@UseFilters(CustomExceptionFilter) // Apply filter to the controller
export class SectionsController {
  constructor(private sectionService: SectionsService) {}

  @Post('create')
  @Roles(ERole.ADMIN)
  @Public()
  async create(@Body() dto: CreateSectionDTO): Promise<ApiResponse> {
    return this.sectionService.create(dto);
  }
  @Put('update/:id')
  @Roles(ERole.ADMIN)
  async update(@Param('id') id: UUID, @Body() dto: CreateSectionDTO) {
    return new ApiResponse(
      true,
      'The section was updated successfully',
      this.sectionService.update(id, dto),
    );
  }
  @Patch('change-flag/:id')
  @Roles(ERole.ADMIN)
  async updateFlagStandard(
    @Param('id') id: UUID,
    @Body() dto: UpdateSectionFlagDTO,
  ) {
    return new ApiResponse(
      true,
      'The section was updated successfully',
      this.sectionService.updateFlagStandard(
        id,
        this.updateFlagStandard(id, dto),
      ),
    );
  }

  @Get('by-title/:title')
  @Roles(
    ERole.RMB,
    ERole.ADMIN,
    ERole.INSPECTOR,
    ERole.ENVIRONOMIST,
    ERole.MCIS,
  )
  async getSectionByTitle(@Param('title') title: string): Promise<ApiResponse> {
    return this.sectionService.getSectionByTitle(title);
  }
  @Get('all')
  @Roles(
    ERole.RMB,
    ERole.ADMIN,
    ERole.INSPECTOR,
    ERole.ENVIRONOMIST,
    ERole.MCIS,
  )
  async getAllSections() {
    return new ApiResponse(
      true,
      'All sections are retrieved successfully',
      await this.sectionService.getAllSections(),
    );
  }
}
