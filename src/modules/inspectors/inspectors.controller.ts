import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { InspectorsService } from './inspectors.service';
import { UUID } from 'crypto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/decorators/public.decorator';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { InviteUser } from 'src/common/dtos/invite-user.dto';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { CustomExceptionFilter } from 'src/exceptions/CustomExceptionFilter';
import { CreateInspectorDTO } from './dtos/createInspector.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ERole } from 'src/common/Enum/ERole.enum';

@Controller('inspectors')
@ApiTags('inspectors')
@UseFilters(CustomExceptionFilter) // Apply filter to the controller
@ApiBearerAuth()
export class InspectorsController {
  constructor(private inspectorService: InspectorsService) {}

  // Get all inspector
  @Get('/all')
  @Roles(ERole.RMB, ERole.ADMIN, ERole.MCIS)
  async getAll() {
    return this.inspectorService.getAll();
  }

  // Get inspector by email without relations
  @Get('/find-by-email/:email')
  @Roles(ERole.RMB, ERole.ADMIN, ERole.MCIS)
  async getOneByEmail(@Param('email') email: string) {
    return await this.inspectorService.getByEmail(email);
  }

  // Create a new inspector

  @Post()
  @UseInterceptors(FileInterceptor('picture'))
  @ApiConsumes('multipart/form-data')
  @Public()
  async create(
    @Body() body: CreateInspectorDTO,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse> {
    return this.inspectorService.create(body, file);
  }
  @Post('invite')
  @Roles(ERole.ADMIN, ERole.RMB)
  @Public()
  async inviteInspector(@Body() dto: InviteUser): Promise<ApiResponse> {
    return this.inspectorService.inviteInspector(dto);
  }

  // Update an inspector's details
  @Put('/update/:id')
  @Roles('INSPECTOR', 'ADMIN')
  async update(
    @Param('id') id: UUID,
    @Body() dto: CreateInspectorDTO,
  ): Promise<ApiResponse> {
    return this.inspectorService.update(id, dto);
  }

  // Get inspector by ID
  @Get('/by-id/:id')
  @Roles(ERole.RMB, ERole.ADMIN, ERole.MCIS)
  async getById(@Param('id') id: UUID): Promise<ApiResponse> {
    return this.inspectorService.findById(id);
  }

  // Delete an inspector
  @Delete('/delete/:id')
  @Roles('ADMIN')
  async delete(@Param('id') id: UUID): Promise<ApiResponse> {
    return this.inspectorService.delete(id);
  }
}
