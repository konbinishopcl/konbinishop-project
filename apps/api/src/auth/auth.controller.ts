import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { GoogleOneTapDto } from './dto/google-onetap.dto';
import { GoogleOnboardingDto } from './dto/google-onboarding.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TwoFaGuard, type TwoFaUser } from './two-fa.guard';
import { OnboardingGuard, type OnboardingUser } from './onboarding.guard';
import { CurrentUser, type JwtUser } from './current-user.decorator';
import { VerifyTwoFaDto } from './dto/verify-2fa.dto';
import { ChangeEmailRequestDto } from './dto/change-email-request.dto';
import { ChangeEmailConfirmDto } from './dto/change-email-confirm.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar un usuario nuevo',
    description:
      'Crea la cuenta y envía un código 2FA al email. ' +
      'Retorna `{ pendingToken, twoFaRequired: true }` — usar `POST /auth/2fa/verify` para completar.',
  })
  @ApiResponse({ status: 201, description: '`{ pendingToken, twoFaRequired: true }` — código 2FA enviado al email' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Valida credenciales y envía un código 2FA al email. ' +
      'Retorna `{ pendingToken, twoFaRequired: true }` — usar `POST /auth/2fa/verify` para completar.',
  })
  @ApiResponse({ status: 201, description: '`{ pendingToken, twoFaRequired: true }` — código 2FA enviado al email' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas o cuenta bloqueada' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('2fa/verify')
  @UseGuards(TwoFaGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar código 2FA y obtener JWT definitivo',
    description:
      'Requiere `Authorization: Bearer <pendingToken>` obtenido en login/register. ' +
      'El código tiene validez de 10 minutos.',
  })
  @ApiResponse({ status: 201, description: '`{ token, user }` — JWT definitivo' })
  @ApiResponse({ status: 401, description: 'Código inválido, expirado o pendingToken inválido' })
  verifyTwoFa(@Body() dto: VerifyTwoFaDto, @CurrentUser() user: TwoFaUser) {
    return this.auth.verifyTwoFa(user.sub, dto.code);
  }

  @Post('2fa/resend')
  @UseGuards(TwoFaGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reenviar código 2FA al email',
    description: 'Genera un nuevo código (invalida el anterior) y lo reenvía. Requiere `pendingToken`.',
  })
  @ApiResponse({ status: 201, description: '`{ ok: true }` — código reenviado' })
  @ApiResponse({ status: 401, description: 'pendingToken inválido o expirado' })
  resendTwoFa(@CurrentUser() user: TwoFaUser) {
    return this.auth.resendTwoFa(user.sub);
  }

  @Post('google')
  @ApiOperation({
    summary: 'Autenticar con Google (access token)',
    description:
      'Usuario existente → `{ token, user }`. ' +
      'Usuario nuevo → `{ onboardingToken, onboardingRequired: true }` — continuar con `POST /auth/google/onboarding`.',
  })
  @ApiResponse({ status: 201, description: '`{ token, user }` o `{ onboardingToken, onboardingRequired: true }`' })
  @ApiResponse({ status: 401, description: 'Token de Google inválido o email no verificado' })
  googleAuth(@Body() dto: GoogleAuthDto) {
    return this.auth.googleAuth(dto.accessToken);
  }

  @Post('google/onetap')
  @ApiOperation({
    summary: 'Autenticar con Google One Tap (ID token / credential)',
    description:
      'Usuario existente → `{ token, user }`. ' +
      'Usuario nuevo → `{ onboardingToken, onboardingRequired: true }` — continuar con `POST /auth/google/onboarding`.',
  })
  @ApiResponse({ status: 201, description: '`{ token, user }` o `{ onboardingToken, onboardingRequired: true }`' })
  @ApiResponse({ status: 401, description: 'Credencial de Google inválida' })
  googleOneTap(@Body() dto: GoogleOneTapDto) {
    return this.auth.googleOneTap(dto.credential);
  }

  @Post('google/onboarding')
  @UseGuards(OnboardingGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Completar onboarding de usuario Google nuevo (país + T&C)',
    description:
      'Requiere `Authorization: Bearer <onboardingToken>` (30 min). ' +
      'Valida que `acceptedTerms === true` y que el `countryId` exista. ' +
      'Retorna el JWT definitivo.',
  })
  @ApiResponse({ status: 201, description: '`{ token, user }` — JWT definitivo' })
  @ApiResponse({ status: 400, description: 'T&C no aceptados o país inválido' })
  @ApiResponse({ status: 401, description: 'onboardingToken inválido o expirado' })
  googleOnboarding(@Body() dto: GoogleOnboardingDto, @CurrentUser() user: OnboardingUser) {
    return this.auth.googleOnboarding(user.sub, dto.countryId, dto.acceptedTerms);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña',
    description: 'Envía un email con enlace de recuperación (válido 1 hora). Respuesta uniforme — no revela si el email existe.',
  })
  @ApiResponse({ status: 201, description: '`{ ok: true }` siempre (por seguridad)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña con token de recuperación' })
  @ApiResponse({ status: 201, description: '`{ ok: true }` — contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Datos del usuario de la sesión actual' })
  @ApiResponse({ status: 200, description: 'Datos del usuario autenticado (sin campos sensibles)' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.sub);
  }

  @Get('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Emite un nuevo JWT con el rol actual del usuario en DB (útil tras cambio de rol)' })
  @ApiResponse({ status: 200, description: '{ token, user } — nuevo JWT con rol actualizado' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  refresh(@CurrentUser() user: JwtUser) {
    return this.auth.refreshToken(user.sub);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: '`{ ok: true }` — contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'La contraseña actual es incorrecta' })
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: JwtUser) {
    return this.auth.changePassword(user.sub, dto.currentPassword, dto.newPassword);
  }

  @Post('change-email/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Solicitar cambio de email',
    description: 'Envía un enlace de confirmación al **nuevo** email (válido 24 horas).',
  })
  @ApiResponse({ status: 201, description: '`{ ok: true }` — email de confirmación enviado' })
  @ApiResponse({ status: 400, description: 'El nuevo email es igual al actual' })
  @ApiResponse({ status: 409, description: 'El nuevo email ya está en uso' })
  requestEmailChange(@Body() dto: ChangeEmailRequestDto, @CurrentUser() user: JwtUser) {
    return this.auth.requestEmailChange(user.sub, dto.newEmail);
  }

  @Post('change-email/confirm')
  @ApiOperation({
    summary: 'Confirmar cambio de email con el token recibido',
    description: 'No requiere JWT — el token actúa como prueba de propiedad del nuevo email.',
  })
  @ApiResponse({ status: 201, description: '`{ ok: true }` — email actualizado' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  @ApiResponse({ status: 409, description: 'El nuevo email fue tomado por otro usuario mientras tanto' })
  confirmEmailChange(@Body() dto: ChangeEmailConfirmDto) {
    return this.auth.confirmEmailChange(dto.token);
  }
}
