import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { messageSystem } from 'src/commen/messages';
import { GameRepository } from 'src/DB/models/Game/game.repository';
import { PackageRepository } from 'src/DB/models/Packages/packages.repository';
import { PackageDocument } from 'src/DB/models/Packages/packages.schema';
import { CreatePackageDto, UpdatePackageDto } from './dto';
import { TUser } from 'src/DB/models/User/user.schema';

@Injectable()
export class SuperAdminPackagesService {
    constructor(private readonly packageRepository: PackageRepository, private readonly gameRepository: GameRepository) { }
    async createPackage(user: TUser, body: CreatePackageDto): Promise<PackageDocument> {

        if (!Types.ObjectId.isValid(body.gameId)) {
            throw new BadRequestException(messageSystem.game.Invalid_gameId);
        }
        const game = await this.gameRepository.findById(body.gameId)
        if (!game) {
            throw new BadRequestException(messageSystem.game.Invalid_gameId)
        }
        return await this.packageRepository.create({ ...body, createdBy: user._id });
    }
    async updatePackage(id: string, user: TUser, body: UpdatePackageDto) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(messageSystem.package.Invalid_package_ID);
        }
        if (body.gameId && !Types.ObjectId.isValid(body.gameId)) {
            throw new BadRequestException(messageSystem.game.Invalid_gameId);
        }
        if (body.gameId) {
            const game = await this.gameRepository.findById(body.gameId);
            if (!game) {
                throw new BadRequestException(messageSystem.game.Invalid_gameId);
            }
        }
        const packageDoc = await this.packageRepository.findById(id)
        if (!packageDoc)
            throw new NotFoundException("Package Not Found")
        Object.assign(packageDoc, body);

        await packageDoc.save();
        return { success: true, data: packageDoc };
    }
    async deletePackage(id: string, user: TUser) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(messageSystem.package.Invalid_package_ID);
        }
        const packageDoc = await this.packageRepository.findById(id)
        if (!packageDoc) {
            throw new NotFoundException(messageSystem.package.notFound);
        }
        if (packageDoc.isDeleted) {
            throw new BadRequestException(messageSystem.package.notFound)
        }
        await this.packageRepository.updateOne({ _id: id }, { isDeleted: true, updateBy: user._id })
        return { success: true, data: messageSystem.package.deletedSuccessfully }
    }
    async getPackageById(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(messageSystem.package.Invalid_package_ID);
        }
        const packageDoc = await this.packageRepository.findById(id);
        if (!packageDoc) {
            throw new NotFoundException(messageSystem.package.notFound);
        }
        return { success: true, data: packageDoc };
    }
    async getAllPackages() {
        const packages = await this.packageRepository.find({
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        });
        return { success: true, data: packages };
    }
}
