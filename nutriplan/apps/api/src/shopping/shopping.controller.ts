import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { manualShoppingItemSchema, updateShoppingItemSchema, type ManualShoppingItemInput } from '@nutriplan/core';
import { z } from 'zod';
import { CurrentUser } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth.service';
import { ApiZodBody, ZodPipe } from '../common/zod';
import { ShoppingService } from './shopping.service';

@ApiTags('Liste de courses')
@ApiBearerAuth()
@Controller('meal-plans/:planId/shopping-list')
export class ShoppingController {
  constructor(private readonly shopping: ShoppingService) {}

  @Get()
  @ApiOperation({ summary: 'Liste de courses du planning, groupée par rayon, avec budget estimé' })
  get(@CurrentUser() user: AuthUser, @Param('planId', ParseUUIDPipe) planId: string) {
    return this.shopping.get(user.id, planId);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Recalculer à partir des repas et du stock' })
  recalculate(@CurrentUser() user: AuthUser, @Param('planId', ParseUUIDPipe) planId: string) {
    return this.shopping.recalculate(user.id, planId);
  }

  @Post('items')
  @ApiZodBody(manualShoppingItemSchema)
  add(@CurrentUser() user: AuthUser, @Param('planId', ParseUUIDPipe) planId: string, @Body(new ZodPipe(manualShoppingItemSchema)) body: ManualShoppingItemInput) {
    return this.shopping.addManualItem(user.id, planId, body);
  }

  @Patch('items/:itemId')
  @ApiZodBody(updateShoppingItemSchema)
  update(
    @CurrentUser() user: AuthUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body(new ZodPipe(updateShoppingItemSchema)) body: z.infer<typeof updateShoppingItemSchema>,
  ) {
    return this.shopping.updateItem(user.id, planId, itemId, body);
  }

  @Delete('items/:itemId')
  remove(@CurrentUser() user: AuthUser, @Param('planId', ParseUUIDPipe) planId: string, @Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.shopping.deleteItem(user.id, planId, itemId);
  }
}
