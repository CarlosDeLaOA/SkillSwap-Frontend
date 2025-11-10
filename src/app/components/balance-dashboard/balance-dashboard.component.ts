import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { IAccountBalance } from '../../interfaces';

/**
 * Component to display account balance
 */
@Component({
  selector: 'app-balance-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-dashboard.component.html',
  styleUrls: ['./balance-dashboard.component.scss']
})
export class BalanceDashboardComponent implements OnInit {

  //#region Properties
  accountBalance: number = 0;
  isLoading: boolean = true;
  //#endregion

  //#region Constructor
  /**
   * Creates an instance of BalanceDashboardComponent
   * @param dashboardService Service to fetch dashboard data
   */
  constructor(private dashboardService: DashboardService) { }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Initializes the component and fetches account balance
   */
  ngOnInit(): void {
    this.loadAccountBalance();
  }
  //#endregion

  //#region Public Methods
  /**
   * Handles SkillUp button click
   */
  onSkillUpClick(): void {
    console.log('SkillUp button clicked');
    // TODO: Implement SkillUp functionality
  }
  //#endregion

  //#region Private Methods
  /**
   * Loads account balance from the API
   */
  private loadAccountBalance(): void {
    this.isLoading = true;
    this.dashboardService.getAccountBalance().subscribe({
      next: (data: IAccountBalance) => {
        this.accountBalance = data.skillCoins;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading account balance:', error);
        this.isLoading = false;
      }
    });
  }
  //#endregion
}