/* eslint-disable */
/*
 @auhor : © 2024 Valens Niyonsenga <valensniyonsenga2003@gmail.com>
*/

/**
 * @file
 * @brief service for role queries
 */
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { UsersService } from 'src/modules/users/users.service';
import { forwardRef, Inject } from '@nestjs/common';
import { Role } from 'src/entities/role.entity';
import { ERole } from 'src/common/Enum/ERole.enum';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) public roleRepo: Repository<Role>,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
  ) {}
  async createRoles() {
    let roles = await this.roleRepo.find({});

    const roleArray: Array<ERole> = [
      ERole.ADMIN,
      ERole.USER,
      ERole.INSPECTOR,
      ERole.RMB,
      ERole.MCIS,
    ];
    roleArray.forEach((roleName) => {
      const registeredRoles = roles.map((role) => role.role_name);
      if (!registeredRoles.includes(roleName)) {
        const roleEntity = this.roleRepo.create({
          role_name: ERole[roleName],
        });
        this.roleRepo.save(roleEntity);
      }
    });
  }

  async getAllRoles() {
    return await this.roleRepo.find();
  }
  async getRoleByName(name: any) {
    try {
      return await this.roleRepo.findOne({ where: { role_name: name } });
    } catch (error) {
      throw error;
    }
  }

  async getRoleById(id: number) {
    console.log(id);
    const role = await this.roleRepo.findOne({
      where: {
        id: id,
      },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }
}
