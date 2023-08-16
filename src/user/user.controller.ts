import { Controller, Get, UseGuards, Post, Patch, HttpStatus, Body } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { updateUserDto } from './dto/updateUser.dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('get-user')
  getUser(@GetUser() user: User) {
    return {
      code: HttpStatus.OK,
      data: [user]
    }
  }

  @Patch('update-user')
  updateUser(@GetUser() user: User, @Body() dto: updateUserDto) {
    return this.userService.updateUser(user, dto);
  }
}

