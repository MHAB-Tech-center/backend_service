import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
} from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { CreateInspectionDTO } from 'src/common/dtos/inspections/create-inspection.dto';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CustomExceptionFilter } from 'src/exceptions/CustomExceptionFilter';
import { CreateInspectionPlanDTO } from 'src/common/dtos/inspections/create-inspection-plan.dto';
import { Public } from 'src/decorators/public.decorator';
import { UUID } from 'crypto';
import { EditInspectionRecordDTO } from 'src/common/dtos/inspections/edit-inspection.dto';
import { EditManyInspectionRecordsDTO } from 'src/common/dtos/inspections/edit-many-inspections-records.dto';
import { ReviewInspectionPlanDTO } from 'src/common/dtos/inspections/review-inspection-plan.dto';
import { EInspectionStatus } from 'src/common/Enum/EInspectionStatus.enum';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { ERole } from 'src/common/Enum/ERole.enum';

@Controller('inspections')
@ApiTags('inspections')
@ApiBearerAuth()
@UseFilters(CustomExceptionFilter) // Apply filter to the controller
export class InspectionsController {
  constructor(private inspectionsService: InspectionsService) {}

  @Post('inspection-records/create')
  @Roles('SUPERVISOR', 'ENVIRONOMIST', 'INSPECTOR')
  async createInspectionRecords(
    @Body() dto: CreateInspectionDTO,
  ): Promise<ApiResponse> {
    return await this.inspectionsService.create(dto);
  }
  @Public()
  @Post('inspection-plan/create')
  @Roles('SUPERVISOR', 'ENVIRONOMIST', 'INSPECTOR')
  async createInspectionPlan(
    @Body() dto: CreateInspectionPlanDTO,
    @Req() request: Request,
  ): Promise<ApiResponse> {
    return this.inspectionsService.createInspectionPlan(request, dto);
  }
  @Put('/records/update')
  @Roles('SUPERVISOR', 'ENVIRONOMIST', 'INSPECTOR')
  async editInspectionRecord(@Body() dto: EditInspectionRecordDTO) {
    return new ApiResponse(
      true,
      'The inspection record was updated successfully',
      await this.inspectionsService.editInspectionRecord(dto),
    );
  }

  @Put('/records/update-bulk')
  @Roles('SUPERVISOR', 'ENVIRONOMIST', 'INSPECTOR')
  async editManyInspectionRecords(@Body() dto: EditManyInspectionRecordsDTO) {
    return new ApiResponse(
      true,
      'All records were updated successfully',
      await this.inspectionsService.editManyInspectionRecords(dto),
    );
  }
  @ApiQuery({ name: 'action', example: 'APPROVE' })
  @Patch('/reports/take-action')
  async approveOrRejectInspectionPlan(
    @Query('action') action: string,
    @Param('planId') planId: UUID,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The inspection plan was updated successfully',
      await this.inspectionsService.approveOrRejectInspectionPlan(
        action,
        planId,
      ),
    );
  }

  @Put('review/')
  @Roles('RMB', 'ADMIN')
  async reviewInspectionPlan(@Body() dto: ReviewInspectionPlanDTO) {
    return new ApiResponse(
      true,
      'The inspection plan was reviewed successfully',
      await this.inspectionsService.reviewInspectionPlan(dto),
    );
  }

  @Put('all/by-status')
  @ApiQuery({ name: 'status', required: true, example: 'submitted' })
  async getInspectionPlanByStatus(
    @Query('status') status: string = 'submitted',
  ) {
    return new ApiResponse(
      true,
      'The inspection plan were retrieved successfully',
      await this.inspectionsService.getInspectionPlanByStatus(status),
    );
  }

  @Get('categories/plan-id/:planId')
  @Public()
  async getCategoriesInspectionPlan(
    @Param('planId') planId: UUID,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'Categories were retrieved successfuly',
      await this.inspectionsService.getCategoriesInspectionPlan(planId),
    );
  }
  @Get('filtered-categories/plan-id/:planId')
  @ApiQuery({
    name: 'status',
    required: true,
    example: EInspectionStatus.IN_PROGRESS,
  })
  @ApiQuery({
    name: 'district',
    required: true,
    example: 'Nyabihu',
  })
  @ApiQuery({
    name: 'province',
    required: true,
    example: 'West',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    example: 2024,
  })
  @ApiQuery({
    name: 'planId',
    required: true,
  })
  @Public()
  async getCategoriesFilteredByAll(
    @Query('status') status: EInspectionStatus,
    @Query('district') district: string,
    @Query('province') province: string,
    @Query('year') year: number,
    @Query('planId') planId: UUID,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'Inspection records were retrieved successfully',
      await this.inspectionsService.getCategoriesFilteredByAll(
        status,
        district,
        province,
        year,
        planId,
      ),
    );
  }
  @Get('categories/loggedIn-inspector')
  @Roles('SUPERVISOR', 'ENVIRONOMIST', 'INSPECTOR')
  @ApiOperation({
    summary: ' Get all inspection category records',
    description:
      'Retrieves all filtered inspection category records that are associated to loggedIn inspector',
  })
  @ApiQuery({
    name: 'status',
    required: true,
    example: EInspectionStatus.IN_PROGRESS,
  })
  @ApiQuery({
    name: 'district',
    required: true,
    example: 'Nyabihu',
  })
  @ApiQuery({
    name: 'province',
    required: true,
    example: 'West',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    example: 2024,
  })
  @ApiQuery({
    name: 'planId',
    required: true,
  })
  @Public()
  async getMyCategoriesFilteredByAll(
    @Query('status') status: EInspectionStatus,
    @Query('district') district: string,
    @Query('province') province: string,
    @Query('year') year: number,
    @Query('planId') planId: UUID,
    @Req() request: Request,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'Inspection records were retrieved successfully',
      await this.inspectionsService.getMyCategoriesFilteredByAll(
        status,
        district,
        province,
        year,
        planId,
        request,
      ),
    );
  }
  @ApiQuery({
    name: 'planId',
    required: true,
  })
  @ApiQuery({
    name: 'status',
    required: true,
    example: EInspectionStatus.IN_PROGRESS,
  })
  @ApiOperation({
    summary: ' Get all inspection category records by status',
    description:
      'Retrieves all  inspection category records filtered by status that are associated to loggedIn inspector',
  })
  @Get('categories/loggedIn-inspector')
  @Roles('SUPERVISOR', 'ENVIRONOMIST', 'INSPECTOR')
  async getMyCategoriesFilteredByStatus(
    @Query('planId') planId: UUID,
    @Req() request: Request,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'Inspection records were retrieved successfully',
      await this.inspectionsService.getMyCategoriesFilteredByStatus(
        planId,
        request,
      ),
    );
  }

  @Get('records/category-id/:categoryId')
  @Roles(ERole.RMB, ERole.ADMIN, ERole.MCIS)
  async getRecordsByCategory(
    @Param('categoryId') categoryId: UUID,
  ): Promise<ApiResponse> {
    return await this.inspectionsService.getRecordsByCategory(categoryId);
  }
  @Get('/plans/all')
  @Roles(ERole.ADMIN, ERole.RMB, ERole.MCIS)
  @Public()
  async getAllInspectionPlans() {
    return new ApiResponse(
      true,
      'All inspection plans were retrieved successfully',
      await this.inspectionsService.findAll(),
    );
  }
  @Get('/plans/all/paginated')
  @Roles(ERole.RMB, ERole.ADMIN, ERole.MCIS)
  @Public()
  @ApiQuery({
    name: 'status',
    required: true,
    example: EInspectionStatus.IN_PROGRESS,
  })
  @ApiQuery({
    name: 'district',
    required: true,
    example: 'Nyabihu',
  })
  @ApiQuery({
    name: 'province',
    required: true,
    example: 'West',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    example: 2024,
  })
  @ApiQuery({
    name: 'page',
    required: true,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: true,
    example: 10,
  })
  async getReportsFilteredByAllPaginated(
    @Query('status') status: EInspectionStatus,
    @Query('district') district: string,
    @Query('province') province: string,
    @Query('year') year: number,
    @Query('page') page: number = 10,
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'Inspections retrieved successfully',
      await this.inspectionsService.getReportsFilteredByAllPaginated(
        status,
        district,
        province,
        year,
        page,
        limit,
      ),
    );
  }
  @Get('plan/:planId')
  @Roles(
    ERole.INSPECTOR,
    ERole.SUPERVISOR,
    ERole.ENVIRONOMIST,
    ERole.RMB,
    ERole.ADMIN,
    ERole.MCIS,
  )
  async getInspectionPlan(@Param('planId') planId: UUID): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The inspection plan was retrieved successfully',
      await this.inspectionsService.getInspectionPlan(planId),
    );
  }
  @Get('plans/loggedIn-inspector')
  @Roles('INSPECTOR', 'SUPERVISOR', 'ENVIRONOMIST')
  async getAllPlansFilteredByAllForLoggedInInspector(
    @Req() request: Request,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'Inspections plans were retrieved successfully',
      await this.inspectionsService.getReportsFilteredByAllForLoggedInInspector(
        request,
      ),
    );
  }
  @Get('plans/current-plan/by-loggedIn-inspector')
  @Roles('INSPECTOR', 'SUPERVISOR', 'ENVIRONOMIST')
  async getCurrentPlanForLoggedInInspector(
    @Req() request: Request,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The Inspection Plan was retrieved successfully',
      await this.inspectionsService.getCurrentPlanForLoggedInInspector(request),
    );
  }
}
