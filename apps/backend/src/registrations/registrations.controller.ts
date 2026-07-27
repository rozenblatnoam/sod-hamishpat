import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsBoolean, IsEmail, IsString, MinLength } from 'class-validator';
import { ApiTags } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';

class RegisterPublicDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(7)
  phone!: string;

  @IsEmail()
  email!: string;

  @IsBoolean()
  marketingConsent!: boolean;
}

@ApiTags('public')
@Controller('public')
export class RegistrationsController {
  constructor(private registrations: RegistrationsService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  register(@Body() dto: RegisterPublicDto) {
    return this.registrations.register(dto);
  }
}
