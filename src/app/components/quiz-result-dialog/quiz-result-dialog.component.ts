import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

/**
 * Datos del resultado del cuestionario
 */
export interface IQuizResult {
  passed: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  remainingAttempts: number;
}

/**
 * Componente para mostrar el resultado del cuestionario
 */
@Component({
  selector: 'app-quiz-result-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './quiz-result-dialog.component.html',
  styleUrls: ['./quiz-result-dialog.component.scss']
})
export class QuizResultDialogComponent {

  //#region Constructor
  constructor(
    public dialogRef: MatDialogRef<QuizResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IQuizResult
  ) {}
  //#endregion

  //#region Methods
  /**
   * Cierra el diálogo
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Obtiene el mensaje según el resultado
   */
  getResultMessage(): string {
    if (this.data.passed) {
      return '¡Felicitaciones!';
    } else if (this.data.remainingAttempts > 0) {
      return 'Intenta nuevamente';
    } else {
      return 'No aprobado';
    }
  }

  /**
   * Obtiene el submensaje según el resultado
   */
  getResultSubMessage(): string {
    if (this.data.passed) {
      return 'Has aprobado el cuestionario exitosamente';
    } else if (this.data.remainingAttempts > 0) {
      return `Te queda${this.data.remainingAttempts > 1 ? 'n' : ''} ${this.data.remainingAttempts} intento${this.data.remainingAttempts > 1 ? 's' : ''}`;
    } else {
      return 'Has alcanzado el máximo de intentos';
    }
  }
  //#endregion
}