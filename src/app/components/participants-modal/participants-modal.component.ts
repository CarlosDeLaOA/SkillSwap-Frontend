import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface JitsiParticipant {
  id: string;
  displayName: string;
  initials: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

@Component({
  selector: 'app-participants-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content participants-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>
            <i class='bx bx-group'></i>
            Participantes ({{ participants.length }})
          </h2>
          <button class="modal-close" (click)="close()">
            <i class='bx bx-x'></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="participants-list">
            <div 
              *ngFor="let participant of participants" 
              class="participant-item">
              <div class="participant-avatar">
                <span class="initials">{{ participant.initials }}</span>
              </div>
              <div class="participant-info">
                <span class="participant-name">{{ participant.displayName }}</span>
                <div class="participant-status">
                  <span class="status-badge" [class.active]="participant.hasVideo">
                    <i class='bx bx-video'></i>
                  </span>
                  <span class="status-badge" [class.active]="participant.hasAudio">
                    <i class='bx bx-microphone'></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      animation: fadeIn 0.2s ease;
    }

    .participants-modal {
      max-width: 450px;
      max-height: 600px;
      display: flex;
      flex-direction: column;
    }

    .modal-content {
      background: #2c2c2c;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
      padding: 20px 25px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        font-size: 20px;
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;

        i {
          font-size: 24px;
        }
      }
    }

    .modal-close {
      background: transparent;
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: rotate(90deg);
      }
    }

    .modal-body {
      padding: 15px;
      overflow-y: auto;
      max-height: 500px;
    }

    .participants-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .participant-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .participant-avatar {
      .initials {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        color: white;
      }
    }

    .participant-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .participant-name {
      font-size: 15px;
      font-weight: 600;
      color: white;
    }

    .participant-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-badge {
      display: flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 14px;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.5);
      transition: all 0.2s ease;

      &.active {
        background: rgba(76, 175, 80, 0.2);
        color: #4CAF50;
      }

      i {
        font-size: 16px;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class ParticipantsModalComponent {
  @Input() participants: JitsiParticipant[] = [];
  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }
}