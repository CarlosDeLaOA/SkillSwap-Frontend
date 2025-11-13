import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface Testimonial {
  name: string;
  text: string;
}

@Component({
  selector: 'app-landingskillswap',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landingskillswap.component.html',
  styleUrls: ['./landingskillswap.component.scss']
})
export class LandingskillswapComponent implements OnInit {
  
  // Estado del scroll para el navbar
  isScrolled = false;

  // Testimonios
  testimonials: Testimonial[] = [
    {
      name: 'Julio Gómez',
      text: 'SkillSwap cambió completamente mi forma de aprender. Las sesiones en vivo con expertos son increíbles y las notas generadas por IA me ayudan a repasar todo el contenido fácilmente.'
    },
    {
      name: 'Rodrigo Fallas',
      text: 'He aprendido más en 3 meses usando SkillSwap que en años de cursos tradicionales. La comunidad es increíble y los SkillSwappers son verdaderos expertos en sus áreas.'
    },
    {
      name: 'Michelle Vargas',
      text: 'Lo que más me gusta es poder aprender en tiempo real y hacer preguntas directamente a los expertos. Los grupos privados me permiten seguir aprendiendo junto a otros estudiantes motivados.'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Smooth scroll para los enlaces del menú
    this.setupSmoothScroll();
  }

  /**
   * Detecta el scroll para cambiar el estilo del navbar
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isScrolled = scrollPosition > 50;
  }

  /**
   * Configura el smooth scroll para los enlaces internos
   */
  private setupSmoothScroll(): void {
    // Esperar a que el DOM esté listo
    setTimeout(() => {
      const links = document.querySelectorAll('a[href^="#"]');
      
      links.forEach(link => {
        link.addEventListener('click', (e: Event) => {
          e.preventDefault();
          const target = link.getAttribute('href');
          
          if (target) {
            const element = document.querySelector(target);
            if (element) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }
        });
      });
    }, 100);
  }

  /**
   * Navega a la página de registro
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  /**
   * Navega a la página de login
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navega a una sección específica mediante programación
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}