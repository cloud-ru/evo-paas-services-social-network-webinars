import { ApiProperty } from '@nestjs/swagger';

export class SessionDeviceDto {
  @ApiProperty({ example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })
  userAgent: string;

  @ApiProperty({ example: 'Chrome on Windows' })
  name: string;

  @ApiProperty({ example: '192.168.1.100' })
  ip: string;
}

export class SessionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  sessionId: string;

  @ApiProperty({ type: SessionDeviceDto })
  device: SessionDeviceDto;

  @ApiProperty({ example: '2026-01-21T11:30:00Z' })
  lastActivityAt: Date;

  @ApiProperty({ example: '2026-01-20T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: true })
  isCurrent: boolean;
}

export class GetSessionsResponseDataDto {
  @ApiProperty({ type: [SessionDto] })
  sessions: SessionDto[];
}

export class GetSessionsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: GetSessionsResponseDataDto })
  data: GetSessionsResponseDataDto;
}

export class RevokeSessionRequestDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  sessionId: string;
}

export class RevokeSessionResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: { message: 'Session revoked successfully' },
  })
  data: {
    message: string;
  };
}
