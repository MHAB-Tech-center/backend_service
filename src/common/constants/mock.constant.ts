import { UUID } from 'crypto';
import { Inspector } from 'src/entities/inspector.entity';
import { Profile } from 'src/entities/profile.entity';
import { MineSite } from 'src/entities/minesite.entity';
import { CreateInspectorDTO } from 'src/modules/inspectors/dtos/createInspector.dto';
import { InviteUser } from 'src/common/dtos/invite-user.dto';
import { EAccountStatus } from 'src/common/Enum/EAccountStatus.enum';
import { ERole } from 'src/common/Enum/ERole.enum';

// UUIDs
export const MOCK_UUID = '123e4567-e89b-12d3-a456-426614174000' as UUID;
export const MOCK_UUID_2 = '123e4567-e89b-12d3-a456-426614174001' as UUID;

// Inspector
export const MOCK_INSPECTOR = new Inspector(
  'John',
  'Doe',
  'john.doe@example.com',
  new Date(),
  '1234567890',
  '123456789',
  'INSPECTOR',
  'Test Province',
  'Test District',
);
MOCK_INSPECTOR.id = MOCK_UUID;

export const MOCK_OLD_INSPECTOR = new Inspector(
  'Old First Name',
  'Old Last Name',
  'old.email@example.com',
  new Date(),
  '0987654321',
  '987654321',
  'INSPECTOR',
  'Old Province',
  'Old District',
);
MOCK_OLD_INSPECTOR.id = MOCK_UUID;

// Profile
export const MOCK_PROFILE = new Profile('john.doe@example.com', 'password123');
MOCK_PROFILE.id = MOCK_UUID;
MOCK_PROFILE.activationCode = 1234;
MOCK_PROFILE.status = EAccountStatus[EAccountStatus.ACTIVE];

// Minesite
export const MOCK_MINESITE = new MineSite(
  'Test Mine',
  'TEST001',
  'Test Province',
  'Test District',
);

// DTOs
export const MOCK_CREATE_INSPECTOR_DTO: CreateInspectorDTO = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  national_id: '123456789',
  phonenumber: '1234567890',
  minesiteId: MOCK_UUID,
  password: 'password123',
  inspectorRole: 'INSPECTOR',
  province: 'Test Province',
  district: 'Test District',
  gender: 'MALE',
  registercode: 'DMIM232@3$',
  picture: null,
};

export const MOCK_INVITE_USER_DTO: InviteUser = {
  email: 'john.doe@example.com',
};

// File
export const MOCK_FILE = {
  fieldname: 'file',
  originalname: 'test.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('test'),
} as Express.Multer.File;

// Role
export const MOCK_ROLE = {
  name: ERole[ERole.INSPECTOR],
};
