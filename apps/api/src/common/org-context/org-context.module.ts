import { Global, Module } from '@nestjs/common';
import { OrgContextGuard } from './org-context.guard';

/**
 * Módulo global que provee OrgContextGuard. El decorator @OrgContext() y el tipo
 * OrgContextDto se importan directamente desde sus archivos — no necesitan provider.
 *
 * Marcado @Global() para que cualquier controller pueda usar @UseGuards(OrgContextGuard)
 * sin importar este módulo en cada feature module.
 */
@Global()
@Module({
  providers: [OrgContextGuard],
  exports: [OrgContextGuard],
})
export class OrgContextModule {}
