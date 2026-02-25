import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshService } from './refresh.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly refreshService: RefreshService) {}

  @Post('register')
  async register(@Body() body: any) {
    const { email, nombre, password, role, restaurante_id } = body;
    const user = await this.authService.register(email, nombre, password, role, restaurante_id);
    const u = Array.isArray(user) ? user[0] : user;
    return { id: (u as any).id, email: (u as any).email, nombre: (u as any).nombre };
  }

  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    const user = await this.authService.validateUser(email, password);
    if (!user) return { error: 'invalid_credentials' };
    const token = this.authService.generateToken({ sub: user.id, email: user.email, role: user.role, restaurante_id: user.restaurante_id });
    // create a rotating refresh token
    const refresh = await this.refreshService.createForUser(user);
    return { access_token: token, refresh_token: refresh };
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    const { refresh_token } = body;
    if (!refresh_token) return { error: 'missing_refresh_token' };
    const result = await this.refreshService.rotate(refresh_token);
    return result;
  }

  @Post('logout')
  async logout(@Body() body: any) {
    const { refresh_token } = body;
    if (!refresh_token) return { error: 'missing_refresh_token' };
    const ok = await this.refreshService.revoke(refresh_token);
    return { success: ok };
  }
}
