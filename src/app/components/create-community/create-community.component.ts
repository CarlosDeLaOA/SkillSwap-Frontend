import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommunityService } from '../../services/community.service';
import { ICreateCommunityRequest, ICreateCommunityResponse, ICommunityValidation } from '../../interfaces';

/**
 * Componente para crear una nueva comunidad de aprendizaje
 */
@Component({
  selector: 'app-create-community',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-community.component.html',
  styleUrls: ['./create-community.component.scss']
})
export class CreateCommunityComponent implements OnInit {

  //#region Properties
  name: string = '';
  description: string = '';
  memberEmailsInput: string = '';
  memberEmails: string[] = [];
  
  isSubmitting: boolean = false;
  showSuccess: boolean = false;
  showError: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  
  validation: ICommunityValidation = {
    name: { isValid: true, error: '' },
    description: { isValid: true, error: '' },
    memberEmails: { isValid: true, error: '' }
  };

  invitationsSummary: {
    successful: string[];
    failed: string[];
  } | null = null;
  //#endregion

  //#region Constructor
  constructor(
    private communityService: CommunityService,
    private router: Router
  ) { }
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
  }
  //#endregion

  //#region Public Methods
  addEmail(): void {
    const email = this.memberEmailsInput.trim();
    
    if (!email) {
      return;
    }

    if (!this.isValidEmail(email)) {
      this.validation.memberEmails = {
        isValid: false,
        error: 'Formato de email inválido'
      };
      return;
    }

    if (this.memberEmails.includes(email)) {
      this.validation.memberEmails = {
        isValid: false,
        error: 'Este email ya está en la lista'
      };
      return;
    }

    if (this.memberEmails.length >= 9) {
      this.validation.memberEmails = {
        isValid: false,
        error: 'Máximo 9 miembros permitidos'
      };
      return;
    }

    this.memberEmails.push(email);
    this.memberEmailsInput = '';
    this.validation.memberEmails = { isValid: true, error: '' };
  }

  removeEmail(index: number): void {
    this.memberEmails.splice(index, 1);
    this.validation.memberEmails = { isValid: true, error: '' };
  }

  onEmailKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addEmail();
    }
  }

  validateForm(): boolean {
    let isValid = true;

    this.validation.name = { isValid: true, error: '' };
    this.validation.description = { isValid: true, error: '' };
    this.validation.memberEmails = { isValid: true, error: '' };

    if (!this.name.trim()) {
      this.validation.name = {
        isValid: false,
        error: 'El nombre es requerido'
      };
      isValid = false;
    } else if (this.name.length > 150) {
      this.validation.name = {
        isValid: false,
        error: 'El nombre no puede exceder 150 caracteres'
      };
      isValid = false;
    }

    if (this.memberEmails.length === 0) {
      this.validation.memberEmails = {
        isValid: false,
        error: 'Debes agregar al menos un miembro'
      };
      isValid = false;
    }

    return isValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.showError = false;
    this.showSuccess = false;

    const creatorId = this.getCreatorId();

    const request: ICreateCommunityRequest = {
      name: this.name.trim(),
      description: this.description.trim(),
      creatorId: creatorId,
      memberEmails: this.memberEmails
    };

    this.communityService.createCommunity(request).subscribe({
      next: (response: ICreateCommunityResponse) => {
        this.isSubmitting = false;

        if (response.success) {
          this.showSuccess = true;
          this.successMessage = response.message;
          
          if (response.invitationsSummary) {
            this.invitationsSummary = {
              successful: response.invitationsSummary.successfulInvitations,
              failed: response.invitationsSummary.failedInvitations
            };
          }

          setTimeout(() => {
            this.router.navigate(['/app/dashboard']);
          }, 5000);
        } else {
          this.showError = true;
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.showError = true;

        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
        } else {
          this.errorMessage = 'Error al crear la comunidad. Por favor intenta nuevamente.';
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/app/dashboard']);
  }
  //#endregion

  //#region Private Methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  private getCreatorId(): number {
    const authPerson = localStorage.getItem('authPerson');
    if (authPerson) {
      const person = JSON.parse(authPerson);
      return person.learner?.id || 1;
    }
    return 1;
  }
  //#endregion
}