
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ILoginResponseSkillSwap, IPerson } from '../interfaces';

/**
 * Pruebas unitarias para el servicio de autenticación
 * Proyecto: SkillSwap
 * @author SkillSwap Team
 */
describe('AuthService - Pruebas Unitarias HTTP', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    
    localStorage.clear();
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  /**
   * PRUEBA 1 HTTP: Login exitoso con credenciales válidas
   * 
   * Datos de entrada:
   * - email: skillseeker@skillswap.com
   * - password: Test123!
   * 
   * Datos de salida esperados:
   * - token: JWT válido
   * - expiresIn: 3600
   * - authPerson: objeto IPerson con datos del usuario
   */
  it('Prueba 1 HTTP - Login: debería autenticar usuario y guardar datos correctamente', (done) => {
    const credentials = {
      email: 'skillseeker@skillswap.com',
      password: 'Test123!'
    };
    const mockAuthPerson: IPerson = {
      id: 1,
      email: 'skillseeker@skillswap.com',
      fullName: 'Test User',
      profilePhotoUrl: 'https://example.com/photo.jpg',
      emailVerified: true,
      active: true
    };

    const mockResponse: ILoginResponseSkillSwap = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token-12345',
      expiresIn: 3600,
      authPerson: mockAuthPerson
    };

    service.login(credentials).subscribe({
      next: (response) => {
        expect(response).toBeTruthy();
        expect(response.token).toBe(mockResponse.token);
        expect(response.expiresIn).toBe(3600);
        expect(response.authPerson.email).toBe('skillseeker@skillswap.com');
        expect(service.getAccessToken()).toBe(mockResponse.token);
        expect(service.isAuthenticated()).toBe(true);
        
        console.log('PRUEBA 1 HTTP EXITOSA - Login');
        console.log('Entrada:', credentials);
        console.log('Salida: token y usuario guardados');
        done();
      },
      error: (err) => { 
        fail('No debería fallar: ' + err); 
        done(); 
      }
    });

    const req = httpMock.expectOne('auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(mockResponse);
  });

  /**
   * PRUEBA 2 HTTP: Registro de nuevo usuario
   * 
   * Datos de entrada:
   * - Usuario nuevo con email, password, fullName
   * 
   * Datos de salida esperados:
   * - token: JWT del nuevo usuario
   * - authPerson: datos del usuario registrado
   */
  it('Prueba 2 HTTP - Signup: debería registrar nuevo usuario exitosamente', (done) => {
    const newUser = {
      email: 'nuevo@skillswap.com',
      passwordHash: 'SecurePass123!',
      fullName: 'Nuevo Usuario',
      preferredLanguage: 'es'
    };

    const mockAuthPerson: IPerson = {
      id: 10,
      email: 'nuevo@skillswap.com',
      fullName: 'Nuevo Usuario',
      emailVerified: false,
      active: true
    };

    const mockResponse: ILoginResponseSkillSwap = {
      token: 'new-user-token-xyz',
      expiresIn: 3600,
      authPerson: mockAuthPerson
    };

    service.signup(newUser as any).subscribe({
      next: (response) => {
        expect(response).toBeTruthy();
        expect(response.token).toBeDefined();
        expect(response.authPerson.email).toBe('nuevo@skillswap.com');
        
        console.log('PRUEBA 2 HTTP EXITOSA - Signup');
        console.log('Entrada: nuevo usuario');
        console.log('Salida: usuario registrado');
        done();
      },
      error: (err) => { 
        fail('No debería fallar: ' + err); 
        done(); 
      }
    });

    const req = httpMock.expectOne('auth/signup');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  /**
   * PRUEBA 3: Verificar autenticación con check()
   */
  it('Prueba 4 - Check Auth: debería verificar si usuario está autenticado', () => {
    expect(service.check()).toBe(false);
    
    const testToken = 'test-token-abc123';
    service.setToken(testToken);

    expect(service.check()).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getAccessToken()).toBe(testToken);
    
    console.log('PRUEBA 4 EXITOSA - Verificación autenticación');
  });

  /**
   * PRUEBA 4: Verificar roles con hasRole()
   */
  it('Prueba 5 - Has Role: debería verificar roles del usuario correctamente', () => {
    const mockUser: any = {
      id: 5,
      email: 'test@skillswap.com',
      fullName: 'Test User',
      authorities: [
        { authority: 'ROLE_USER' }
      ]
    };

    service.setUser(mockUser);

    expect(service.hasRole('ROLE_USER')).toBe(true);
    expect(service.hasRole('ROLE_ADMIN')).toBe(false);
    
    console.log('PRUEBA 5 EXITOSA - Verificación de roles');
  });

  
  /**
   * PRUEBA 6: Login con Google OAuth
   */
  it('Prueba 6 - Google OAuth: debería autenticar con Google', (done) => {
    const googleCode = 'GOOGLE_AUTH_CODE_123456';
    const redirectUri = 'http://localhost:4200/auth/callback';

    const mockAuthPerson: IPerson = {
      id: 20,
      email: 'google@skillswap.com',
      fullName: 'Google User',
      emailVerified: true,
      active: true
    };

    const mockResponse = {
      token: 'google-oauth-token-abc789',
      expiresIn: 3600,
      authUser: mockAuthPerson
    };

    service.loginWithGoogle(googleCode, redirectUri).subscribe({
      next: (response) => {
        expect(response.token).toBe('google-oauth-token-abc789');
        expect(service.isAuthenticated()).toBe(true);
        
        console.log('PRUEBA 6 EXITOSA - Login con Google');
        done();
      },
      error: (err) => { 
        fail('No debería fallar: ' + err); 
        done(); 
      }
    });

    const req = httpMock.expectOne('/auth/google');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});