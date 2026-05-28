import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../utils/prisma/prisma.service';

/**
 * Prefijos de claves expuestas en GET /settings/public.
 * ARTICLE_PRICE y cualquier otra clave admin-only NO se expone.
 */
const PUBLIC_PREFIXES = ['SPOT_', 'HERO_', 'EVENT_', 'SUBSCRIPTION_'] as const;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lee una clave como string. Lanza NotFoundException si no existe.
   * Si el caller debe tolerar la ausencia, usar getAll() + find o tryGet futuro.
   */
  async get(key: string): Promise<string> {
    const s = await this.prisma.settings.findUnique({ where: { key } });
    if (!s) throw new NotFoundException(`Setting "${key}" no existe`);
    return s.value;
  }

  /**
   * Lee una clave y la parsea como número entero. Lanza si no existe o no es parseable.
   */
  async getNum(key: string): Promise<number> {
    const raw = await this.get(key);
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      throw new NotFoundException(`Setting "${key}" no es un número válido: "${raw}"`);
    }
    return n;
  }

  /**
   * Upsert de una clave. Admin only (validado en controller).
   */
  async set(key: string, value: string) {
    return this.prisma.settings.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  /**
   * Lista completa — admin only.
   * Devuelve array de {key, value, updatedAt} ordenado alfabéticamente por key.
   */
  getAll() {
    return this.prisma.settings.findMany({
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Mapa público {key: value} de las claves SPOT_*, HERO_*, EVENT_* y SUBSCRIPTION_*. Sin auth.
   * El frontend lo consume para mostrar precios, cupos y opciones de suscripción al usuario.
   */
  async getPublic(): Promise<Record<string, string>> {
    const all = await this.prisma.settings.findMany();
    const result: Record<string, string> = {};
    for (const s of all) {
      if (PUBLIC_PREFIXES.some((p) => s.key.startsWith(p))) {
        result[s.key] = s.value;
      }
    }
    return result;
  }
}
