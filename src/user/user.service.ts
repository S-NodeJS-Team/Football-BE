import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from '@prisma/client';
import { updateUserDto } from './dto/updateUser.dto';
import { USER_MSG } from 'src/common/constant';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable({})
export class UserService {
    constructor(private prisma: PrismaService) {}

    async updateUser(user: User, dto: updateUserDto) {
        try {
            const newUser = await this.prisma.user.update({
                data: dto,
                where: { id: user.id }
            });
            console.log(newUser);
            return {
                code: HttpStatus.OK,
                message: USER_MSG.updateUserSuccess,
                data: newUser
            };
            
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }
}
