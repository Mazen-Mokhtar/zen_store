import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsNumber, IsMongoId, IsBoolean, IsNotEmpty, Min } from 'class-validator';
import { Types } from 'mongoose';


export class CreatePackageDto {
    @IsMongoId()
    @IsNotEmpty()
    gameId: Types.ObjectId;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsOptional()
    @IsBoolean()
    isOffer?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    originalPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    finalPrice?: number;

    @IsString()
    @IsNotEmpty()
    currency: string;

    @IsBoolean()
    isActive?: boolean;
}
export class UpdatePackageDto extends PartialType(CreatePackageDto) { }