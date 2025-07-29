import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { SuperAdminPackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';
import { User } from 'src/commen/Decorator/user.decorator';
import { RoleTypes, TUser } from 'src/DB/models/User/user.schema';
import { RolesGuard } from 'src/commen/Guards/role.guard';
import { AuthGuard } from 'src/commen/Guards/auth.guard';
import { Roles } from 'src/commen/Decorator/roles.decorator';
import { MongoIdPipe } from 'src/commen/pipes/mongoId.pipes';
@UsePipes(new ValidationPipe({ whitelist: true }))
@Controller('packages/dashboard')
export class SuperAdminPackagesController {
  constructor(private readonly superAdminPackagesService: SuperAdminPackagesService) { }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([RoleTypes.SUPER_ADMIN])
  @Post()
  async createPackage(@User() user: TUser, @Body() createPackageDto: CreatePackageDto) {
    return await this.superAdminPackagesService.createPackage(user, createPackageDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles([RoleTypes.SUPER_ADMIN])
  @Patch(':id')
  async updatePackage(@Param('id', MongoIdPipe) id: string, @User() user: TUser, @Body() updatePackageDto: UpdatePackageDto) {
    return await this.superAdminPackagesService.updatePackage(id, user, updatePackageDto);
  }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([RoleTypes.SUPER_ADMIN])
  @Delete(':id')
  async deletePackage(@Param('id', MongoIdPipe) id: string, @User() user: TUser) {
    return await this.superAdminPackagesService.deletePackage(id, user);
  }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([RoleTypes.SUPER_ADMIN])
  @Get(':id')
  getPackageById(@Param('id', MongoIdPipe) id: string) {
    return this.superAdminPackagesService.getPackageById(id);
  }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([RoleTypes.SUPER_ADMIN])
  @Get()
  getAllPackages() {
    return this.superAdminPackagesService.getAllPackages();
  }
}
