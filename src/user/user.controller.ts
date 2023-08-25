import {
  Controller,
  Get,
  UseGuards,
  Patch,
  HttpStatus,
  Body,
  Query,
  Post,
  Param,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { updateUserDto } from './dto/updateUser.dto';
import { UserService } from './user.service';
import {
  IUserFilter,
  IUserParams,
  IUserQuery,
} from './interface/user-query.interface';

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

  @Post('get-players')
  getPlayers(@Query() queryObj: IUserQuery, @Body() filterObj: IUserFilter) {
    return this.userService.getPlayers(queryObj, filterObj);
  }

  @Get(':playerId')
  getPlayer(@Param() params: IUserParams) {
    return this.userService.getPlayer(params.playerId);
  }
}
