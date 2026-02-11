import { IsArray, IsString } from 'class-validator';

export class GetSignedUrlDto {
  @IsString()
  url: string;
}

export class GetSignedUrlsDto {
  @IsArray()
  @IsString({ each: true })
  urls: string[];
}

export class SignedUrlResponseDto {
  url: string;
}

export class SignedUrlsResponseDto {
  urls: Record<string, string>;
}
