/* eslint-disable */
/*
 @auhor : © 2024 Valens Niyonsenga <valensniyonsenga2003@gmail.com>
*/

/**
 * @file
 * @brief service for User queries
 */
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm/dist';
import {
  BadRequestException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { EAccountStatus } from 'src/common/Enum/EAccountStatus.enum';
import { ERole } from 'src/common/Enum/ERole.enum';
import { UtilsService } from 'src/utils/utils.service';
import { LoginDTO } from 'src/common/dtos/lodin.dto';
import { CreateUserDto } from 'src/common/dtos/create-user.dto';
import { UUID } from 'crypto';
import { EUserType } from 'src/common/Enum/EUserType.enum';
import { MailingService } from 'src/integrations/mailing/mailing.service';
import { Profile } from 'src/entities/profile.entity';
import * as bcrypt from 'bcrypt';
import { VerifyLoginDTO } from 'src/common/dtos/verify-login.dto';
import { ELoginStatus } from 'src/common/Enum/ELoginStatus.enum';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { Role } from 'src/entities/role.entity';
import { RoleService } from '../roles/roles.service';
import { RMBStaffService } from '../rmb-staff/rmb-staff.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Profile) public userRepo: Repository<Profile>,
    // @Inject(forwardRef(() => RoleService))
    private roleService: RoleService,
    @Inject(forwardRef(() => UtilsService))
    private utilsService: UtilsService,
    private mailingService: MailingService,
    @Inject(forwardRef(() => RMBStaffService))
    private rmbService: RMBStaffService,
  ) {}

  user: Profile;

  async getUsers() {
    const response = await this.userRepo.find({ relations: ['roles'] });
    return response;
  }

  async getUserByEmail(email: any) {
    const user = await this.userRepo.findOne({
      where: {
        email: email,
      },
      relations: ['roles'],
    });
    if (!user)
      throw new NotFoundException(
        'The user with the provided email is not found',
      );
    return user;
  }
  async existsByEmail(email: any): Promise<boolean> {
    const user = await this.getOneByEmail(email);
    return user != null;
  }
  async getUserByVerificationCode(code: number) {
    const user = await this.userRepo.findOne({
      where: {
        activationCode: code,
      },
      relations: ['roles'],
    }); 
    return user;
  }

  async getDefaultPassword() {
    return await this.utilsService.hashString('Default');
  }

  async getOneByEmail(email: any) {
    const user = await this.userRepo.findOne({
      where: {
        email: email,
      },
      relations: ['roles'],
    });
    return user;
  }

  async getUserById(id: UUID, entity: String) {
    const response = await this.userRepo.findOne({
      where: {
        id: id,
      },
      relations: ['roles'],
    });
    if (!response) {
      throw new NotFoundException(`${entity} not found`);
    }
    return response;
  }

  generateRandomFourDigitNumber(): number {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async preLogin(dto: LoginDTO) {
    this.user = await this.getOneByEmail(dto.email);
    if (!this.user) throw new BadRequestException('Invalid email or password');
    const arePasswordsMatch = await bcrypt.compare(
      dto.password.toString(),
      this.user.password.toString(),
    );
    if (!this.user || !arePasswordsMatch)
      throw new BadRequestException('Invalid email or password');
    if (
      this.user.status == EAccountStatus[EAccountStatus.WAIT_EMAIL_VERIFICATION]
    )
      throw new BadRequestException(
        'This account is not yet verified, please check your gmail inbox for verification details',
      );
  }
  async verifyLogin(dto: VerifyLoginDTO) {
    const loginDTO: LoginDTO = new LoginDTO(dto.email, dto.password);
    await this.preLogin(loginDTO);

    if (
      this.user.activationCode != dto.activationCode ||
      this.user.activationCode == null
    )
      throw new BadRequestException('Invalid activation code');

    const tokens = this.utilsService.getTokens(this.user);

    this.user.loginStatus = ELoginStatus[ELoginStatus.VERIFIED];
    await this.userRepo.save(this.user);
    const rmbMember = await this.rmbService.findByEmail(
      this.user.email.toString(),
    );
    let rmbRole = null;
    if (rmbMember) {
      rmbRole = rmbMember.rmbRole;
    }
    delete this.user.password;
    delete this.user.activationCode;
    return new ApiResponse(true, 'The login was verified successfully', {
      access: (await tokens).accessToken,
      refresh_token: (await tokens).refreshToken,
      user: { ...this.user, rmbRole: rmbRole },
    });
  }
  async login(dto: LoginDTO) {
    await this.preLogin(dto);
    this.user.loginStatus = ELoginStatus[ELoginStatus.FOR_VERIFICATION];
    this.user.activationCode = this.generateRandomFourDigitNumber();
    await this.userRepo.save(this.user);

    this.mailingService.sendEmail(
      '',
      'verify-email-login',
      this.user.email.toString(),
      this.user,
    );
  }

  async verifyAccount(code: number) {
    const verifiedAccount = await this.getUserByVerificationCode(code);
    if (!verifiedAccount)
      throw new BadRequestException(
        'The provided verification code is invalid',
      );
    if (verifiedAccount.status === EAccountStatus[EAccountStatus.ACTIVE])
      throw new BadRequestException('This is already verified');
    verifiedAccount.status = EAccountStatus[EAccountStatus.ACTIVE];
    verifiedAccount.loginStatus = ELoginStatus[ELoginStatus.VERIFIED];

    const updatedAccount: Profile = await this.userRepo.save(verifiedAccount);

    const tokens = await this.utilsService.getTokens(updatedAccount);
    delete updatedAccount.password;
    delete updatedAccount.activationCode;
    return { tokens, user: updatedAccount };
  }

  async resetPassword(code: number, newPassword: string) {
    const account = await this.getUserByVerificationCode(code);
    if (!account)
      throw new BadRequestException(
        'The provided code is invalid does not exist',
      );
    if (
      account.status == EAccountStatus[EAccountStatus.WAIT_EMAIL_VERIFICATION]
    )
      throw new BadRequestException(
        "Please first verify your account and we'll help you to remember your password later",
      );
    account.password = await this.utilsService.hashString(
      newPassword.toString(),
    );
    const savedUser = await this.userRepo.save(account);
    const tokens = await this.utilsService.getTokens(account);
    delete savedUser.password;
    delete savedUser.activationCode;
    return { tokens, user: savedUser };
  }

  async getVerificationCode(email: string, reset: boolean) {
    const account = await this.getUserByEmail(email);
    if (!account) throw new BadRequestException('This account does not exist');
    if (
      account.status == EAccountStatus[EAccountStatus.WAIT_EMAIL_VERIFICATION]
    )
      throw new BadRequestException(
        "Please first verify your account and we'll help you to remember your password later",
      );
    account.activationCode = this.generateRandomFourDigitNumber();
    if (reset) account.status = EAccountStatus[EAccountStatus.INACTIVE];
    await this.userRepo.save(account);
    this.mailingService.sendEmail('', 'get-code', email, account);
  }
  async createUser(body: CreateUserDto) {
    let { email, registercode } = body;
    if (registercode != process.env.ADMIN_KEY) {
      return new UnauthorizedException('Incorrect Registration Key');
    }
    const userFetched = await this.existsByEmail(email);
    if (userFetched) return new UnauthorizedException('Email already exists');

    // let userGender = this.utilsService.getGender(gender);
    try {
      const role = await this.roleService.getRoleByName(ERole[ERole.ADMIN]);
      const password = await this.utilsService.hashString(body.password);
      const userToCreate = new Profile(email, password);
      userToCreate.activationCode = this.generateRandomFourDigitNumber();
      const userEntity = this.userRepo.create(userToCreate);
      const createdEnity: Profile = await this.userRepo.save({
        ...userEntity,
        roles: [role],
      });
      await this.mailingService.sendEmail(
        '',
        'verify-email',
        email,
        createdEnity,
      );
      return {
        success: true,
        message: `We have sent a verification code to your inbox , please verify your account`,
      };
    } catch (error: any) {
      throw error;
    }
  }
  async verifyProfile(code: number) {
    try {
    } catch (error) {
      console.log(error);
    }
  }

  async createProfile(email: string, password: string, role: any) {
    try {
      const profile: Profile = new Profile(email, password);
      const profileEntity = await this.userRepo.create(profile);
      profile.activationCode = this.generateRandomFourDigitNumber();
      return this.userRepo.save({
        ...profileEntity,
        roles: [role],
      });
    } catch (error) {
      console.log(error);
    }
  }
  async updateUser(id: UUID, attrs: Partial<Profile>) {
    const user = await this.getUserById(id, 'User');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, attrs);
    return this.userRepo.save(user);
  }
  async assignRoleToUser(userId: UUID, roleName: any, userType: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const role = this.roleService.roleRepo.findOne({
      where: { role_name: roleName },
    });
    if (!role)
      throw new NotFoundException(
        'The role with the provided id is not foound',
      );

    let roles = [];
    roles = user.roles;
    roles.push(role);
    user.roles = roles;
    switch (userType.toUpperCase()) {
      case EUserType[EUserType.USER]:
      case EUserType[EUserType.ADMIN]:
      default:
        throw new BadRequestException('The provided userType is invalid');
    }
  }

  async deleteUser(id: UUID) {
    const user = await this.getUserById(id, 'User');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.userRepo.remove(user);
    return user;
  }

  async saveExistingProfile(profile: Profile, role: Role) {
    try {
      return await this.userRepo.save({
        ...profile,
        roles: [role],
      });
    } catch (error) {
      console.log(error);
    }
  }
}
