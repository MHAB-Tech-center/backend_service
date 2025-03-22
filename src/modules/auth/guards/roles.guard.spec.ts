import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { Profile } from 'src/entities/profile.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let jwtService: JwtService;
  let configService: ConfigService;
  let reflector: Reflector;
  let usersService: UsersService;

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockUsersService = {
    getOneByEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    reflector = module.get<Reflector>(Reflector);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;

    beforeEach(() => {
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
    });

    it('should allow access when no roles are required', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should throw UnauthorizedException when no authorization header is present', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException(
          'Please you are not authorized to access resource',
        ),
      );
    });

    it('should throw UnauthorizedException when token format is invalid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      (
        mockExecutionContext.switchToHttp().getRequest as jest.Mock
      ).mockReturnValue({
        headers: {
          authorization: 'InvalidFormat token',
        },
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('The provided token is invalid'),
      );
    });

    it('should allow access when user has required role', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };
      (
        mockExecutionContext.switchToHttp().getRequest as jest.Mock
      ).mockReturnValue(mockRequest);

      const mockPayload = { email: 'test@example.com' };
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockConfigService.get.mockReturnValue('secret-key');

      const mockUser: Profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roles: [
          {
            id: 1,
            role_name: 'ADMIN',
            users: [],
            createdBy: 'admin',
            updatedBy: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
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

      mockUsersService.getOneByEmail.mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest['user']).toEqual(mockPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'secret-key',
      });
      expect(mockUsersService.getOneByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should throw UnauthorizedException when user does not have required role', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      (
        mockExecutionContext.switchToHttp().getRequest as jest.Mock
      ).mockReturnValue({
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const mockPayload = { email: 'test@example.com' };
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockConfigService.get.mockReturnValue('secret-key');

      const mockUser: Profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roles: [
          {
            id: 1,
            role_name: 'USER',
            users: [],
            createdBy: 'admin',
            updatedBy: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
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

      mockUsersService.getOneByEmail.mockResolvedValue(mockUser);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('This resource is only for ADMIN'),
      );
    });
  });
});
