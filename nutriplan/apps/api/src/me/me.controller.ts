import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  allergiesSchema,
  inventoryItemSchema,
  inventoryUpdateSchema,
  notificationSettingsSchema,
  preferencesSchema,
  profileSchema,
  type AllergiesInput,
  type InventoryItemInput,
  type PreferencesInput,
  type ProfileInput,
} from '@nutriplan/core';
import { z } from 'zod';
import { CurrentUser } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth.service';
import { ApiZodBody, ZodPipe } from '../common/zod';
import { MeService } from './me.service';

@ApiTags('Mon compte')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  @ApiOperation({ summary: 'Compte connecté' })
  async account(@CurrentUser() user: AuthUser) {
    const { profile } = await this.me.getProfile(user.id);
    return { id: user.id, email: user.email, hasProfile: !!profile };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Profil et estimation énergétique indicative' })
  profile(@CurrentUser() user: AuthUser) {
    return this.me.getProfile(user.id);
  }

  @Put('profile')
  @ApiZodBody(profileSchema)
  @ApiOperation({ summary: 'Créer ou modifier le profil' })
  upsertProfile(@CurrentUser() user: AuthUser, @Body(new ZodPipe(profileSchema)) body: ProfileInput) {
    return this.me.upsertProfile(user.id, body);
  }

  @Put('notifications')
  @ApiZodBody(notificationSettingsSchema)
  notifications(@CurrentUser() user: AuthUser, @Body(new ZodPipe(notificationSettingsSchema)) body: z.infer<typeof notificationSettingsSchema>) {
    return this.me.setNotifications(user.id, body.notificationsEnabled);
  }

  @Get('preferences')
  preferences(@CurrentUser() user: AuthUser) {
    return this.me.getPreferences(user.id);
  }

  @Put('preferences')
  @ApiZodBody(preferencesSchema)
  @ApiOperation({ summary: 'Aliments aimés et aliments exclus (remplace la liste)' })
  setPreferences(@CurrentUser() user: AuthUser, @Body(new ZodPipe(preferencesSchema)) body: PreferencesInput) {
    return this.me.setPreferences(user.id, body);
  }

  @Get('allergies')
  allergies(@CurrentUser() user: AuthUser) {
    return this.me.getAllergies(user.id);
  }

  @Put('allergies')
  @ApiZodBody(allergiesSchema)
  @ApiOperation({ summary: 'Allergies (contraintes strictes) — remplace la liste' })
  setAllergies(@CurrentUser() user: AuthUser, @Body(new ZodPipe(allergiesSchema)) body: AllergiesInput) {
    return this.me.setAllergies(user.id, body);
  }

  @Get('inventory')
  inventory(@CurrentUser() user: AuthUser) {
    return this.me.getInventory(user.id);
  }

  @Post('inventory')
  @ApiZodBody(inventoryItemSchema)
  @ApiOperation({ summary: 'Ajouter (ou remplacer) un aliment disponible' })
  addInventory(@CurrentUser() user: AuthUser, @Body(new ZodPipe(inventoryItemSchema)) body: InventoryItemInput) {
    return this.me.upsertInventoryItem(user.id, body);
  }

  @Patch('inventory/:id')
  @ApiZodBody(inventoryUpdateSchema)
  updateInventory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(inventoryUpdateSchema)) body: z.infer<typeof inventoryUpdateSchema>,
  ) {
    return this.me.updateInventoryItem(user.id, id, body);
  }

  @Delete('inventory/:id')
  deleteInventory(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.me.deleteInventoryItem(user.id, id);
  }

  @Get('export')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Exporter toutes mes données (RGPD)' })
  export(@CurrentUser() user: AuthUser) {
    return this.me.exportData(user.id);
  }

  @Delete()
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Supprimer mon compte et toutes mes données' })
  deleteAccount(@CurrentUser() user: AuthUser) {
    return this.me.deleteAccount(user.id);
  }
}
