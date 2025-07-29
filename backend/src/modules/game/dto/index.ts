import { Transform } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, Min } from "class-validator";

export class ListGamesDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @Transform(({ value }) => {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? value : parsed;
    })
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Transform(({ value }) => {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? value : parsed;
    })
    @IsInt()
    @Min(1)
    limit?: number;
}

export class CategoryIdDto {
    @IsString()
    categoryId: string;
}