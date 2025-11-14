import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IKnowledgeArea } from '../../interfaces';

@Component({
  selector: 'app-filter-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule    
  ],
  templateUrl: './filter-modal.component.html',
  styleUrls: ['./filter-modal.component.scss']
})
export class FilterModalComponent implements OnInit {
  @Input() currentFilters: any;
  @Input() knowledgeAreas: IKnowledgeArea[] = [];
  @Input() availableLanguages: string[] = [];

  languageNames: { [key: string]: string } = {
    'es': 'Español',
    'en': 'Inglés',
    'fr': 'Francés',
    'de': 'Alemán',
    'pt': 'Portugués',
    'it': 'Italiano',
    'ja': 'Japonés',
    'zh': 'Chino',
    'ru': 'Ruso',
    'ar': 'Árabe',
    'ko': 'Coreano'
  };

  selectedCategoryIds: { [key: number]: boolean } = {};
  selectedLanguages: { [key: string]: boolean } = {};

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    console.log('Filter modal initialized with:', {
      currentFilters: this.currentFilters,
      knowledgeAreas: this.knowledgeAreas,
      availableLanguages: this.availableLanguages
    });

    this.knowledgeAreas.forEach(area => {
      this.selectedCategoryIds[area.id] = 
        this.currentFilters?.categoryIds?.includes(area.id) || false;
    });
    
    this.availableLanguages.forEach(langCode => {
      this.selectedLanguages[langCode] = 
        this.currentFilters?.languages?.includes(langCode) || false;
    });
  }

  onFilterChange() {
    console.log('Filter changed', {
      categories: this.selectedCategoryIds,
      languages: this.selectedLanguages
    });
  }

  applyFilters() {
    const filters = {
      categoryIds: Object.keys(this.selectedCategoryIds)
        .filter(key => this.selectedCategoryIds[+key])
        .map(key => +key),
      languages: Object.keys(this.selectedLanguages)
        .filter(key => this.selectedLanguages[key])
    };
    
    console.log('Applying filters:', filters);
    this.activeModal.close(filters);
  }

  clearFilters() {
    this.knowledgeAreas.forEach(area => {
      this.selectedCategoryIds[area.id] = false;
    });
    
    this.availableLanguages.forEach(langCode => {
      this.selectedLanguages[langCode] = false;
    });
    
    console.log('Filters cleared');
  }

  dismiss() {
    this.activeModal.dismiss();
  }

  getSelectedCategoriesCount(): number {
    return Object.values(this.selectedCategoryIds).filter(v => v).length;
  }

  getSelectedLanguagesCount(): number {
    return Object.values(this.selectedLanguages).filter(v => v).length;
  }

  /**
   * Obtiene el nombre legible del idioma a partir de su código
   * Si no hay traducción, devuelve el código en mayúsculas
   */
  getLanguageName(code: string): string {
    return this.languageNames[code] || code.toUpperCase();
  }
}