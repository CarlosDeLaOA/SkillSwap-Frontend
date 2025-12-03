import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { QuizService } from '../../services/quiz.service';
import { AuthService } from '../../services/auth.service';
import {
  IQuiz,
  IQuestion,
  QuizStatus,
  IDragDropState,
  IQuizOptions,
  IPerson
} from '../../interfaces';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QuizResultDialogComponent } from './../../components/quiz-result-dialog/quiz-result-dialog.component';

/**
 * Componente para la página de cuestionarios de evaluación
 */
@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit, OnDestroy {

  //#region Properties
  public quiz: IQuiz | null = null;
  public questions: IQuestion[] = [];
  public options: IQuizOptions = {
    available: [],
    used: new Map()
  };
  public dragDropState: IDragDropState = {
    draggedOption: null,
    dropZoneQuestion: null
  };
  public loading = true;
  public submitting = false;
  public remainingAttempts = 2;
  public currentAttempt = 1;
  public canSubmit = false;

  private sessionId: number | null = null;
  private learnerId: number | null = null;
  private destroy$ = new Subject<void>();
  private autoSaveInterval = 30000;
  //#endregion

  //#region Constructor
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.extractRouteParams();
    this.validateAuthentication();
    this.loadQuiz();
    this.startAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion

  //#region Initialization Methods
  /**
   * Extrae los parámetros de la URL
   */
  private extractRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.sessionId = params['sessionId'] ? +params['sessionId'] : null;
        
        if (!this.sessionId) {
          this.showError('Parámetros de sesión inválidos');
          this.router.navigate(['/app/dashboard']);
        }
      });
  }

  /**
   * Valida que el usuario esté autenticado y sea learner
   */
  private validateAuthentication(): void {
    const user = this.authService.getUser() as IPerson;

    if (!user || !user.learner) {
      this.showError('Debes ser un aprendiz para acceder a este cuestionario');
      this.router.navigate(['/login']);
      return;
    }

    this.learnerId = user.learner.id!;
  }

  /**
   * Carga el cuestionario del servidor
   */
  private loadQuiz(): void {
    if (!this.sessionId || !this.learnerId) {
      return;
    }

    this.quizService.getRemainingAttempts(this.sessionId, this.learnerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.remainingAttempts = response.remainingAttempts;
          
          if (this.remainingAttempts === 0) {
            this.showError('Has alcanzado el número máximo de intentos permitidos');
            this.router.navigate(['/app/dashboard']);
            return;
          }
          
          this.loadQuizData();
        },
        error: (error) => {
          this.showError(error.message);
          this.loading = false;
        }
      });
  }

  /**
   * Carga los datos del cuestionario
   */
  private loadQuizData(): void {
    this.quizService.getOrCreateQuiz(this.sessionId!, this.learnerId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (quiz) => {
          this.quiz = quiz;
          this.questions = quiz.questions.sort((a, b) => a.number - b.number);
          this.currentAttempt = quiz.attemptNumber;
          
          this.initializeOptions();
          this.restoreUserAnswers();
          this.checkCanSubmit();
          
          this.loading = false;
        },
        error: (error) => {
          this.showError(error.message);
          this.loading = false;
        }
      });
  }

  /**
   * Inicializa las opciones de respuesta
   */
  private initializeOptions(): void {
    if (!this.quiz) {
      return;
    }

    const allOptions = this.quizService.parseOptions(this.quiz.optionsJson);
    this.options.available = [...allOptions];
  }

  /**
   * Restaura las respuestas guardadas previamente
   */
  private restoreUserAnswers(): void {
    this.questions.forEach(question => {
      if (question.userAnswer) {
        this.options.used.set(question.number, question.userAnswer);
        this.options.available = this.options.available.filter(
          opt => opt !== question.userAnswer
        );
      }
    });
  }

  /**
   * Inicia el guardado automático periódico
   */
  private startAutoSave(): void {
    interval(this.autoSaveInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.quiz && this.quiz.status === QuizStatus.IN_PROGRESS) {
          this.saveCurrentProgress();
        }
      });
  }
  //#endregion

  //#region Drag and Drop Methods
  /**
   * Maneja el evento de inicio de arrastre
   */
  onDragStart(event: DragEvent, option: string): void {
    this.dragDropState.draggedOption = option;
    event.dataTransfer!.effectAllowed = 'move';
  }

  /**
   * Maneja el evento de arrastre sobre una zona
   */
  onDragOver(event: DragEvent, questionNumber: number): void {
    event.preventDefault();
    this.dragDropState.dropZoneQuestion = questionNumber;
    event.dataTransfer!.dropEffect = 'move';
  }

  /**
   * Maneja el evento de salida de la zona de arrastre
   */
  onDragLeave(event: DragEvent): void {
    this.dragDropState.dropZoneQuestion = null;
  }

  /**
   * Maneja el evento de soltar una opción
   */
  onDrop(event: DragEvent, questionNumber: number): void {
    event.preventDefault();
    
    const draggedOption = this.dragDropState.draggedOption;
    if (!draggedOption) {
      return;
    }

    const previousAnswer = this.options.used.get(questionNumber);
    if (previousAnswer) {
      this.options.available.push(previousAnswer);
    }

    this.options.used.set(questionNumber, draggedOption);
    this.options.available = this.options.available.filter(opt => opt !== draggedOption);

    const question = this.questions.find(q => q.number === questionNumber);
    if (question) {
      question.userAnswer = draggedOption;
      this.saveAnswer(questionNumber, draggedOption);
    }

    this.dragDropState.draggedOption = null;
    this.dragDropState.dropZoneQuestion = null;
    this.checkCanSubmit();
  }

  /**
   * Remueve una respuesta de una pregunta
   */
  removeAnswer(questionNumber: number): void {
    const answer = this.options.used.get(questionNumber);
    if (!answer) {
      return;
    }

    this.options.used.delete(questionNumber);
    this.options.available.push(answer);
    this.options.available.sort();

    const question = this.questions.find(q => q.number === questionNumber);
    if (question) {
      question.userAnswer = undefined;
      this.saveAnswer(questionNumber, '');
    }

    this.checkCanSubmit();
  }
  //#endregion

  //#region Save Methods
  /**
   * Guarda una respuesta individual
   */
  private saveAnswer(questionNumber: number, userAnswer: string): void {
    if (!this.quiz) {
      return;
    }

    this.quizService.savePartialAnswer(this.quiz.id, {
      questionNumber,
      userAnswer
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      error: (error) => {
        this.showError('Error al guardar la respuesta');
      }
    });
  }

  /**
   * Guarda todo el progreso actual
   */
  private saveCurrentProgress(): void {
    this.questions.forEach(question => {
      if (question.userAnswer) {
        this.saveAnswer(question.number, question.userAnswer);
      }
    });
  }
  //#endregion

  //#region Submit Methods
  /**
   * Verifica si se puede enviar el cuestionario
   */
  private checkCanSubmit(): void {
    this.canSubmit = this.questions.every(q => q.userAnswer && q.userAnswer.trim() !== '');
  }

  /**
   * Envía el cuestionario para calificación
   */
  submitQuiz(): void {
    if (!this.canSubmit || !this.quiz) {
      this.showError('Debes responder todas las preguntas antes de enviar');
      return;
    }

    this.submitting = true;

    this.quizService.submitQuiz(this.quiz.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.submitting = false;
          this.showResultDialog(response.data);
        },
        error: (error) => {
          this.submitting = false;
          this.showError(error.message);
        }
      });
  }

  /**
   * Muestra el diálogo con el resultado
   */
  private showResultDialog(quiz: IQuiz): void {
    const dialogRef = this.dialog.open(QuizResultDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        passed: quiz.passed,
        score: quiz.scoreObtained,
        totalQuestions: this.questions.length,
        percentage: quiz.scoreObtained ? (quiz.scoreObtained * 100 / this.questions.length) : 0,
        remainingAttempts: this.remainingAttempts - 1
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.router.navigate(['/app/dashboard']);
      });
  }
  //#endregion

  //#region Helper Methods
  /**
   * Obtiene el texto de una pregunta
   */
  getQuestionText(question: IQuestion): string {
    return question.text;
  }

  /**
   * Verifica si una zona de drop está activa
   */
  isDropZoneActive(questionNumber: number): boolean {
    return this.dragDropState.dropZoneQuestion === questionNumber;
  }

  /**
   * Obtiene la respuesta seleccionada para una pregunta
   */
  getSelectedAnswer(questionNumber: number): string | undefined {
    return this.options.used.get(questionNumber);
  }

  /**
   * Muestra un mensaje de error
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Muestra un mensaje de éxito
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
  //#endregion
}