import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UtilsService } from '../../utils/utils.service';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { ResetPasswordDTO } from 'src/common/dtos/reset-password.dto';
import { Profile } from 'src/entities/profile.entity';

describe('AuthService', () => {
  let service: AuthService;
  let utilsService: UtilsService;

  const mockUtilsService = {
    getLoggedInProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    utilsService = module.get<UtilsService>(UtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile when valid token is provided', async () => {
      const mockProfile: Profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roles: [],
        last_login: new Date(),
        profile_pic: 'profile.jpg',
        password: 'hashed-password',
        activationCode: 123456,
        status: 'active',
        loginStatus: 'online',
        createdBy: 'admin',
        updatedBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Profile;

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      } as Request;

      mockUtilsService.getLoggedInProfile.mockResolvedValue(mockProfile);

      const result = await service.getProfile(mockRequest);
      expect(result).toEqual(mockProfile);
      expect(mockUtilsService.getLoggedInProfile).toHaveBeenCalledWith(
        mockRequest,
      );
    });

    it('should return error when invalid token is provided', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      } as Request;

      const mockError = new UnauthorizedException('Invalid token');
      mockUtilsService.getLoggedInProfile.mockRejectedValue(mockError);

      const result = await service.getProfile(mockRequest);
      expect(result).toEqual(mockError);
      expect(mockUtilsService.getLoggedInProfile).toHaveBeenCalledWith(
        mockRequest,
      );
    });
  });

  describe('verifyProfile', () => {
    it('should verify profile with valid code', async () => {
      const mockRequest = {
        body: {
          code: 123456,
        },
      } as Request;

      const result = await service.verifyProfile(mockRequest);
      expect(result).toBeUndefined(); // Currently the method is not implemented
    });
  });

  describe('changePassword', () => {
    it('should change password with valid data', async () => {
      const dto: ResetPasswordDTO = {
        code: 123456,
        newPassword: 'newPassword123',
      };

      const result = await service.changePassword(dto);
      expect(result).toBeUndefined(); // Currently the method is not implemented
    });
  });
});
