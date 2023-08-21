import {
  Controller,
  Get,
  UseGuards,
  Patch,
  HttpStatus,
  Body,
  Query,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { updateUserDto } from './dto/updateUser.dto';
import { UserService } from './user.service';
import { IQueryObject } from 'src/common/interface';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('get-user')
  getUser(@GetUser() user: User) {
    return {
      code: HttpStatus.OK,
      data: { user },
    };
  }

  @Patch('update-user')
  updateUser(@GetUser() user: User, @Body() dto: updateUserDto) {
    return this.userService.updateUser(user, dto);
  }

  @Get('get-players')
  getPlayers(@Query() queryObj: IQueryObject) {
    return this.userService.getPlayers(queryObj);
  }
}
