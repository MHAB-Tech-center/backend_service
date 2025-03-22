import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDTO } from 'src/common/dtos/lodin.dto';
import { VerifyLoginDTO } from 'src/common/dtos/verify-login.dto';
import { VerifyAccountDTO } from 'src/common/dtos/verify-account.dto';
import { ResetPasswordDTO } from 'src/common/dtos/reset-password.dto';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { Request } from 'express';
import { Profile } from 'src/entities/profile.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  const mockAuthService = {
    getProfile: jest.fn(),
  };

  const mockUsersService = {
    login: jest.fn(),
    verifyLogin: jest.fn(),
    verifyAccount: jest.fn(),
    getVerificationCode: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should handle login successfully', async () => {
      const dto: LoginDTO = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = new ApiResponse(
        true,
        'We have sent a verification code to your email',
        { success: true },
      );

      mockUsersService.login.mockResolvedValue({ success: true });

      const result = await controller.login(dto);

      expect(result).toEqual(
        new ApiResponse(
          true,
          'We have sent a verification code to your email',
          { success: true },
        ),
      );
      expect(mockUsersService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyLogin', () => {
    it('should verify login successfully', async () => {
      const dto: VerifyLoginDTO = {
        email: 'test@example.com',
        password: 'password123',
        activationCode: 123456,
      };

      const mockResponse = new ApiResponse(
        true,
        'Login verified successfully',
        { token: 'mock-token' },
      );

      mockUsersService.verifyLogin.mockResolvedValue(mockResponse);

      const result = await controller.verifyLogin(dto);

      expect(result).toEqual(mockResponse);
      expect(mockUsersService.verifyLogin).toHaveBeenCalledWith(dto);
    });
  });

  describe('VerifyAccount', () => {
    it('should verify account successfully', async () => {
      const dto: VerifyAccountDTO = {
        verificationCode: 123456,
      };

      const mockResponse = new ApiResponse(
        true,
        'Your account is verified successfully',
        { success: true },
      );

      mockUsersService.verifyAccount.mockResolvedValue({ success: true });

      const result = await controller.VerifyAccount(dto);

      expect(result).toEqual(
        new ApiResponse(true, 'Your account is verified successfully', {
          success: true,
        }),
      );
      expect(mockUsersService.verifyAccount).toHaveBeenCalledWith(
        dto.verificationCode,
      );
    });
  });

  describe('getVerificationCode', () => {
    it('should get verification code successfully', async () => {
      const email = 'test@example.com';

      const mockResponse = new ApiResponse(
        true,
        'We have sent a verification code to your email',
        { success: true },
      );

      mockUsersService.getVerificationCode.mockResolvedValue({ success: true });

      const result = await controller.getVerificationCode(email);

      expect(result).toEqual(
        new ApiResponse(
          true,
          'We have sent a verification code to your email',
          { success: true },
        ),
      );
      expect(mockUsersService.getVerificationCode).toHaveBeenCalledWith(
        email,
        true,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const dto: ResetPasswordDTO = {
        code: 123456,
        newPassword: 'newpassword123',
      };

      const mockResponse = new ApiResponse(
        true,
        'Your password was rest successfully ',
        { success: true },
      );

      mockUsersService.resetPassword.mockResolvedValue({ success: true });

      const result = await controller.resetPassword(dto);

      expect(result).toEqual(
        new ApiResponse(true, 'Your password was rest successfully ', {
          success: true,
        }),
      );
      expect(mockUsersService.resetPassword).toHaveBeenCalledWith(
        dto.code,
        dto.newPassword,
      );
    });
  });

  describe('getProfile', () => {
    it('should get profile successfully', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer mock-token',
        },
      } as Request;

      const mockProfile = new Profile('test@example.com', 'password123');
      mockProfile.email = 'test@example.com';

      mockAuthService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockProfile);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith(mockRequest);
    });
  });
});
