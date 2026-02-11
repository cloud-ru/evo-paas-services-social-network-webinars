import { ApiProperty } from '@nestjs/swagger';

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
}

export class UserStatusResponseDto {
  @ApiProperty({ enum: UserStatus, example: 'online' })
  status: UserStatus;

  @ApiProperty({ example: '2026-01-21T11:30:00Z', nullable: true })
  lastActivityAt: Date | null;
}
