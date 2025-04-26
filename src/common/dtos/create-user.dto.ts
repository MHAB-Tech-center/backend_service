/* eslint-disable */
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  lastName: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  registercode: string = 'DMIM232@3$';

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  national_id: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty()
  password: string;

  @IsOptional()
  @ApiProperty({ required: false })
  role?: string;

  // @IsDate()
  // dob: Date;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '+250793045245' })
  @IsPhoneNumber()
  phonenumber: string;

  @IsOptional()
  @ApiProperty({
    description: 'Profile picture',
    type: 'string',
    format: 'binary',
    required: false,
  })
  picture: Express.Multer.File;
}
