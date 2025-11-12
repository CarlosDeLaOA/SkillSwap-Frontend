import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { CommonModule } from '@angular/common';
import { IUserSkill } from '../../interfaces';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  public profileService = inject(ProfileService);

  ngOnInit(): void {
    this.profileService.getUserProfile();
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getInitials(fullName: string | undefined): string {
    if (!fullName) return 'U';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  getFirstName(): string {
    const fullName = this.profileService.person$().fullName;
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts[0] || '';
  }

  getLastNames(): string {
    const fullName = this.profileService.person$().fullName;
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.slice(1).join(' ') || '';
  }

  getUserSkillsByArea(): { [key: string]: IUserSkill[] } {
    const userSkills = this.profileService.person$().userSkills || [];
    const groupedSkills: { [key: string]: IUserSkill[] } = {};

    userSkills.forEach(userSkill => {
      if (userSkill.active && userSkill.skill?.knowledgeArea) {
        const areaName = userSkill.skill.knowledgeArea.name;
        if (!groupedSkills[areaName]) {
          groupedSkills[areaName] = [];
        }
        groupedSkills[areaName].push(userSkill);
      }
    });

    return groupedSkills;
  }

  getSkillsForArea(areaName: string): IUserSkill[] {
    const userSkills = this.profileService.person$().userSkills || [];
    return userSkills.filter(
      userSkill => 
        userSkill.active && 
        userSkill.skill?.knowledgeArea?.name === areaName
    );
  }

  hasUserSkills(): boolean {
    const userSkills = this.profileService.person$().userSkills || [];
    return userSkills.some(skill => skill.active);
  }
}