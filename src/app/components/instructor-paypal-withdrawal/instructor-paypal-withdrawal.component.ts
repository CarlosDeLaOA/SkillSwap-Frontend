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
  console.log(' [INSTRUCTOR-PAYPAL] Componente iniciado');
  this.loadPayPalInfo();
}

  loadPayPalInfo(): void {
  console.log(' [INSTRUCTOR-PAYPAL] Cargando info de PayPal...');
  this.isLoading = true;
  
  this.instructorPayPalService.getInstructorBalance().subscribe({
    next: (balance) => {
      console.log(' [INSTRUCTOR-PAYPAL] Balance recibido:', balance);
      this.instructorPayPalService.getPayPalInfo().subscribe({
        next: (info) => {
          console.log(' [INSTRUCTOR-PAYPAL] Info PayPal recibida:', info);
          this.paypalInfo = {
            ...info,
            currentBalance: balance.balance || 0
          };
          console.log(' [INSTRUCTOR-PAYPAL] paypalInfo final:', this.paypalInfo);
          this.isLoading = false;
        },
        error: (error) => {
          console.error(' [INSTRUCTOR-PAYPAL] Error cargando info:', error);
          this.isLoading = false;
        }
      });
    },
    error: (error) => {
      console.error(' [INSTRUCTOR-PAYPAL] Error cargando balance:', error);
      this.isLoading = false;
    }
  });
}

 openLinkModal(): void {
  console.log(' [MODAL] Abriendo modal de vinculación');
  this.showLinkModal = true;
  this.paypalEmailInput = this.paypalInfo?.paypalEmail || '';
  this.linkError = null;
  console.log(' [MODAL] showLinkModal:', this.showLinkModal);
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
  console.log(' [MODAL] Abriendo modal de retiro');
  this.showWithdrawalModal = true;
  this.withdrawalAmount = 0;
  this.withdrawalError = null;
  console.log(' [MODAL] showWithdrawalModal:', this.showWithdrawalModal);
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
    next: (response) => {
      this.isWithdrawing = false;
      
      // Guardar detalles ANTES de cerrar modal
      const usdAmount = this.calculateUsdAmount(this.withdrawalAmount);
      this.successDetails = {
        amount: this.withdrawalAmount,
        usdAmount: usdAmount
      };
      
      this.successMessage = `¡Retiro procesado exitosamente! Recibirás $${usdAmount} USD en tu cuenta PayPal en 1-3 días hábiles.`;
      
      console.log(' [RETIRO] SkillCoins:', this.withdrawalAmount);
      console.log(' [RETIRO] USD:', usdAmount);
      console.log(' [RETIRO] successDetails:', this.successDetails);
      
      this.closeWithdrawalModal();
      this.loadPayPalInfo();
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