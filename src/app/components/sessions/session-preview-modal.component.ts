import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LearningSessionService } from '../../services/learning-session.service';
import { ILearningSession } from '../../interfaces';

/**
 * Modal component for session preview and publishing
 * Allows minor edits before making session visible
 */
@Component({
  selector: 'app-session-preview-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-preview-modal.component.html',
  styleUrls: ['./session-preview-modal.component.scss']
})
export class SessionPreviewModalComponent implements OnInit {

  //#region Inputs & Outputs
  @Input() session!: ILearningSession;
  @Output() closed = new EventEmitter<void>();
  @Output() published = new EventEmitter<ILearningSession>();
  //#endregion

  //#region Properties
  public isEditing: boolean = false;
  public isPublishing: boolean = false;
  public editedTitle: string = '';
  public editedDescription: string = '';
  
  public originalTitle: string = '';
  public originalDescription: string = '';

  public showNotification: boolean = false;
  public notificationType: 'success' | 'error' | 'warning' = 'success';
  public notificationMessage: string = '';
  private notificationTimeout: any;

  public titleError: string = '';
  public descriptionError: string = '';
  //#endregion

  //#region Constructor
  /**
   * Creates an instance of SessionPreviewModalComponent
   * @param learningSessionService Service for session operations
   */
  constructor(private learningSessionService: LearningSessionService) {}
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Initializes component and sets up editable fields
   */
  ngOnInit(): void {
    this.originalTitle = this.session.title;
    this.originalDescription = this.session.description;
    this.editedTitle = this.session.title;
    this.editedDescription = this.session.description;
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }
  //#endregion

  //#region Public Methods - UI Actions
  /**
   * Enables edit mode for title and description
   */
  enableEditMode(): void {
    this.isEditing = true;
    this.titleError = '';
    this.descriptionError = '';
  }

  /**
   * Cancels edit mode and reverts changes
   */
  cancelEdit(): void {
    this.editedTitle = this.originalTitle;
    this.editedDescription = this.originalDescription;
    this.isEditing = false;
    this.titleError = '';
    this.descriptionError = '';
  }

  /**
   * Saves edits if valid
   */
  saveEdits(): void {
    if (!this.validateEdits()) {
      return;
    }

    this.originalTitle = this.editedTitle;
    this.originalDescription = this.editedDescription;
    this.isEditing = false;
    this.showToast('success', 'Cambios guardados correctamente');
  }

  /**
   * Publishes the session with or without edits
   */
  publishSession(): void {
    if (!this.validateEdits()) {
      return;
    }

    this.isPublishing = true;

    const hasChanges = this.editedTitle !== this.session.title || 
                       this.editedDescription !== this.session.description;

    const minorEdits = hasChanges ? {
      title: this.editedTitle,
      description: this.editedDescription
    } : undefined;

    this.learningSessionService.publishSession(this.session.id!, minorEdits)
      .subscribe({
        next: (response) => {
          console.log(' Session published:', response);
          this.isPublishing = false;
          this.showToast('success', 'Sesión publicada exitosamente');
          
          setTimeout(() => {
            this.published.emit(response.data);
          }, 1000);
        },
        error: (error) => {
          console.error(' Error publishing session:', error);
          this.isPublishing = false;
          
          const errorMessage = error.error?.message || 
                              error.error?.error || 
                              'Error al publicar la sesión';
          this.showToast('error', errorMessage);
        }
      });
  }

  /**
   * Closes the modal without publishing
   */
  closeModal(): void {
    this.closed.emit();
  }
  //#endregion

  //#region Public Methods - Validation
  /**
   * Validates title and description edits
   * @returns True if edits are valid
   */
  validateEdits(): boolean {
    let isValid = true;

    this.titleError = this.validateTitle(this.editedTitle);
    if (this.titleError) {
      isValid = false;
    }

    this.descriptionError = this.validateDescription(this.editedDescription);
    if (this.descriptionError) {
      isValid = false;
    }

    if (!this.validateChangePercentage(this.session.title, this.editedTitle)) {
      this.titleError = 'El cambio en el título excede el 50% permitido';
      isValid = false;
    }

    if (!this.validateChangePercentage(this.session.description, this.editedDescription)) {
      this.descriptionError = 'El cambio en la descripción excede el 50% permitido';
      isValid = false;
    }

    return isValid;
  }
  //#endregion

  //#region Public Methods - Getters
  /**
   * Formats datetime for display
   * @param datetime Datetime string
   * @returns Formatted date and time
   */
  formatDatetime(datetime: string): string {
    if (!datetime) return 'No especificada';
    
    const date = new Date(datetime);
    const dateOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    };
    
    const formattedDate = date.toLocaleDateString('es-ES', dateOptions);
    const formattedTime = date.toLocaleTimeString('es-ES', timeOptions);
    
    return `${formattedDate} ${formattedTime}`;
  }

  /**
   * Gets language display name
   * @param language Language code
   * @returns Language name
   */
  getLanguageName(language: string): string {
    const languages: { [key: string]: string } = {
      'es': 'Español',
      'en': 'English'
    };
    return languages[language] || language;
  }

  /**
   * Gets knowledge area name from session
   * @returns Knowledge area name
   */
  getKnowledgeAreaName(): string {
    return this.session.skill?.knowledgeArea?.name || 'No especificada';
  }

  /**
   * Gets skill name from session
   * @returns Skill name
   */
  getSkillName(): string {
    return this.session.skill?.name || 'No especificada';
  }
  //#endregion

  //#region Private Methods - Validation
  /**
   * Validates title
   * @param title Title to validate
   * @returns Error message or empty string
   */
  private validateTitle(title: string): string {
    if (!title || title.trim().length === 0) {
      return 'El título es obligatorio';
    }
    if (title.trim().length < 5) {
      return 'El título debe tener al menos 5 caracteres';
    }
    return '';
  }

  /**
   * Validates description
   * @param description Description to validate
   * @returns Error message or empty string
   */
  private validateDescription(description: string): string {
    if (!description || description.trim().length === 0) {
      return 'La descripción es obligatoria';
    }
    if (description.trim().length < 20) {
      return 'La descripción debe tener al menos 20 caracteres';
    }
    return '';
  }

  /**
   * Validates that change doesn't exceed 50%
   * @param original Original text
   * @param edited Edited text
   * @returns True if change is within limit
   */
  private validateChangePercentage(original: string, edited: string): boolean {
    if (original === edited) {
      return true;
    }

    const originalLength = original.length;
    const editedLength = edited.length;
    const changePercentage = Math.abs(editedLength - originalLength) / originalLength;

    return changePercentage <= 0.50;
  }
  //#endregion

  //#region Private Methods - UI Helpers
  /**
   * Shows toast notification
   * @param type Notification type
   * @param message Notification message
   */
  private showToast(type: 'success' | 'error' | 'warning', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notificationTimeout = setTimeout(() => {
      this.closeNotification();
    }, 4000);
  }

  /**
   * Closes notification toast
   */
  public closeNotification(): void {
    this.showNotification = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }
  //#endregion
}