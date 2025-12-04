
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CoinPurchaseService } from './coin-purchase.service';
import { ICoinBalanceResponse } from '../interfaces';

/**
 * Pruebas unitarias para el servicio de compra de SkillCoins
 * @author SkillSwap Team
 */
describe('CoinPurchaseService - Prueba HTTP', () => {
  let service: CoinPurchaseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('authToken', 'mock-token-12345');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CoinPurchaseService]
    });
    
    service = TestBed.inject(CoinPurchaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  /**
   * PRUEBA 3 HTTP: Obtener balance de SkillCoins del usuario
   * 
   * Datos de entrada:
   * - Token de autenticación en headers
   * 
   * Datos de salida esperados:
   * - balance: 150 (tipo number según ICoinBalanceResponse)
   */
  it('Prueba 3 HTTP - Balance: debería obtener balance de SkillCoins', (done) => {
    // Usar tu interfaz real ICoinBalanceResponse
    const mockBalanceResponse: ICoinBalanceResponse = {
      balance: 150  // ✅ Tipo number según tu interface
    };

    service.getBalance().subscribe({
      next: (balance) => {
        expect(balance).toBe(150);
        expect(typeof balance).toBe('number');
        
        console.log('PRUEBA 3 HTTP EXITOSA - Balance SkillCoins');
        console.log('Entrada: Token en headers');
        console.log('Salida: balance =', balance);
        done();
      },
      error: (err) => {
        fail('No debería fallar: ' + err);
        done();
      }
    });

    const req = httpMock.expectOne('http://localhost:8080/api/coins/balance');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBe(true);
    
    req.flush(mockBalanceResponse);
  });
});