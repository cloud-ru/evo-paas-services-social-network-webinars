import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from './user-status.dto';

export class CreateUserProfileDto {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  status: UserStatus;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserProfileDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiProperty({ description: 'Avatar URL', required: false, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'User bio', required: false, nullable: true })
  bio: string | null;

  @ApiProperty({
    description: 'User status',
    enum: ['online', 'offline', 'away'],
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Last activity date',
    required: false,
    nullable: true,
  })
  lastActivityAt: Date | null;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;
}

export class GetUserProfileResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: UserProfileDto })
  data: UserProfileDto;
}
