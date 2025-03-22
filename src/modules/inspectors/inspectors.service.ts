import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inspector } from 'src/entities/inspector.entity';
import { Repository } from 'typeorm';
import { MailingService } from 'src/integrations/mailing/mailing.service';
import { UtilsService } from 'src/utils/utils.service';
import { UsersService } from '../users/users.service';
import { CreateInspectorDTO } from './dtos/createInspector.dto';
import { Profile } from 'src/entities/profile.entity';
import { UUID } from 'crypto';
import { InviteUser } from 'src/common/dtos/invite-user.dto';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { MinesiteService } from '../minesite/minesite.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EAccountStatus } from 'src/common/Enum/EAccountStatus.enum';
import { ERole } from 'src/common/Enum/ERole.enum';
import { RoleService } from '../roles/roles.service';
import { Request } from 'express';

@Injectable()
export class InspectorsService {
  constructor(
    @InjectRepository(Inspector) public inspectorRepo: Repository<Inspector>,
    @Inject(forwardRef(() => UtilsService))
    private utilsService: UtilsService,
    private mailingService: MailingService,
    private roleService: RoleService,
    private userService: UsersService,
    private mineSiteService: MinesiteService,
    private cloudinary: CloudinaryService,
  ) {}
  async getAll() {
    const response = await this.inspectorRepo.find({});
    return response;
  }
  async getByEmail(email: any) {
    const user = await this.inspectorRepo.findOne({
      where: {
        email: email,
      },
    });
    return user;
  }
  async existsByEmail(email: string): Promise<boolean> {
    const exists = await this.inspectorRepo.exist({ where: { email } });
    return exists;
  }
  async create(body: CreateInspectorDTO, file: Express.Multer.File) {
    let {
      firstName,
      lastName,
      email,
      national_id,
      phonenumber,
      minesiteId,
      password,
      province,
      district,
    } = body;

    const minesite = await this.mineSiteService.findById(minesiteId);
    // const userGender = this.utilsService.getGender(gender);
    password = await this.utilsService.hashString(password);
    if (!(await this.userService.existsByEmail(email)))
      throw new NotFoundException(
        'The profile you are trying to set up is not found',
      );

    let inspectorRoleStr: string = this.utilsService.getInspectorRole(
      body.inspectorRole,
    );
    const inspector: Inspector = new Inspector(
      firstName,
      lastName,
      email,
      new Date(),
      phonenumber,
      national_id,
      inspectorRoleStr,
      province,
      district,
    );
    const userProfile = await this.userService.getOneByEmail(email);
    inspector.profile = userProfile;
    inspector.minesite = minesite;
    inspector.email = userProfile.email.toString();
    userProfile.activationCode = null;
    userProfile.password = password;
    if (file) {
      const pictureUrl = await this.cloudinary.uploadImage(file).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });
      userProfile.profile_pic = pictureUrl.url;
    }

    userProfile.status = EAccountStatus[EAccountStatus.ACTIVE];
    const inspectorRole = await this.roleService.getRoleByName(
      ERole[ERole.INSPECTOR],
    );
    await this.userService.saveExistingProfile(userProfile, inspectorRole);
    await this.inspectorRepo.save(inspector);
    return new ApiResponse(
      true,
      `Thank you for setting up your profile, go and login`,
      null,
    );
  }

  async update(id: UUID, dto: CreateInspectorDTO) {
    const profile = await this.userService.getUserById(id, 'User');
    const inspector: Inspector = await this.inspectorRepo.findOne({
      where: {
        email: dto.email,
      },
    });
    if (!profile || !inspector) {
      throw new NotFoundException(
        'An inspector with the provided email not found',
      );
    }
    profile.email = dto.email;
    const inspectorRole = await this.roleService.getRoleByName(
      ERole[ERole.INSPECTOR],
    );
    const updatedProfile: Profile = await this.userService.saveExistingProfile(
      profile,
      inspectorRole,
    );
    inspector.firstName = dto.firstName;
    inspector.lastName = dto.lastName;
    inspector.email = dto.email;
    inspector.phoneNumber = dto.phonenumber;
    inspector.nationalId = dto.national_id;
    inspector.profile = updatedProfile;
    const savedInspector = await this.inspectorRepo.save(inspector);
    return new ApiResponse(
      true,
      'Inspector was updated successfully',
      savedInspector,
    );
  }

  async inviteInspector(dto: InviteUser): Promise<any> {
    if (await this.userService.existsByEmail(dto.email))
      throw new ForbiddenException('An inspector already exists');
    const password = await this.userService.getDefaultPassword();
    const role = await this.roleService.getRoleByName(ERole[ERole.INSPECTOR]);
    let profile = new Profile(dto.email, password);
    profile.activationCode = this.userService.generateRandomFourDigitNumber();
    await this.userService.saveExistingProfile(profile, role);
    await this.mailingService.sendEmail(
      `invite-inspector?email=${profile.email.toString()}`,
      'invite-inspector',
      profile.email.toString(),
      profile,
    );
    return new ApiResponse(
      true,
      "We have sent an invitation link to the inspector's email",
      null,
    );
  }

  async getLoggedInInspector(request: Request) {
    const loggedInUser: Profile = await this.utilsService.getLoggedInProfile(
      request,
    );
    return await this.findByEmail(loggedInUser.email.toString());
  }
  async getById(id: UUID) {
    const rmbMember = await this.inspectorRepo.findOne({
      where: {
        id: id,
      },
    });
    if (!rmbMember)
      throw new NotFoundException(
        'The Inspector with the provided id is not found',
      );
    return rmbMember;
  }
  async countAllByProvince(province: string): Promise<number> {
    return await this.inspectorRepo.count({
      where: { province: province },
    });
  }
  async findById(id: UUID) {
    const inspector = await this.inspectorRepo.findOne({
      where: {
        id: id,
      },
    });
    if (!inspector)
      throw new NotFoundException(
        'The Inspector with the provided id is not found',
      );
    return new ApiResponse(
      true,
      'The inspector was retrieved successfully',
      inspector,
    );
  }
  async findByEmail(email: string): Promise<Inspector> {
    const inspector = await this.inspectorRepo.findOne({
      where: {
        email: email,
      },
    });
    if (!inspector)
      throw new NotFoundException(
        'The Inspector with the available profile is not found',
      );
    return inspector;
  }
  async delete(id: UUID) {
    const inspector = await this.getById(id);
    await this.inspectorRepo.remove(inspector);
    return new ApiResponse(
      true,
      'An inspector was deleted successfully',
      inspector,
    );
  }
}
