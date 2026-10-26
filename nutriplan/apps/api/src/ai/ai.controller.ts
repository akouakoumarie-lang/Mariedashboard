import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { aiRecipeIdeasSchema } from '@nutriplan/core';
import { z } from 'zod';
import { CurrentUser } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth.service';
import { ApiZodBody, ZodPipe } from '../common/zod';
import { AiService } from './ai.service';

@ApiTags('Idées (IA)')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('status')
  status() {
    return { enabled: this.ai.enabled };
  }

  @Post('recipe-ideas')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiZodBody(aiRecipeIdeasSchema)
  @ApiOperation({ summary: 'Idées de recettes avec mon stock (IA vérifiée, repli sur le catalogue)' })
  ideas(@CurrentUser() user: AuthUser, @Body(new ZodPipe(aiRecipeIdeasSchema)) body: z.infer<typeof aiRecipeIdeasSchema>) {
    return this.ai.recipeIdeas(user.id, body.mealType, body.note);
  }
}
