import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let configService: ConfigService;
  let reflector: Reflector;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
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
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    reflector = module.get<Reflector>(Reflector);
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

    it('should allow access to public routes', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [mockExecutionContext.getHandler(), mockExecutionContext.getClass()],
      );
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException(
          'You are not authorized to access this resource',
        ),
      );
    });

    it('should allow access when valid token is provided', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };
      (
        mockExecutionContext.switchToHttp().getRequest as jest.Mock
      ).mockReturnValue(mockRequest);

      const mockUser = { id: 1, email: 'test@example.com' };
      mockJwtService.verifyAsync.mockResolvedValue(mockUser);
      mockConfigService.get.mockReturnValue('secret-key');

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest['user']).toEqual(mockUser);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'secret-key',
      });
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      (
        mockExecutionContext.switchToHttp().getRequest as jest.Mock
      ).mockReturnValue({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      mockJwtService.verifyAsync.mockRejectedValue(
        new Error('Token verification failed'),
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException(
          'You are not authorized to access this resource',
        ),
      );
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid authorization header', () => {
      const request = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const result = guard['extractTokenFromHeader'](request);
      expect(result).toBe('valid-token');
    });

    it('should return undefined when no authorization header is present', () => {
      const request = {
        headers: {},
      };

      const result = guard['extractTokenFromHeader'](request);
      expect(result).toBeUndefined();
    });

    it('should return undefined when authorization header has invalid format', () => {
      const request = {
        headers: {
          authorization: 'InvalidFormat token',
        },
      };

      const result = guard['extractTokenFromHeader'](request);
      expect(result).toBeUndefined();
    });
  });
});
