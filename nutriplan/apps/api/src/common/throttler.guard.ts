import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'node:crypto';

/**
 * Les quotas sont comptés par session (empreinte du jeton) plutôt que par adresse IP :
 * des utilisateurs derrière une même IP (réseau mobile, entreprise) ne se pénalisent pas entre eux.
 * Les requêtes anonymes restent comptées par IP.
 */
@Injectable()
export class SessionThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    const header: unknown = req.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return `session:${createHash('sha256').update(header).digest('hex')}`;
    }
    return `ip:${req.ip}`;
  }
}
