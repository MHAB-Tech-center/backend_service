import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { RMBStaffService } from './rmb-staff.service';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { UUID } from 'crypto';
import { CreateRMBRoleDTO } from './dtos/create-rmb-role.dto';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/decorators/public.decorator';
import { InviteUser } from 'src/common/dtos/invite-user.dto';
import { CustomExceptionFilter } from 'src/exceptions/CustomExceptionFilter';
import { CreateRMBStaffMemberDTO } from './dtos/create-rmb-member.dto';
import { AssignFeaturesDTO } from './dtos/assignFeatures.dto';
import { Roles } from 'src/utils/decorators/roles.decorator';

@Controller('rmb-staff')
@ApiTags('rmb-staff')
@ApiBearerAuth()
@UseFilters(CustomExceptionFilter) // Apply filter to the controller
export class RmbStaffController {
  constructor(private rmbStaffService: RMBStaffService) {}

  @Post()
  @UseInterceptors(FileInterceptor('picture'))
  @ApiConsumes('multipart/form-data')
  @Public()
  async create(
    @Body() body: CreateRMBStaffMemberDTO,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      `Thank you for setting up your profile, go and login`,
      await this.rmbStaffService.create(body, file),
    );
  }
  @Post('invite')
  @Roles('ADMIN', 'RMB')
  async inviteInspector(@Body() dto: InviteUser): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      "We have sent an invitation link to the registered RMB staff member's email",
      await this.rmbStaffService.inviteRMBStaffMember(dto),
    );
  }

  @Get('all/by-status')
  @Roles('ADMIN', 'RMB')
  @ApiQuery({ name: 'status', required: true, example: 'pending' })
  async findByStatus(@Query('status') status: string): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The rmb staff member was retrieved successfully',
      await this.rmbStaffService.findByStatus(status),
    );
  }
  @Get('all')
  @Roles('ADMIN', 'RMB')
  async getAll(): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'All rmb staff members were retrieved successfully',
      await this.rmbStaffService.getAll(),
    );
  }

  @Get('/:id')
  @Roles('ADMIN', 'RMB')
  async findById(@Param('id') id: UUID): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'All rmb pending staff members were retrieved successfully',
      await this.rmbStaffService.findById(id),
    );
  }

  @Get()
  @Roles('ADMIN', 'RMB')
  @ApiQuery({ name: 'userId', required: true })
  async findByUser(@Query('userId') userId: any): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'All rmb staff member was retrieved successfully',
      await this.rmbStaffService.findById(userId),
    );
  }
  @Delete('/:id')
  @Roles('ADMIN')
  async delete(@Param('id') id: UUID): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'RMB staff member was deleted successfully',
      await this.rmbStaffService.delete(id),
    );
  }
  @Post('/roles/create')
  @Roles('ADMIN')
  async addRMBRole(@Body() dto: CreateRMBRoleDTO): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The RMB role was created successfully',
      await this.rmbStaffService.addRMBRole(
        dto.roleName,
        dto.roleDescription,
        dto.featureIds,
      ),
    );
  }
  @Get('roles/all')
  @Roles('ADMIN', 'RMB')
  async getAllRMBRoles(): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'All RMB roles were retrieved successfully',
      await this.rmbStaffService.getAllRMBRoles(),
    );
  }

  @Put('roles/update-role/:id')
  @Roles('ADMIN')
  async updateRMBRole(
    @Body() dto: CreateRMBRoleDTO,
    @Param('id') id: UUID,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The RMB role was updated successfully',
      await this.rmbStaffService.updateRMBRole(
        id,
        dto.roleName,
        dto.roleDescription,
        dto.featureIds,
      ),
    );
  }
  @Delete('roles/delete/:id')
  @Roles('ADMIN')
  async deleteRMBRole(@Param('id') id: UUID): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The RMB role was deleted successfully',
      await this.rmbStaffService.delete(id),
    );
  }
  @Put('assign-roles')
  @Roles('ADMIN')
  @ApiQuery({ name: 'rmbRoleId', required: true })
  @ApiQuery({ name: 'rmbStaffId', required: true })
  async assignRMBRole(
    @Query('rmbRoleId') rmbRoleId: string,
    @Query('rmbStaffId') rmbStaffId: string,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The roles have been assigned successfully',
      await this.rmbStaffService.assignRMBRole(rmbRoleId, rmbStaffId),
    );
  }
  @Put('assign-featues')
  @Roles('ADMIN')
  async assignFeaturesToRole(
    @Body() dto: AssignFeaturesDTO,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'Features have been assigned successfully',
      await this.rmbStaffService.assignFeaturesToRole(dto),
    );
  }
  @Put('roles/update/:id')
  @Roles('ADMIN')
  @ApiQuery({ name: 'rmbRoleId', required: true })
  @ApiQuery({ name: 'rmbStaffId', required: true })
  async updateRMBStaffRole(
    @Query('rmbRoleId') rmbRoleId: string,
    @Query('rmbStaffId') rmbStaffId: string,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The RMB staff role was updated successfully',
      await this.rmbStaffService.updateRMBStaffRole(rmbRoleId, rmbStaffId),
    );
  }

  @Patch('dissociate-role')
  @ApiQuery({ name: 'rmbStaffId', required: true })
  @Roles('ADMIN')
  async dissociateRMBRole(
    @Query('rmbStaffId') rmbStaffId: UUID,
  ): Promise<ApiResponse> {
    return new ApiResponse(
      true,
      'The role has been dissociated successfuly',
      await this.rmbStaffService.dissociateRMBRole(rmbStaffId),
    );
  }
}
