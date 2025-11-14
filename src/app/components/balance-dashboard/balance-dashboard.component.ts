import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { IAccountBalance, IBalanceData } from '../../interfaces';

@Component({
  selector: 'app-balance-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-dashboard.component.html',
  styleUrls: ['./balance-dashboard.component.scss']
})
export class BalanceDashboardComponent implements OnInit {

  accountBalance: number = 0; 
  isLoading: boolean = true;
  
  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.loadAccountBalance();
  }
  
  onSkillUpClick(): void {
    console.log('Botón SkillUp clickeado');
  }

  /**
   * Obtiene los datos para exportación
   */
  getExportData(): IBalanceData {
    return {
      skillCoins: this.accountBalance
    };
  }

  private loadAccountBalance(): void {
    this.isLoading = true;
    this.dashboardService.getAccountBalance().subscribe({
      next: (data: any) => {
        console.log('Datos del balance recibidos:', data);
        
        if (data && data.data) {
          this.accountBalance = data.data.skillCoins || 0;
        } else if (data && data.skillCoins !== undefined) {
          this.accountBalance = data.skillCoins;
        } else {
          console.warn('No se encontró el saldo, usando 0');
          this.accountBalance = 0;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando balance:', error);
        console.error('Detalles completos:', error.error);
        this.accountBalance = 0; 
        this.isLoading = false;
      }
    });
  }
}