// src/games/dto/game.dto.ts
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    ValidateNested,
    IsBoolean,
    IsNumber,
    IsEnum,
    IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

/* === المرفقات الخاصة بالصورة === */
export class AttachmentDto {
    @IsOptional()
    @IsString()
    secure_url?: string;

    @IsOptional()
    @IsString()
    public_id?: string;
}

/* === عنصر واحد داخل accountInfoFields === */
export class AccountInfoFieldDto {
    @IsString()
    @IsNotEmpty()
    fieldName: string;

    @IsBoolean()
    isRequired: boolean;
}
export class OfferDto {
    @IsOptional()
    @IsNumber()
    discountPercent?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
/* === DTO لإنشاء لعبة جديدة === */
export class CreateGameDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AttachmentDto)
    image?: AttachmentDto;       // اختياري - يمكن أن تأتي الصورة من file upload

    @IsMongoId()
    @IsNotEmpty()
    categoryId: string; // ObjectId للفئة
    
    @IsOptional()
    @ValidateNested()
    @Type(() => OfferDto)
    offer?: OfferDto;
    
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => AccountInfoFieldDto)
    accountInfoFields: AccountInfoFieldDto[];
}

/* === DTO لتعديل لعبة موجودة ===
   نستخدم PartialType لتحويل كل الحقول إلى اختياريّة (optional) تلقائياً
*/
export class UpdateGameDto extends PartialType(CreateGameDto) { }
export class ToggleGameStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class ToggleGamePopularDto {
  // لا نحتاج لأي حقل لأننا سنعكس القيمة الحالية
}

/* === DTO لاستعلام قائمة الألعاب === */
export class ListGamesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['all', 'active', 'deleted'])
  status?: 'all' | 'active' | 'deleted';
  
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;
}
