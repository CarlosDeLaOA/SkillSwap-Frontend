import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

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

  categories = ['Tecnología', 'Deportes', 'Cocina', 'Arte', 'Idiomas', 'Soft Skills'];
  languages = ['Español', 'Inglés', 'Francés', 'Alemán', 'Portugués'];

  selectedCategories: { [key: string]: boolean } = {};
  selectedLanguages: { [key: string]: boolean } = {};

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    // Inicializar con filtros actuales
    this.categories.forEach(cat => {
      this.selectedCategories[cat] = this.currentFilters?.categories?.includes(cat) || false;
    });
    
    this.languages.forEach(lang => {
      this.selectedLanguages[lang] = this.currentFilters?.languages?.includes(lang) || false;
    });
  }

  onFilterChange() {
    // Opcional: lógica adicional cuando cambian los filtros
  }

  applyFilters() {
    const filters = {
      categories: Object.keys(this.selectedCategories).filter(key => this.selectedCategories[key]),
      languages: Object.keys(this.selectedLanguages).filter(key => this.selectedLanguages[key])
    };
    
    this.activeModal.close(filters);
  }

  clearFilters() {
    this.categories.forEach(cat => this.selectedCategories[cat] = false);
    this.languages.forEach(lang => this.selectedLanguages[lang] = false);
  }

  dismiss() {
    this.activeModal.dismiss();
  }
}