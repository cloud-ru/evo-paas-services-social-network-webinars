import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: 'john@company.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  avatarUrl?: string;

  @ApiProperty({ example: 'Software Engineer', required: false })
  bio?: string;

  @ApiProperty({ example: 'online', default: 'offline' })
  status: string;

  @ApiProperty({ example: '2026-01-21T10:30:00Z', required: false })
  lastActivityAt?: Date;

  @ApiProperty({ example: '2026-01-21T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-21T10:30:00Z' })
  updatedAt: Date;
}

export class CurrentUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CurrentUserDto })
  data: CurrentUserDto;
}
