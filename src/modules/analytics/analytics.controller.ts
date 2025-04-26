import { Controller, Get, Req, UseFilters } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CustomExceptionFilter } from 'src/exceptions/CustomExceptionFilter';
import { Public } from 'src/decorators/public.decorator';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { ERole } from 'src/common/Enum/ERole.enum';

@Controller('analytics')
@ApiTags('analytics')
@ApiBearerAuth()
@UseFilters(CustomExceptionFilter) // Apply filter to the controller
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}
  @Get('/inspector')
  @Roles(ERole.RMB, ERole.ADMIN, ERole.INSPECTOR)
  @ApiOperation({
    description: 'This is or loggedIn inspectors only',
  })
  @Public()
  async getInspectorDashBoard(@Req() request: Request): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The admin inspector dashboard was retrieved successfully',
      await this.analyticsService.getInspectorDashBoard(request),
    );
  }
  @Get('rmb')
  @Roles('RMB', 'ADMIN')
  async getAdminDashBoard(): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The admin RMB dashboard was retrieved successfully',
      await this.analyticsService.getAdminDashBoard(),
    );
  }
}
