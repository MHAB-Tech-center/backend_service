import { Test, TestingModule } from '@nestjs/testing';
import { InspectorsService } from './inspectors.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspector } from 'src/entities/inspector.entity';
import { CreateInspectorDTO } from './dtos/createInspector.dto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { UtilsService } from 'src/utils/utils.service';
import { MailingService } from 'src/integrations/mailing/mailing.service';
import { UsersService } from '../users/users.service';
import { MinesiteService } from '../minesite/minesite.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RoleService } from '../roles/roles.service';
import { InviteUser } from 'src/common/dtos/invite-user.dto';
import { ERole } from 'src/common/Enum/ERole.enum';
import { Request } from 'express';
import {
  MOCK_UUID,
  MOCK_INSPECTOR,
  MOCK_OLD_INSPECTOR,
  MOCK_PROFILE,
  MOCK_MINESITE,
  MOCK_CREATE_INSPECTOR_DTO,
  MOCK_INVITE_USER_DTO,
  MOCK_FILE,
  MOCK_ROLE,
} from 'src/common/constants/mock.constant';

describe('InspectorsService', () => {
  let service: InspectorsService;

  const mockInspectorRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    exist: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockUtilsService = {
    hashString: jest.fn(),
    getGender: jest.fn(),
    getInspectorRole: jest.fn(),
    getLoggedInProfile: jest.fn(),
  };

  const mockMailingService = {
    sendEmail: jest.fn(),
  };

  const mockUsersService = {
    existsByEmail: jest.fn(),
    getOneByEmail: jest.fn(),
    saveExistingProfile: jest.fn(),
    getUserById: jest.fn(),
    getDefaultPassword: jest.fn(),
    generateRandomFourDigitNumber: jest.fn(),
  };

  const mockMinesiteService = {
    findById: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
  };

  const mockRoleService = {
    getRoleByName: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectorsService,
        {
          provide: getRepositoryToken(Inspector),
          useValue: mockInspectorRepository,
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
        {
          provide: MailingService,
          useValue: mockMailingService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: MinesiteService,
          useValue: mockMinesiteService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
      ],
    }).compile();

    service = module.get<InspectorsService>(InspectorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all inspectors', async () => {
      const mockInspectors = [MOCK_INSPECTOR];

      mockInspectorRepository.find.mockResolvedValue(mockInspectors);

      const result = await service.getAll();

      expect(result).toEqual(mockInspectors);
      expect(mockInspectorRepository.find).toHaveBeenCalledWith({});
    });
  });

  describe('getByEmail', () => {
    it('should return an inspector by email', async () => {
      mockInspectorRepository.findOne.mockResolvedValue(MOCK_INSPECTOR);

      const result = await service.getByEmail(MOCK_INSPECTOR.email);

      expect(result).toEqual(MOCK_INSPECTOR);
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { email: MOCK_INSPECTOR.email },
      });
    });
  });

  describe('existsByEmail', () => {
    it('should return true when inspector exists', async () => {
      mockInspectorRepository.exist.mockResolvedValue(true);

      const result = await service.existsByEmail(MOCK_INSPECTOR.email);

      expect(result).toBe(true);
      expect(mockInspectorRepository.exist).toHaveBeenCalledWith({
        where: { email: MOCK_INSPECTOR.email },
      });
    });

    it('should return false when inspector does not exist', async () => {
      mockInspectorRepository.exist.mockResolvedValue(false);

      const result = await service.existsByEmail(MOCK_INSPECTOR.email);

      expect(result).toBe(false);
      expect(mockInspectorRepository.exist).toHaveBeenCalledWith({
        where: { email: MOCK_INSPECTOR.email },
      });
    });
  });

  describe('create', () => {
    it('should create an inspector successfully', async () => {
      mockUtilsService.hashString.mockResolvedValue('hashedPassword');
      mockUsersService.existsByEmail.mockResolvedValue(true);
      mockUsersService.getOneByEmail.mockResolvedValue(MOCK_PROFILE);
      mockMinesiteService.findById.mockResolvedValue(MOCK_MINESITE);
      mockCloudinaryService.uploadImage.mockResolvedValue({ url: 'test-url' });
      mockUsersService.saveExistingProfile.mockResolvedValue(MOCK_PROFILE);
      mockInspectorRepository.save.mockResolvedValue(MOCK_INSPECTOR);

      const result = await service.create(MOCK_CREATE_INSPECTOR_DTO, MOCK_FILE);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Thank you for setting up your profile, go and login',
      );
      expect(mockUtilsService.hashString).toHaveBeenCalledWith(
        MOCK_CREATE_INSPECTOR_DTO.password,
      );
      expect(mockUsersService.existsByEmail).toHaveBeenCalledWith(
        MOCK_CREATE_INSPECTOR_DTO.email,
      );
      expect(mockUsersService.getOneByEmail).toHaveBeenCalledWith(
        MOCK_CREATE_INSPECTOR_DTO.email,
      );
      expect(mockMinesiteService.findById).toHaveBeenCalledWith(
        MOCK_CREATE_INSPECTOR_DTO.minesiteId,
      );
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(MOCK_FILE);
      expect(mockUsersService.saveExistingProfile).toHaveBeenCalled();
      expect(mockInspectorRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockUsersService.existsByEmail.mockResolvedValue(false);

      await expect(
        service.create(MOCK_CREATE_INSPECTOR_DTO, null),
      ).rejects.toThrow(
        new NotFoundException(
          'The profile you are trying to set up is not found',
        ),
      );
      expect(mockUsersService.existsByEmail).toHaveBeenCalledWith(
        MOCK_CREATE_INSPECTOR_DTO.email,
      );
    });

    it('should throw BadRequestException when file upload fails', async () => {
      mockUsersService.existsByEmail.mockResolvedValue(true);
      mockUsersService.getOneByEmail.mockResolvedValue(MOCK_PROFILE);
      mockMinesiteService.findById.mockResolvedValue(MOCK_MINESITE);
      mockCloudinaryService.uploadImage.mockRejectedValue(new Error());

      await expect(
        service.create(MOCK_CREATE_INSPECTOR_DTO, MOCK_FILE),
      ).rejects.toThrow(new BadRequestException('Invalid file type.'));
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(MOCK_FILE);
    });
  });

  describe('update', () => {
    it('should update an inspector successfully', async () => {
      mockUsersService.getUserById.mockResolvedValue(MOCK_PROFILE);
      mockInspectorRepository.findOne.mockResolvedValue(MOCK_OLD_INSPECTOR);
      mockUsersService.saveExistingProfile.mockResolvedValue(MOCK_PROFILE);
      mockInspectorRepository.save.mockResolvedValue({
        ...MOCK_OLD_INSPECTOR,
        firstName: MOCK_CREATE_INSPECTOR_DTO.firstName,
        lastName: MOCK_CREATE_INSPECTOR_DTO.lastName,
        email: MOCK_CREATE_INSPECTOR_DTO.email,
        phoneNumber: MOCK_CREATE_INSPECTOR_DTO.phonenumber,
        nationalId: MOCK_CREATE_INSPECTOR_DTO.national_id,
      });

      const result = await service.update(MOCK_UUID, MOCK_CREATE_INSPECTOR_DTO);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Inspector was updated successfully');
      expect(mockUsersService.getUserById).toHaveBeenCalledWith(
        MOCK_UUID,
        'User',
      );
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { email: MOCK_CREATE_INSPECTOR_DTO.email },
      });
      expect(mockUsersService.saveExistingProfile).toHaveBeenCalled();
      expect(mockInspectorRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when inspector not found', async () => {
      mockUsersService.getUserById.mockResolvedValue(null);
      mockInspectorRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(MOCK_UUID, MOCK_CREATE_INSPECTOR_DTO),
      ).rejects.toThrow(
        new NotFoundException('An inspector with the provided email not found'),
      );
      expect(mockUsersService.getUserById).toHaveBeenCalledWith(
        MOCK_UUID,
        'User',
      );
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { email: MOCK_CREATE_INSPECTOR_DTO.email },
      });
    });
  });

  describe('inviteInspector', () => {
    it('should invite an inspector successfully', async () => {
      mockUsersService.existsByEmail.mockResolvedValue(false);
      mockUsersService.getDefaultPassword.mockResolvedValue('password123');
      mockRoleService.getRoleByName.mockResolvedValue(MOCK_ROLE);
      mockUsersService.generateRandomFourDigitNumber.mockReturnValue('1234');
      mockUsersService.saveExistingProfile.mockResolvedValue(MOCK_PROFILE);
      mockMailingService.sendEmail.mockResolvedValue(undefined);

      const result = await service.inviteInspector(MOCK_INVITE_USER_DTO);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "We have sent an invitation link to the inspector's email",
      );
      expect(mockUsersService.existsByEmail).toHaveBeenCalledWith(
        MOCK_INVITE_USER_DTO.email,
      );
      expect(mockUsersService.getDefaultPassword).toHaveBeenCalled();
      expect(mockRoleService.getRoleByName).toHaveBeenCalledWith(
        ERole[ERole.INSPECTOR],
      );
      expect(mockUsersService.generateRandomFourDigitNumber).toHaveBeenCalled();
      expect(mockUsersService.saveExistingProfile).toHaveBeenCalled();
      expect(mockMailingService.sendEmail).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when inspector already exists', async () => {
      mockUsersService.existsByEmail.mockResolvedValue(true);

      await expect(
        service.inviteInspector(MOCK_INVITE_USER_DTO),
      ).rejects.toThrow(new ForbiddenException('An inspector already exists'));
      expect(mockUsersService.existsByEmail).toHaveBeenCalledWith(
        MOCK_INVITE_USER_DTO.email,
      );
    });
  });

  describe('getLoggedInInspector', () => {
    it('should return the logged in inspector', async () => {
      const mockRequest = {} as Request;

      mockUtilsService.getLoggedInProfile.mockResolvedValue(MOCK_PROFILE);
      mockInspectorRepository.findOne.mockResolvedValue(MOCK_INSPECTOR);

      const result = await service.getLoggedInInspector(mockRequest);

      expect(result).toEqual(MOCK_INSPECTOR);
      expect(mockUtilsService.getLoggedInProfile).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { email: MOCK_PROFILE.email.toString() },
      });
    });
  });

  describe('getById', () => {
    it('should return an inspector by id', async () => {
      mockInspectorRepository.findOne.mockResolvedValue(MOCK_INSPECTOR);

      const result = await service.getById(MOCK_UUID);

      expect(result).toEqual(MOCK_INSPECTOR);
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: MOCK_UUID },
      });
    });

    it('should throw NotFoundException when inspector not found', async () => {
      mockInspectorRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(MOCK_UUID)).rejects.toThrow(
        new NotFoundException(
          'The Inspector with the provided id is not found',
        ),
      );
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: MOCK_UUID },
      });
    });
  });

  describe('countAllByProvince', () => {
    it('should return the count of inspectors in a province', async () => {
      mockInspectorRepository.count.mockResolvedValue(5);

      const result = await service.countAllByProvince(MOCK_INSPECTOR.province);

      expect(result).toBe(5);
      expect(mockInspectorRepository.count).toHaveBeenCalledWith({
        where: { province: MOCK_INSPECTOR.province },
      });
    });
  });

  describe('findById', () => {
    it('should return an inspector by id', async () => {
      mockInspectorRepository.findOne.mockResolvedValue(MOCK_INSPECTOR);

      const result = await service.findById(MOCK_UUID);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('The inspector was retrieved successfully');
      expect(result.data).toEqual(MOCK_INSPECTOR);
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: MOCK_UUID },
      });
    });

    it('should throw NotFoundException when inspector not found', async () => {
      mockInspectorRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(MOCK_UUID)).rejects.toThrow(
        new NotFoundException(
          'The Inspector with the provided id is not found',
        ),
      );
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: MOCK_UUID },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return an inspector by email', async () => {
      mockInspectorRepository.findOne.mockResolvedValue(MOCK_INSPECTOR);

      const result = await service.findByEmail(MOCK_INSPECTOR.email);

      expect(result).toEqual(MOCK_INSPECTOR);
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { email: MOCK_INSPECTOR.email },
      });
    });

    it('should throw NotFoundException when inspector not found', async () => {
      mockInspectorRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEmail(MOCK_INSPECTOR.email)).rejects.toThrow(
        new NotFoundException(
          'The Inspector with the available profile is not found',
        ),
      );
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { email: MOCK_INSPECTOR.email },
      });
    });
  });

  describe('delete', () => {
    it('should delete an inspector successfully', async () => {
      mockInspectorRepository.findOne.mockResolvedValue(MOCK_INSPECTOR);
      mockInspectorRepository.remove.mockResolvedValue(MOCK_INSPECTOR);

      const result = await service.delete(MOCK_UUID);

      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('An inspector was deleted successfully');
      expect(result.data).toEqual(MOCK_INSPECTOR);
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: MOCK_UUID },
      });
      expect(mockInspectorRepository.remove).toHaveBeenCalledWith(
        MOCK_INSPECTOR,
      );
    });

    it('should throw NotFoundException when inspector not found', async () => {
      mockInspectorRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(MOCK_UUID)).rejects.toThrow(
        new NotFoundException(
          'The Inspector with the provided id is not found',
        ),
      );
      expect(mockInspectorRepository.findOne).toHaveBeenCalledWith({
        where: { id: MOCK_UUID },
      });
    });
  });
});
