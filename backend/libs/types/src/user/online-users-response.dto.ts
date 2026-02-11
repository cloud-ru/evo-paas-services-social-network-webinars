import { ApiProperty } from '@nestjs/swagger';

export class OnlineUserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({
    example: 'https://s3.amazonaws.com/avatars/550e8400.jpg',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({ example: 'online' })
  status: string;

  @ApiProperty({ example: '2026-01-21T11:30:00Z' })
  lastActivityAt: Date | null;
}

export class GetOnlineUsersResponseDto {
  @ApiProperty({ type: [OnlineUserDto] })
  users: OnlineUserDto[];

  @ApiProperty({ example: 145 })
  total: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}
