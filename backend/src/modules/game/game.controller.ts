import { Controller, Get, Param, Query, UsePipes, ValidationPipe, Header, Logger } from '@nestjs/common';
import { GameService } from './game.service';
import { ListGamesDto, CategoryIdDto } from './dto';
import { Types } from 'mongoose';
import { MongoIdPipe } from 'src/commen/pipes/mongoId.pipes';

@UsePipes(new ValidationPipe({ whitelist: true }))
@Controller('game')
export class GameController {
  private readonly logger = new Logger(GameController.name);
  
  constructor(private readonly gameService: GameService) {}

  @Get()
  async listGames(@Query() query: ListGamesDto) {
    return this.gameService.listGames(query);
  }

  @Get('category/:categoryId')
  async getGamesByCategory(@Param() params: CategoryIdDto) {
    return this.gameService.getGamesByCategory(new Types.ObjectId(params.categoryId));
  }

  @Get('category/:categoryId/paid')
  async getPaidGamesByCategory(@Param() params: CategoryIdDto) {
    return this.gameService.getPaidGamesByCategory(new Types.ObjectId(params.categoryId));
  }

  @Get('category/:categoryId/with-packages')
  async getGamesWithPackagesByCategory(@Param() params: CategoryIdDto) {
    this.logger.log(`CategoryId param: ${params.categoryId}`);
    return await this.gameService.getGamesWithPackagesByCategory(new Types.ObjectId(params.categoryId));
  }

  @Get(':gameId')
  async getGameById(@Param('gameId', MongoIdPipe) gameId: string) {
    return this.gameService.getGameById(new Types.ObjectId(gameId));
  }
}
