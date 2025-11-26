import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CoinPurchaseService } from '../../services/coin-purchase.service';
import { AuthService } from '../../services/auth.service';
import { ICoinPackage, ICoinPurchaseResponse } from '../../interfaces';

declare const paypal: any;

@Component({
  selector: 'app-coin-purchase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coin-purchase.component.html',
  styleUrls: ['./coin-purchase.component.scss']
})
export class CoinPurchaseComponent implements OnInit {

  packages: ICoinPackage[] = [
    { type: 'BASIC', coins: 10, priceUsd: 9.99, image: 'assets/img/10 skillcoins.JPG' },
    { type: 'MEDIUM', coins: 30, priceUsd: 27.99, popular: true, image: 'assets/img/30 skillcoins.JPG' },
    { type: 'LARGE', coins: 50, priceUsd: 44.99, image: 'assets/img/50 skillcoins.JPG' },
    { type: 'PREMIUM', coins: 100, priceUsd: 84.99, image: 'assets/img/100 skillcoins.JPG' }
  ];

  currentBalance: number = 0;
  selectedPackage: ICoinPackage | null = null;
  isLoading: boolean = false;
  isPurchasing: boolean = false;
  purchaseSuccess: boolean = false;
  purchaseError: string | null = null;
  
  private coinPurchaseService = inject(CoinPurchaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadBalance();
    this.loadPayPalScript();
  }

  /**
   * Carga el balance actual del usuario
   */
  loadBalance(): void {
    this.isLoading = true;
    this.coinPurchaseService.getBalance().subscribe({
      next: (balance) => {
        this.currentBalance = balance;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando balance:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga el script de PayPal SDK
   */
  loadPayPalScript(): void {
    if (typeof paypal !== 'undefined') {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=ATxzD9rHTPnWSn9LvKdBdiVXMdBVysCJdloAKWXKTqxRIEgYRUaiMtBrxuTApVE4d6-Ea0YBr0wolXpF&currency=USD';
    script.async = true;
    script.onload = () => {
      console.log('✅ PayPal SDK cargado');
    };
    document.body.appendChild(script);
  }

  /**
   * Selecciona un paquete e inicia el proceso de pago
   */
  selectPackage(pkg: ICoinPackage): void {
    this.selectedPackage = pkg;
    this.purchaseError = null;
    this.purchaseSuccess = false;

    setTimeout(() => {
      this.renderPayPalButton();
    }, 100);
  }

  /**
   * Renderiza el botón de PayPal (solo botón amarillo, sin tarjeta)
   */
  renderPayPalButton(): void {
    const container = document.getElementById('paypal-button-container');
    if (!container || !this.selectedPackage) return;

    container.innerHTML = '';

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      },
      fundingSource: paypal.FUNDING.PAYPAL,
      createOrder: (data: any, actions: any) => {
        return this.coinPurchaseService.createOrder({
          packageType: this.selectedPackage!.type
        }).toPromise().then((orderId: string | undefined) => {
          if (!orderId) {
            throw new Error('No se pudo crear la orden de PayPal');
          }
          console.log('✅ Orden creada:', orderId);
          return orderId;
        });
      },
      onApprove: (data: any, actions: any) => {
        this.isPurchasing = true;
        
        return this.coinPurchaseService.purchaseCoins({
          packageType: this.selectedPackage!.type,
          paypalOrderId: data.orderID
        }).toPromise().then((response: ICoinPurchaseResponse | undefined) => {
          if (response) {
            console.log('✅ Compra exitosa:', response);
            this.handlePurchaseSuccess(response);
          }
        }).catch((error: any) => {
          console.error('❌ Compra fallida:', error);
          this.handlePurchaseError(error);
        });
      },
      onError: (err: any) => {
        console.error('❌ Error de PayPal:', err);
        this.purchaseError = 'El pago falló. Por favor intenta de nuevo.';
        this.isPurchasing = false;
      },
      onCancel: () => {
        console.log('⚠️ Pago cancelado');
        this.selectedPackage = null;
      }
    }).render('#paypal-button-container');
  }

  /**
   * Maneja compra exitosa
   */
  handlePurchaseSuccess(response: ICoinPurchaseResponse): void {
    this.isPurchasing = false;
    this.purchaseSuccess = true;
    this.currentBalance = response.newBalance;
    
    setTimeout(() => {
      this.selectedPackage = null;
      this.purchaseSuccess = false;
    }, 5000);
  }

  /**
   * Maneja error de compra
   */
  handlePurchaseError(error: any): void {
    this.isPurchasing = false;
    this.purchaseError = error.error?.error || 'Ocurrió un error. Por favor intenta de nuevo.';
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.selectedPackage = null;
    this.purchaseError = null;
    this.purchaseSuccess = false;
  }

  /**
   * Navega al dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/app/dashboard']);
  }
}