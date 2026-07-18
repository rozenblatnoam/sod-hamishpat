import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, Matches, MinLength, ValidateIf } from 'class-validator';

class RegisterDto {
  @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
  @MinLength(6)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'הסיסמה חייבת להכיל לפחות 6 תווים, עם אותיות ומספרים',
  })
  password!: string;
  @IsNotEmpty() school!: string;
  @IsOptional() @IsIn(['student', 'teacher']) role?: 'student' | 'teacher';
  @IsOptional()
  class?: string;
}

class LoginDto {
  @IsEmail() email!: string;
  @IsNotEmpty() password!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('google')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  googleLogin(@Body('idToken') idToken: string) {
    return this.auth.loginWithFirebase(idToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@CurrentUser() user: any) {
    return this.auth.sanitize(user);
  }
}
