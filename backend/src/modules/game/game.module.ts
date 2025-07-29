import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameRepository } from 'src/DB/models/Game/game.repository';
import { gameModel } from 'src/DB/models/Game/game.model';
import { categoryRepository } from 'src/DB/models/Category/category.repository';
import { categoryModel } from 'src/DB/models/Category/category.model';

@Module({
  imports: [gameModel, categoryModel],
  controllers: [GameController],
  providers: [GameService, GameRepository, categoryRepository],
})
export class GameModule {}
