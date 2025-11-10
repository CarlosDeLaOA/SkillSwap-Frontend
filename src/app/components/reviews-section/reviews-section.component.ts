import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { ICredential, IFeedback } from '../../interfaces';

/**
 * Component to display reviews/credentials carousel
 */
@Component({
  selector: 'app-reviews-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews-section.component.html',
  styleUrls: ['./reviews-section.component.scss']
})
export class ReviewsSectionComponent implements OnInit, OnDestroy {

  //#region Properties
  achievements: (ICredential | IFeedback)[] = [];
  role: 'INSTRUCTOR' | 'LEARNER' = 'LEARNER';
  isLoading: boolean = true;
  currentIndex: number = 0;
  autoSlideInterval: any;
  itemsPerView: number = 3;
  //#endregion

  //#region Constructor
  /**
   * Creates an instance of ReviewsSectionComponent
   * @param dashboardService Service to fetch dashboard data
   */
  constructor(private dashboardService: DashboardService) { }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Initializes the component and fetches achievements data
   */
  ngOnInit(): void {
    this.detectUserRole();
    this.loadAchievements();
    this.startAutoSlide();
  }

  /**
   * Cleans up the auto-slide interval when component is destroyed
   */
  ngOnDestroy(): void {
    this.stopAutoSlide();
  }
  //#endregion

  //#region Public Methods
  /**
   * Gets the title based on user role
   * @returns Title string
   */
  getTitle(): string {
    return this.role === 'INSTRUCTOR' ? 'Mis Reseñas' : 'Mis Credenciales';
  }

  /**
   * Checks if an achievement is a Feedback
   * @param achievement Achievement to check
   * @returns True if it's a Feedback
   */
  isFeedback(achievement: ICredential | IFeedback): achievement is IFeedback {
    return 'comment' in achievement;
  }

  /**
   * Checks if an achievement is a Credential
   * @param achievement Achievement to check
   * @returns True if it's a Credential
   */
  isCredential(achievement: ICredential | IFeedback): achievement is ICredential {
    return 'skillName' in achievement;
  }

  /**
   * Gets the visible achievements for current carousel position
   * @returns Array of visible achievements
   */
  getVisibleAchievements(): (ICredential | IFeedback)[] {
    const start = this.currentIndex;
    const end = start + this.itemsPerView;
    return this.achievements.slice(start, end);
  }

  /**
   * Moves carousel to previous items
   */
  previousSlide(): void {
    this.stopAutoSlide();
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = Math.max(0, this.achievements.length - this.itemsPerView);
    }
    this.startAutoSlide();
  }

  /**
   * Moves carousel to next items
   */
  nextSlide(): void {
    this.stopAutoSlide();
    if (this.currentIndex < this.achievements.length - this.itemsPerView) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
    this.startAutoSlide();
  }

  /**
   * Checks if there are achievements to display
   * @returns True if there are achievements
   */
  hasAchievements(): boolean {
    return this.achievements.length > 0;
  }

  /**
   * Type-safe method to get feedback properties
   * @param achievement Achievement object
   * @returns Feedback object if it is a feedback
   */
  asFeedback(achievement: ICredential | IFeedback): IFeedback {
    return achievement as IFeedback;
  }

  /**
   * Type-safe method to get credential properties
   * @param achievement Achievement object
   * @returns Credential object if it is a credential
   */
  asCredential(achievement: ICredential | IFeedback): ICredential {
    return achievement as ICredential;
  }
  //#endregion

  //#region Private Methods
  /**
   * Loads achievements from the API
   */
  private loadAchievements(): void {
    this.isLoading = true;
    this.dashboardService.getRecentAchievements().subscribe({
      next: (data: (ICredential | IFeedback)[]) => {
        this.achievements = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading achievements:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Detects user role and sets items per view
   */
  private detectUserRole(): void {
    this.dashboardService.getLearningHours().subscribe({
      next: (data) => {
        this.role = data.role;
        this.itemsPerView = this.role === 'INSTRUCTOR' ? 3 : 5;
      },
      error: (error) => {
        console.error('Error detecting user role:', error);
      }
    });
  }

  /**
   * Starts automatic carousel sliding
   */
  private startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  /**
   * Stops automatic carousel sliding
   */
  private stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }
  //#endregion
}