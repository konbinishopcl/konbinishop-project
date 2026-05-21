import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtUser = { sub: number; email: string; role: string };

/** Inyecta el usuario del JWT (payload) en un parámetro del handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
