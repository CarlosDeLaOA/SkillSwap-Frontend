import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorPayPalService } from '../../services/instructor-paypal.service';

interface SuccessDetails {
  amount: number;
  usdAmount: string;
}

@Component({
  selector: 'app-instructor-paypal-withdrawal',
  standalone: true,
  imports: [CommonModule, FormsModule],  
  templateUrl: './instructor-paypal-withdrawal.component.html',
  styleUrls: ['./instructor-paypal-withdrawal.component.scss']
})
export class InstructorPaypalWithdrawalComponent implements OnInit {

  isLoading: boolean = true;
  paypalInfo: any = null;

  showLinkModal: boolean = false;
  paypalEmailInput: string = '';
  isLinking: boolean = false;
  linkError: string | null = null;

  showWithdrawalModal: boolean = false;
  withdrawalAmount: number = 0;
  isWithdrawing: boolean = false;
  withdrawalError: string | null = null;

  showSuccessModal: boolean = false;
  successMessage: string = '';
  successDetails: SuccessDetails | null = null;

  constructor(private instructorPayPalService: InstructorPayPalService) { }

  ngOnInit(): void {
    this.loadPayPalInfo();
  }

  loadPayPalInfo(): void {
    this.isLoading = true;
    
    this.instructorPayPalService.getInstructorBalance().subscribe({
      next: (balance) => {
        this.instructorPayPalService.getPayPalInfo().subscribe({
          next: (info) => {
            this.paypalInfo = {
              ...info,
              currentBalance: balance.balance || 0
            };
            this.isLoading = false;
          },
          error: () => this.isLoading = false
        });
      },
      error: () => this.isLoading = false
    });
  }

  openLinkModal(): void {
    this.showLinkModal = true;
    this.paypalEmailInput = this.paypalInfo?.paypalEmail || '';
    this.linkError = null;
  }

  closeLinkModal(): void {
    this.showLinkModal = false;
    this.paypalEmailInput = '';
    this.linkError = null;
  }

  linkPayPalAccount(): void {
    if (!this.paypalEmailInput) {
      this.linkError = 'Por favor ingresa un email válido';
      return;
    }

    this.isLinking = true;
    this.linkError = null;

    this.instructorPayPalService.linkPayPalAccount(this.paypalEmailInput).subscribe({
      next: () => {
        this.isLinking = false;
        this.closeLinkModal();
        this.loadPayPalInfo();
        this.successMessage = `Cuenta PayPal vinculada exitosamente: ${this.paypalEmailInput}`;
        this.successDetails = null;
        this.showSuccessModal = true;
      },
      error: (error) => {
        this.linkError = error.error?.error || 'Error al vincular la cuenta PayPal';
        this.isLinking = false;
      }
    });
  }

  openWithdrawalModal(): void {
    this.showWithdrawalModal = true;
    this.withdrawalAmount = 0;
    this.withdrawalError = null;
  }

  closeWithdrawalModal(): void {
    this.showWithdrawalModal = false;
    this.withdrawalAmount = 0;
    this.withdrawalError = null;
  }

  processWithdrawal(): void {
    if (!this.withdrawalAmount || this.withdrawalAmount < (this.paypalInfo?.minWithdrawal || 10)) {
      this.withdrawalError = `El retiro mínimo es de ${this.paypalInfo?.minWithdrawal || 10} SkillCoins`;
      return;
    }

    if (this.withdrawalAmount > (this.paypalInfo?.currentBalance || 0)) {
      this.withdrawalError = 'Balance insuficiente';
      return;
    }

    this.isWithdrawing = true;
    this.withdrawalError = null;

    this.instructorPayPalService.withdrawToPayPal(this.withdrawalAmount).subscribe({
      next: () => {
        this.isWithdrawing = false;
        this.closeWithdrawalModal();
        this.loadPayPalInfo();
        
        const usdAmount = this.calculateUsdAmount(this.withdrawalAmount);
        this.successMessage = `¡Retiro procesado exitosamente! Recibirás $${usdAmount} USD en tu cuenta PayPal en 1-3 días hábiles.`;
        
        this.successDetails = {
          amount: this.withdrawalAmount,
          usdAmount: usdAmount
        };
        
        this.showSuccessModal = true;
      },
      error: (error) => {
        this.withdrawalError = error.error?.error || 'Error al procesar el retiro';
        this.isWithdrawing = false;
      }
    });
  }

  calculateUsdAmount(skillCoins: number): string {
    if (!skillCoins || !this.paypalInfo?.conversionRate) {
      return '0.00';
    }
    
    const usdAmount = skillCoins * this.paypalInfo.conversionRate;
    return usdAmount.toFixed(2);
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = '';
    this.successDetails = null;
  }
}