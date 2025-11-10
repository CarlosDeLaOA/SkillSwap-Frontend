import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { IAccountBalance } from '../../interfaces';

/**
 * Componente para mostrar el saldo de la cuenta
 */
@Component({
  selector: 'app-balance-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-dashboard.component.html',
  styleUrls: ['./balance-dashboard.component.scss']
})
export class BalanceDashboardComponent implements OnInit {

  //#region Propiedades
  accountBalance: number = 0;  // ← Inicializado en 0
  isLoading: boolean = true;
  //#endregion

  //#region Constructor
  constructor(private dashboardService: DashboardService) { }
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.loadAccountBalance();
  }
  //#endregion

  //#region Métodos Públicos
  onSkillUpClick(): void {
    console.log('Botón SkillUp clickeado');
    // TODO: Implementar funcionalidad SkillUp
  }
  //#endregion

  //#region Métodos Privados
  /**
   * Carga el saldo de la cuenta desde la API
   */
  private loadAccountBalance(): void {
    this.isLoading = true;
    this.dashboardService.getAccountBalance().subscribe({
      next: (data: any) => {
        console.log('✅ Datos del balance recibidos:', data);
        
        // Maneja diferentes estructuras de respuesta
        if (data && data.data) {
          // Si viene envuelto en { data: { skillCoins: 300 } }
          this.accountBalance = data.data.skillCoins || 0;
        } else if (data && data.skillCoins !== undefined) {
          // Si viene directo { skillCoins: 300 }
          this.accountBalance = data.skillCoins;
        } else {
          // Si no encuentra nada, pone 0
          console.warn('⚠️ No se encontró el saldo, usando 0');
          this.accountBalance = 0;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando balance:', error);
        console.error('Detalles completos:', error.error);
        this.accountBalance = 0; // ← Asegura que siempre haya un valor
        this.isLoading = false;
      }
    });
  }
  //#endregion
}