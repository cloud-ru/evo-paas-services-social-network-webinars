import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from './user-status.dto';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: 'online' })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}
