import { Test, TestingModule } from '@nestjs/testing';
import { RMBStaffService } from './rmb-staff.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RMBStaffMember } from 'src/entities/RMBStaffMember.entity';
import { RMBRole } from 'src/entities/RMBRole.entity';
import { UUID } from 'crypto';
import { CreateRMBStaffMemberDTO } from './dtos/create-rmb-member.dto';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RoleService } from '../roles/roles.service';
import { MailingService } from 'src/integrations/mailing/mailing.service';
import { UtilsService } from 'src/utils/utils.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EUserStatus } from 'src/common/Enum/EUserStatus.enum';
import { EAccountStatus } from 'src/common/Enum/EAccountStatus.enum';
import { ERole } from 'src/common/Enum/ERole.enum';
import { InviteUser } from 'src/common/dtos/invite-user.dto';
import { AssignFeaturesDTO } from './dtos/assignFeatures.dto';

describe('RMBStaffService', () => {
  let service: RMBStaffService;
  let rmbStaffRepository: Repository<RMBStaffMember>;
  let rmbRoleRepository: Repository<RMBRole>;
  let usersService: UsersService;
  let roleService: RoleService;
  let mailingService: MailingService;
  let utilsService: UtilsService;
  let cloudinaryService: CloudinaryService;

  const mockRmbStaffRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  const mockRmbRoleRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  const mockUsersService = {
    existsByEmail: jest.fn(),
    getOneByEmail: jest.fn(),
    saveExistingProfile: jest.fn(),
    generateRandomFourDigitNumber: jest.fn(),
  };

  const mockRoleService = {
    getRoleByName: jest.fn(),
  };

  const mockMailingService = {
    sendEmail: jest.fn(),
  };

  const mockUtilsService = {
    hashString: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RMBStaffService,
        {
          provide: getRepositoryToken(RMBStaffMember),
          useValue: mockRmbStaffRepository,
        },
        {
          provide: getRepositoryToken(RMBRole),
          useValue: mockRmbRoleRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
        {
          provide: MailingService,
          useValue: mockMailingService,
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<RMBStaffService>(RMBStaffService);
    rmbStaffRepository = module.get<Repository<RMBStaffMember>>(
      getRepositoryToken(RMBStaffMember),
    );
    rmbRoleRepository = module.get<Repository<RMBRole>>(
      getRepositoryToken(RMBRole),
    );
    usersService = module.get<UsersService>(UsersService);
    roleService = module.get<RoleService>(RoleService);
    mailingService = module.get<MailingService>(MailingService);
    utilsService = module.get<UtilsService>(UtilsService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all RMB staff members', async () => {
      const mockRmbStaffList: RMBStaffMember[] = [
        new RMBStaffMember(
          'John',
          'Doe',
          'john.doe@example.com',
          new Date(),
          '1234567890',
          '123456789',
          'Test Province',
          'Test District',
        ),
      ];

      mockRmbStaffRepository.find.mockResolvedValue(mockRmbStaffList);

      const result = await service.getAll();

      expect(result).toEqual(mockRmbStaffList);
      expect(mockRmbStaffRepository.find).toHaveBeenCalledWith({});
    });
  });

  describe('getAllPending', () => {
    it('should return all pending RMB staff members', async () => {
      const mockRmbStaffList: [RMBStaffMember[], number] = [
        [
          new RMBStaffMember(
            'John',
            'Doe',
            'john.doe@example.com',
            new Date(),
            '1234567890',
            '123456789',
            'Test Province',
            'Test District',
          ),
        ],
        1,
      ];

      mockRmbStaffRepository.findAndCount.mockResolvedValue(mockRmbStaffList);

      const result = await service.getAllPending();

      expect(result).toEqual(mockRmbStaffList);
      expect(mockRmbStaffRepository.findAndCount).toHaveBeenCalledWith({
        where: { status: EUserStatus[EUserStatus.PENDING] },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return an RMB staff member by email', async () => {
      const email = 'john.doe@example.com';
      const mockRmbStaff = new RMBStaffMember(
        'John',
        'Doe',
        email,
        new Date(),
        '1234567890',
        '123456789',
        'Test Province',
        'Test District',
      );

      mockRmbStaffRepository.findOne.mockResolvedValue(mockRmbStaff);

      const result = await service.findByEmail(email);

      expect(result).toEqual(mockRmbStaff);
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });
  });

  describe('findById', () => {
    it('should return an RMB staff member by id', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockRmbStaff = new RMBStaffMember(
        'John',
        'Doe',
        'john.doe@example.com',
        new Date(),
        '1234567890',
        '123456789',
        'Test Province',
        'Test District',
      );
      mockRmbStaff.id = id;

      mockRmbStaffRepository.findOne.mockResolvedValue(mockRmbStaff);

      const result = await service.findById(id);

      expect(result).toEqual(mockRmbStaff);
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['rmbRole'],
      });
    });

    it('should throw NotFoundException when RMB staff member not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockRmbStaffRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(
        new NotFoundException('RTB Staff Member not found'),
      );
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['rmbRole'],
      });
    });
  });

  describe('create', () => {
    it('should create an RMB staff member successfully', async () => {
      const dto: CreateRMBStaffMemberDTO = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        gender: 'MALE',
        registercode: 'DMIM232@3$',
        national_id: '123456789',
        password: 'password123',
        phonenumber: '1234567890',
        province: 'Test Province',
        district: 'Test District',
        picture: null,
      };

      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000' as UUID,
        email: dto.email,
        roles: [{ name: ERole[ERole.RMB] }],
      };

      const mockRmbStaff = new RMBStaffMember(
        dto.firstName,
        dto.lastName,
        dto.email,
        new Date(),
        dto.phonenumber,
        dto.national_id,
        dto.province,
        dto.district,
      );

      mockUsersService.existsByEmail.mockResolvedValue(true);
      mockUsersService.getOneByEmail.mockResolvedValue(mockProfile);
      mockUtilsService.hashString.mockResolvedValue('hashedPassword');
      mockCloudinaryService.uploadImage.mockResolvedValue({ url: 'test-url' });
      mockRmbStaffRepository.save.mockResolvedValue(mockRmbStaff);

      await service.create(dto, mockFile);

      expect(mockUsersService.existsByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockUsersService.getOneByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockUtilsService.hashString).toHaveBeenCalledWith(dto.password);
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(mockFile);
      expect(mockRmbStaffRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when profile not found', async () => {
      const dto: CreateRMBStaffMemberDTO = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        gender: 'MALE',
        registercode: 'DMIM232@3$',
        national_id: '123456789',
        password: 'password123',
        phonenumber: '1234567890',
        province: 'Test Province',
        district: 'Test District',
        picture: null,
      };

      mockUsersService.existsByEmail.mockResolvedValue(false);

      await expect(service.create(dto, null)).rejects.toThrow(
        new NotFoundException(
          'The profile you are trying to set up is not found',
        ),
      );
    });

    it('should throw BadRequestException when file upload fails', async () => {
      const dto: CreateRMBStaffMemberDTO = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        gender: 'MALE',
        registercode: 'DMIM232@3$',
        national_id: '123456789',
        password: 'password123',
        phonenumber: '1234567890',
        province: 'Test Province',
        district: 'Test District',
        picture: null,
      };

      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      mockUsersService.existsByEmail.mockResolvedValue(true);
      mockUsersService.getOneByEmail.mockResolvedValue({ email: dto.email });
      mockUtilsService.hashString.mockResolvedValue('hashedPassword');
      mockCloudinaryService.uploadImage.mockRejectedValue(new Error());

      await expect(service.create(dto, mockFile)).rejects.toThrow(
        new BadRequestException('Invalid file type.'),
      );
    });
  });

  describe('inviteRMBStaffMember', () => {
    it('should invite an RMB staff member successfully', async () => {
      const dto: InviteUser = {
        email: 'john.doe@example.com',
      };

      const mockRole = {
        name: ERole[ERole.RMB],
      };

      const mockProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000' as UUID,
        email: dto.email,
        activationCode: '1234',
      };

      mockUsersService.existsByEmail.mockResolvedValue(false);
      mockRoleService.getRoleByName.mockResolvedValue(mockRole);
      mockUsersService.saveExistingProfile.mockResolvedValue(mockProfile);
      mockUsersService.generateRandomFourDigitNumber.mockReturnValue('1234');

      await service.inviteRMBStaffMember(dto);

      expect(mockUsersService.existsByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockRoleService.getRoleByName).toHaveBeenCalledWith(
        ERole[ERole.RMB],
      );
      expect(mockUsersService.saveExistingProfile).toHaveBeenCalled();
      expect(mockMailingService.sendEmail).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when RMB staff member already exists', async () => {
      const dto: InviteUser = {
        email: 'john.doe@example.com',
      };

      mockUsersService.existsByEmail.mockResolvedValue(true);

      await expect(service.inviteRMBStaffMember(dto)).rejects.toThrow(
        new ForbiddenException('RMB staff member already exists'),
      );
    });
  });

  describe('delete', () => {
    it('should delete an RMB staff member successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockRmbStaff = new RMBStaffMember(
        'John',
        'Doe',
        'john.doe@example.com',
        new Date(),
        '1234567890',
        '123456789',
        'Test Province',
        'Test District',
      );

      mockRmbStaffRepository.findOne.mockResolvedValue(mockRmbStaff);
      mockRmbStaffRepository.remove.mockResolvedValue(mockRmbStaff);

      const result = await service.delete(id);

      expect(result).toBe(true);
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['rmbRole'],
      });
      expect(mockRmbStaffRepository.remove).toHaveBeenCalledWith(mockRmbStaff);
    });

    it('should throw NotFoundException when RMB staff member not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockRmbStaffRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(id)).rejects.toThrow(
        new NotFoundException('RTB Staff Member not found'),
      );
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['rmbRole'],
      });
    });
  });

  describe('addRMBRole', () => {
    it('should add an RMB role successfully', async () => {
      const roleName = 'Test Role';
      const roleDescription = 'Test Description';
      const features = ['feature1', 'feature2'];

      const mockRmbRole = new RMBRole('Test Role', 'Test Description');
      mockRmbRole.rtbRoleName = roleName;
      mockRmbRole.roleDescription = roleDescription;
      mockRmbRole.systemFeatures = ',feature1,feature2';

      mockRmbRoleRepository.create.mockReturnValue(mockRmbRole);
      mockRmbRoleRepository.save.mockResolvedValue(mockRmbRole);

      const result = await service.addRMBRole(
        roleName,
        roleDescription,
        features,
      );

      expect(result).toEqual(mockRmbRole);
      expect(mockRmbRoleRepository.create).toHaveBeenCalledWith({
        rtbRoleName: roleName,
        roleDescription,
        systemFeatures: ',feature1,feature2',
      });
      expect(mockRmbRoleRepository.save).toHaveBeenCalledWith(mockRmbRole);
    });
  });

  describe('getAllRMBRoles', () => {
    it('should return all RMB roles', async () => {
      const mockRmbRole = new RMBRole('Test Role', 'Test Description');
      mockRmbRole.rtbRoleName = 'Test Role';
      mockRmbRole.roleDescription = 'Test Description';
      mockRmbRole.systemFeatures = 'feature1,feature2';

      const mockRmbRoles: RMBRole[] = [mockRmbRole];

      mockRmbRoleRepository.find.mockResolvedValue(mockRmbRoles);

      const result = await service.getAllRMBRoles();

      expect(result).toEqual(mockRmbRoles);
      expect(mockRmbRoleRepository.find).toHaveBeenCalledWith({});
    });
  });

  describe('updateRMBRole', () => {
    it('should update an RMB role successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const roleName = 'Updated Role';
      const roleDescription = 'Updated Description';
      const features = ['feature3', 'feature4'];

      const mockRmbRole = new RMBRole('Test Role', 'Test Description');
      mockRmbRole.id = id;
      mockRmbRole.rtbRoleName = 'Test Role';
      mockRmbRole.roleDescription = 'Test Description';
      mockRmbRole.systemFeatures = 'feature1,feature2';

      mockRmbRoleRepository.findOne.mockResolvedValue(mockRmbRole);
      mockRmbRoleRepository.save.mockResolvedValue({
        ...mockRmbRole,
        rtbRoleName: roleName,
        roleDescription,
        systemFeatures: 'feature1,feature2,feature3,feature4',
      });

      const result = await service.updateRMBRole(
        id,
        roleName,
        roleDescription,
        features,
      );

      expect(result.rtbRoleName).toBe(roleName);
      expect(result.roleDescription).toBe(roleDescription);
      expect(result.systemFeatures).toBe('feature1,feature2,feature3,feature4');
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockRmbRoleRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when RMB role not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const roleName = 'Updated Role';
      const roleDescription = 'Updated Description';
      const features = ['feature3', 'feature4'];

      mockRmbRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateRMBRole(id, roleName, roleDescription, features),
      ).rejects.toThrow(new NotFoundException('RTB Role not found'));
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('deleteRMBRole', () => {
    it('should delete an RMB role successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockRmbRole = new RMBRole('Test Role', 'Test Description');
      mockRmbRole.id = id;
      mockRmbRole.rtbRoleName = 'Test Role';
      mockRmbRole.roleDescription = 'Test Description';
      mockRmbRole.systemFeatures = 'feature1,feature2';

      mockRmbRoleRepository.findOne.mockResolvedValue(mockRmbRole);
      mockRmbRoleRepository.remove.mockResolvedValue(mockRmbRole);

      const result = await service.deleteRMBRole(id);

      expect(result).toBe('RTB Role Deleted Successfully');
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockRmbRoleRepository.remove).toHaveBeenCalledWith(mockRmbRole);
    });

    it('should throw NotFoundException when RMB role not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockRmbRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteRMBRole(id)).rejects.toThrow(
        new NotFoundException('RTB Role not found'),
      );
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('assignRMBRole', () => {
    it('should assign an RMB role to a staff member successfully', async () => {
      const rtbRoleId = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const rmbStaffId = '123e4567-e89b-12d3-a456-426614174001' as UUID;

      const mockRmbRole = new RMBRole('Test Role', 'Test Description');
      mockRmbRole.id = rtbRoleId;
      mockRmbRole.rtbRoleName = 'Test Role';
      mockRmbRole.roleDescription = 'Test Description';
      mockRmbRole.systemFeatures = 'feature1,feature2';

      const mockRmbStaff = new RMBStaffMember(
        'John',
        'Doe',
        'john.doe@example.com',
        new Date(),
        '1234567890',
        '123456789',
        'Test Province',
        'Test District',
      );
      mockRmbStaff.id = rmbStaffId;

      mockRmbRoleRepository.findOne.mockResolvedValue(mockRmbRole);
      mockRmbStaffRepository.findOne.mockResolvedValue(mockRmbStaff);
      mockRmbStaffRepository.save.mockResolvedValue({
        ...mockRmbStaff,
        rmbRole: mockRmbRole,
      });

      const result = await service.assignRMBRole(rtbRoleId, rmbStaffId);

      expect(result.rmbRole).toEqual(mockRmbRole);
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: rtbRoleId },
      });
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { id: rmbStaffId },
      });
      expect(mockRmbStaffRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role or staff not found', async () => {
      const rtbRoleId = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const rmbStaffId = '123e4567-e89b-12d3-a456-426614174001' as UUID;

      mockRmbRoleRepository.findOne.mockResolvedValue(null);
      mockRmbStaffRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignRMBRole(rtbRoleId, rmbStaffId),
      ).rejects.toThrow(new NotFoundException('Role or Staff not found'));
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: rtbRoleId },
      });
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { id: rmbStaffId },
      });
    });
  });

  describe('findRoleById', () => {
    it('should return an RMB role by id', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockRmbRole = new RMBRole('Test Role', 'Test Description');
      mockRmbRole.id = id;
      mockRmbRole.rtbRoleName = 'Test Role';
      mockRmbRole.roleDescription = 'Test Description';
      mockRmbRole.systemFeatures = 'feature1,feature2';

      mockRmbRoleRepository.findOne.mockResolvedValue(mockRmbRole);

      const result = await service.findRoleById(id);

      expect(result).toEqual(mockRmbRole);
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should throw NotFoundException when RMB role not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockRmbRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.findRoleById(id)).rejects.toThrow(
        new NotFoundException('The role with the provided Id is not found'),
      );
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('assignFeaturesToRole', () => {
    it('should assign features to an RMB role successfully', async () => {
      const dto: AssignFeaturesDTO = {
        roleId: '123e4567-e89b-12d3-a456-426614174000' as UUID,
        features: ['feature3', 'feature4'],
      };

      const mockRmbRole = new RMBRole('Test Role', 'Test Description');
      mockRmbRole.id = dto.roleId;
      mockRmbRole.rtbRoleName = 'Test Role';
      mockRmbRole.roleDescription = 'Test Description';
      mockRmbRole.systemFeatures = 'feature1,feature2';

      mockRmbRoleRepository.findOne.mockResolvedValue(mockRmbRole);
      mockRmbRoleRepository.save.mockResolvedValue({
        ...mockRmbRole,
        systemFeatures: 'feature1,feature2,feature3,feature4',
      });

      const result = await service.assignFeaturesToRole(dto);

      expect(result.systemFeatures).toBe('feature1,feature2,feature3,feature4');
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.roleId },
      });
      expect(mockRmbRoleRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when RMB role not found', async () => {
      const dto: AssignFeaturesDTO = {
        roleId: '123e4567-e89b-12d3-a456-426614174000' as UUID,
        features: ['feature3', 'feature4'],
      };

      mockRmbRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.assignFeaturesToRole(dto)).rejects.toThrow(
        new NotFoundException('The role with the provided Id is not found'),
      );
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.roleId },
      });
    });
  });

  describe('updateRMBStaffRole', () => {
    it('should update an RMB staff role successfully', async () => {
      const rtbRoleId = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const rtbStaffId = '123e4567-e89b-12d3-a456-426614174001' as UUID;

      const mockRmbRole = new RMBRole('Test Role', 'Test Description');
      mockRmbRole.id = rtbRoleId;
      mockRmbRole.rtbRoleName = 'Test Role';
      mockRmbRole.roleDescription = 'Test Description';
      mockRmbRole.systemFeatures = 'feature1,feature2';

      const mockRmbStaff = new RMBStaffMember(
        'John',
        'Doe',
        'john.doe@example.com',
        new Date(),
        '1234567890',
        '123456789',
        'Test Province',
        'Test District',
      );
      mockRmbStaff.id = rtbStaffId;

      mockRmbRoleRepository.findOne.mockResolvedValue(mockRmbRole);
      mockRmbStaffRepository.findOne.mockResolvedValue(mockRmbStaff);
      mockRmbStaffRepository.save.mockResolvedValue({
        ...mockRmbStaff,
        rmbRole: mockRmbRole,
      });

      const result = await service.updateRMBStaffRole(rtbRoleId, rtbStaffId);

      expect(result.rmbRole).toEqual(mockRmbRole);
      expect(mockRmbRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: rtbRoleId },
      });
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { id: rtbStaffId },
      });
      expect(mockRmbStaffRepository.save).toHaveBeenCalled();
    });
  });

  describe('dissociateRMBRole', () => {
    it('should dissociate an RMB role from a staff member successfully', async () => {
      const rmbStaffId = '123e4567-e89b-12d3-a456-426614174000' as UUID;
      const mockRmbStaff = new RMBStaffMember(
        'John',
        'Doe',
        'john.doe@example.com',
        new Date(),
        '1234567890',
        '123456789',
        'Test Province',
        'Test District',
      );
      mockRmbStaff.id = rmbStaffId;
      mockRmbStaff.rmbRole = new RMBRole('Test Role', 'Test Description');
      mockRmbStaff.rmbRole.id = '123e4567-e89b-12d3-a456-426614174001' as UUID;
      mockRmbStaff.rmbRole.rtbRoleName = 'Test Role';

      mockRmbStaffRepository.findOne.mockResolvedValue(mockRmbStaff);
      mockRmbStaffRepository.save.mockResolvedValue({
        ...mockRmbStaff,
        rmbRole: null,
      });

      const result = await service.dissociateRMBRole(rmbStaffId);

      expect(result.rmbRole).toBeNull();
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { id: rmbStaffId },
      });
      expect(mockRmbStaffRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when RMB staff member not found', async () => {
      const rmbStaffId = '123e4567-e89b-12d3-a456-426614174000' as UUID;

      mockRmbStaffRepository.findOne.mockResolvedValue(null);

      await expect(service.dissociateRMBRole(rmbStaffId)).rejects.toThrow(
        new NotFoundException('RTB Staff Member not found'),
      );
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { id: rmbStaffId },
      });
    });
  });

  describe('findByStatus', () => {
    it('should return an RMB staff member by status', async () => {
      const status = 'ACTIVE';
      const mockRmbStaff = new RMBStaffMember(
        'John',
        'Doe',
        'john.doe@example.com',
        new Date(),
        '1234567890',
        '123456789',
        'Test Province',
        'Test District',
      );
      mockRmbStaff.status = status;

      mockRmbStaffRepository.findOne.mockResolvedValue(mockRmbStaff);

      const result = await service.findByStatus(status);

      expect(result).toEqual(mockRmbStaff);
      expect(mockRmbStaffRepository.findOne).toHaveBeenCalledWith({
        where: { status },
      });
    });
  });
});
