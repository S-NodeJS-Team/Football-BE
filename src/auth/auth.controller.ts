import { Body, Controller, Post, HttpCode, HttpStatus, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Request } from 'express';
import { SignInDto } from './dto/signIn.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  signUp(@Body() dto: AuthDto) {
    return this.authService.signUp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }
  
  @Get('verify-account')
  confirmEmail(@Req() req: Request) {
    const token = req.query.token.toString();
    return this.authService.confirmEmailVerification(token);
  }

  @Post('forgot-password')
  forgotPassword(@Req() req: Request) {
    const email = req.body.email.toString();
    return this.authService.forgotPassword(email);
  }

  @Post('change-password')
  changePassword(@Body() dto: SignInDto) {
    return this.authService.changePassword(dto);
  }
}
