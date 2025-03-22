import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UtilsService } from './utils.service';
import { UsersService } from '../modules/users/users.service';
import { RoleService } from '../modules/roles/roles.service';
import { BrainService } from '../integrations/brain/brain.service';
import { Profile } from '../entities/profile.entity';
import { Role } from '../entities/role.entity';
import { ERole } from '../common/Enum/ERole.enum';
import { EGender } from '../common/Enum/EGender.enum';
import { EInspectionStatus } from '../common/Enum/EInspectionStatus.enum';
import { EInspectorRole } from '../common/Enum/EInspectorRole.enum';
import { VALIDATION_MESSAGES, VALIDATION_VALUES } from '../common/constants';

describe('UtilsService', () => {
  let service: UtilsService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userService: UsersService;
  let roleService: RoleService;
  let brainService: BrainService;

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUserService = {
    getOneByEmail: jest.fn(),
    getUserById: jest.fn(),
  };

  const mockRoleService = {
    getRoleByName: jest.fn(),
  };

  const mockBrainService = {
    getCacheKey: jest.fn(),
    remindMe: jest.fn(),
    memorize: jest.fn(),
    forget: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilsService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUserService,
        },
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
        {
          provide: BrainService,
          useValue: mockBrainService,
        },
      ],
    }).compile();

    service = module.get<UtilsService>(UtilsService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    userService = module.get<UsersService>(UsersService);
    roleService = module.get<RoleService>(RoleService);
    brainService = module.get<BrainService>(BrainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const mockUser: Profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roles: [
          {
            id: 1,
            role_name: 'user',
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

      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';

      mockJwtService.signAsync
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);
      mockConfigService.get.mockReturnValue('secret-key');

      const result = await service.getTokens(mockUser);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockConfigService.get).toHaveBeenCalledWith('SECRET_KEY');
    });
  });

  describe('hashString', () => {
    it('should hash a string', async () => {
      const input = 'test-password';
      const result = await service.hashString(input);

      expect(result).toBeDefined();
      expect(result).not.toBe(input);
      expect(typeof result).toBe('string');
    });

    it('should handle non-string input', async () => {
      const result = await service.hashString(null);
      expect(result).toBeUndefined();
    });
  });

  describe('getRole', () => {
    it('should return cached role if available', async () => {
      const mockRole: Role = {
        id: 1,
        role_name: 'inspector',
        users: [],
        createdBy: 'admin',
        updatedBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        is_active: true,
        is_deleted: false,
        deleted_at: null,
        deletedBy: null,
      } as Role;

      const cacheKey = 'role:inspector';

      mockBrainService.getCacheKey.mockReturnValue(cacheKey);
      mockBrainService.remindMe.mockResolvedValue(mockRole);

      const result = await service.getRole('inspector');

      expect(result).toEqual(mockRole);
      expect(mockBrainService.memorize).not.toHaveBeenCalled();
    });

    it('should fetch and cache role if not available', async () => {
      const mockRole: Role = {
        id: 1,
        role_name: ERole[ERole.INSPECTOR],
        users: [],
        createdBy: 'admin',
        updatedBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        is_active: true,
        is_deleted: false,
        deleted_at: null,
        deletedBy: null,
      } as Role;

      const cacheKey = 'role:inspector';

      mockBrainService.getCacheKey.mockReturnValue(cacheKey);
      mockBrainService.remindMe.mockResolvedValue(null);
      mockRoleService.getRoleByName.mockResolvedValue(mockRole);

      const result = await service.getRole('inspector');

      expect(result).toEqual(mockRole);
      expect(mockBrainService.memorize).toHaveBeenCalledWith(
        cacheKey,
        mockRole,
        expect.any(Number),
      );
    });

    it('should throw BadRequestException for invalid role', async () => {
      mockBrainService.getCacheKey.mockReturnValue('role:invalid');
      mockBrainService.remindMe.mockResolvedValue(null);

      await expect(service.getRole('invalid')).rejects.toThrow(
        VALIDATION_MESSAGES.INVALID_ROLE,
      );
    });
  });

  describe('getGender', () => {
    it('should return correct gender enum for male', () => {
      const result = service.getGender(VALIDATION_VALUES.GENDER.MALE);
      expect(result).toBe(EGender[EGender.MALE]);
    });

    it('should return correct gender enum for female', () => {
      const result = service.getGender(VALIDATION_VALUES.GENDER.FEMALE);
      expect(result).toBe(EGender[EGender.FEMALE]);
    });

    it('should throw BadRequestException for invalid gender', () => {
      expect(() => service.getGender('invalid')).toThrow(
        VALIDATION_MESSAGES.INVALID_GENDER,
      );
    });
  });

  describe('getInspectionStatus', () => {
    it('should return correct status enum for submitted', () => {
      const result = service.getInspectionStatus(
        VALIDATION_VALUES.INSPECTION_STATUS.SUBMITTED,
      );
      expect(result).toBe(EInspectionStatus.SUBMITTED);
    });

    it('should return correct status enum for concluded', () => {
      const result = service.getInspectionStatus(
        VALIDATION_VALUES.INSPECTION_STATUS.CONCLUDED,
      );
      expect(result).toBe(EInspectionStatus.CONCLUDED);
    });

    it('should return correct status enum for reviewed', () => {
      const result = service.getInspectionStatus(
        VALIDATION_VALUES.INSPECTION_STATUS.REVIEWED,
      );
      expect(result).toBe(EInspectionStatus.REVIEWED);
    });

    it('should throw BadRequestException for invalid status', () => {
      expect(() => service.getInspectionStatus('invalid')).toThrow(
        VALIDATION_MESSAGES.INVALID_INSPECTION_STATUS,
      );
    });
  });

  describe('getInspectorRole', () => {
    it('should return correct role enum for inspector', () => {
      const result = service.getInspectorRole(
        VALIDATION_VALUES.INSPECTOR_ROLE.INSPECTOR,
      );
      expect(result).toBe(EInspectorRole[EInspectorRole.INSPECTOR]);
    });

    it('should return correct role enum for environmentalist', () => {
      const result = service.getInspectorRole(
        VALIDATION_VALUES.INSPECTOR_ROLE.ENVIRONMENTALIST,
      );
      expect(result).toBe(EInspectorRole[EInspectorRole.ENVIRONMENTALIST]);
    });

    it('should return correct role enum for supervisor', () => {
      const result = service.getInspectorRole(
        VALIDATION_VALUES.INSPECTOR_ROLE.SUPERVISOR,
      );
      expect(result).toBe(EInspectorRole[EInspectorRole.INSPECTOR]);
    });

    it('should throw BadRequestException for invalid role', () => {
      expect(() => service.getInspectorRole('invalid')).toThrow(
        VALIDATION_MESSAGES.INVALID_INSPECTOR_ROLE,
      );
    });
  });

  describe('getUserFromRequest', () => {
    it('should return cached user if available', async () => {
      const mockUser: Profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roles: [
          {
            id: 1,
            role_name: 'user',
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

      const mockToken = 'valid-token';
      const mockPayload = { sub: '1' };
      const cacheKey = 'user:1';

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockBrainService.getCacheKey.mockReturnValue(cacheKey);
      mockBrainService.remindMe.mockResolvedValue(mockUser);

      const request = {
        headers: { authorization: `Bearer ${mockToken}` },
      } as any;

      const result = await service.getUserFromRequest(request);

      expect(result).toEqual(mockUser);
      expect(mockBrainService.memorize).not.toHaveBeenCalled();
    });

    it('should fetch and cache user if not available', async () => {
      const mockUser: Profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        roles: [
          {
            id: 1,
            role_name: 'user',
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

      const mockToken = 'valid-token';
      const mockPayload = { sub: '1' };
      const cacheKey = 'user:1';

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockBrainService.getCacheKey.mockReturnValue(cacheKey);
      mockBrainService.remindMe.mockResolvedValue(null);
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const request = {
        headers: { authorization: `Bearer ${mockToken}` },
      } as any;

      const result = await service.getUserFromRequest(request);

      expect(result).toEqual(mockUser);
      expect(mockBrainService.memorize).toHaveBeenCalledWith(
        cacheKey,
        mockUser,
        expect.any(Number),
      );
    });

    it('should throw UnauthorizedException for missing token', async () => {
      const request = {
        headers: {},
      } as any;

      await expect(service.getUserFromRequest(request)).rejects.toThrow(
        VALIDATION_MESSAGES.NO_TOKEN,
      );
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'test-password';
      const result = await service.hashPassword(password);

      expect(result).toBeDefined();
      expect(result).not.toBe(password);
      expect(typeof result).toBe('string');
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'test-password';
      const hashedPassword = await service.hashPassword(password);
      const result = await service.comparePasswords(password, hashedPassword);

      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'test-password';
      const hashedPassword = await service.hashPassword(password);
      const result = await service.comparePasswords(
        'wrong-password',
        hashedPassword,
      );

      expect(result).toBe(false);
    });
  });

  describe('generateJwtToken', () => {
    it('should generate JWT token', () => {
      const payload = { userId: '1' };
      const mockToken = 'generated-token';

      mockJwtService.sign.mockReturnValue(mockToken);
      mockConfigService.get
        .mockReturnValueOnce('jwt-secret')
        .mockReturnValueOnce('1h');

      const result = service.generateJwtToken(payload);

      expect(result).toBe(mockToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(payload, {
        secret: 'jwt-secret',
        expiresIn: '1h',
      });
    });
  });

  describe('clearCache', () => {
    it('should clear cache for given pattern', async () => {
      const pattern = 'test-pattern';
      await service.clearCache(pattern);
      expect(mockBrainService.forget).toHaveBeenCalledWith(pattern);
    });
  });
});
