import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import {IDashboardExportData, IBalanceData, IAttendanceChartData, ILearningHoursData, ISkillsProgressData, IUpcomingSessionData,IReviewData} from './../interfaces';
/**
 * Service to export dashboard data to PDF
 */
@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  // Colores del sistema
  private readonly COLORS = {
    primary: '#504AB7',
    secondary: '#AAE16B',
    background: '#39434B',
    dark: '#141414',
    white: '#FFFFFF'
  };

  constructor() { }

  /**
   * Exporta todo el dashboard a PDF
   */
  async exportDashboard(dashboardData: IDashboardExportData): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // Header
    currentY = this.addHeader(doc, pageWidth);

    // 1. Balance de la cuenta
    currentY = await this.addBalanceSection(doc, dashboardData.balance, currentY, pageWidth);

    // 2. Horas de aprendizaje
    currentY = this.addLearningHoursSection(doc, dashboardData.learningHours, currentY, pageWidth);

    // Verificar si necesitamos nueva página
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    // 3. Gráfico de asistencia/logros (como tabla)
    currentY = this.addAttendanceChartSection(doc, dashboardData.attendanceData, currentY, pageWidth);

    // Verificar si necesitamos nueva página
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }

    // 4. Progreso de habilidades
    currentY = this.addSkillsProgressSection(doc, dashboardData.skillsProgress, currentY, pageWidth);

    // Verificar si necesitamos nueva página
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    // 5. Próximas sesiones
    currentY = this.addUpcomingSessionsSection(doc, dashboardData.upcomingSessions, currentY, pageWidth);

    // Verificar si necesitamos nueva página
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }

    // 6. Credenciales/Reseñas (carousel convertido a tabla)
    currentY = this.addReviewsSection(doc, dashboardData.reviews, currentY, pageWidth);

    // Footer en todas las páginas
    this.addFooter(doc);

    // Descargar PDF
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    doc.save(`SkillTrip_Dashboard_${fecha}.pdf`);
  }

  /**
   * Agrega el header del PDF
   */
  private addHeader(doc: jsPDF, pageWidth: number): number {
    // Título
    doc.setFontSize(28);
    doc.setTextColor(...this.hexToRgb(this.COLORS.dark));
    doc.setFont('helvetica', 'bold');
    doc.text('Mi ', pageWidth / 2 - 20, 15, { align: 'center' });
    
    // SkillTrip en gradiente (simulado con color secundario)
    doc.setTextColor(...this.hexToRgb(this.COLORS.primary));
    doc.text('SkillTrip', pageWidth / 2 + 10, 15, { align: 'center' });

    // Fecha
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // gris
    doc.setFont('helvetica', 'normal');
    const fecha = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Reporte generado: ${fecha}`, pageWidth / 2, 22, { align: 'center' });

    // Línea divisoria
    doc.setDrawColor(...this.hexToRgb(this.COLORS.secondary));
    doc.setLineWidth(0.5);
    doc.line(15, 25, pageWidth - 15, 25);

    return 30;
  }

  /**
   * Agrega sección de balance
   */
  private async addBalanceSection(
    doc: jsPDF, 
    balance: IBalanceData, 
    startY: number, 
    pageWidth: number
  ): Promise<number> {
    // Título de sección
    doc.setFontSize(16);
    doc.setTextColor(...this.hexToRgb(this.COLORS.primary));
    doc.setFont('helvetica', 'bold');
    doc.text('Saldo de la Cuenta', 15, startY);

    startY += 10;

    // Tabla de balance
    autoTable(doc, {
      startY: startY,
      head: [['Concepto', 'Valor']],
      body: [
        ['Saldo Actual', `${balance.skillCoins} SkillCoins`]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: this.hexToRgb(this.COLORS.primary),
        textColor: this.hexToRgb(this.COLORS.white),
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 12,
        textColor: this.hexToRgb(this.COLORS.dark)
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 15, right: 15 }
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Agrega sección de horas de aprendizaje
   */
  private addLearningHoursSection(
    doc: jsPDF, 
    learningHours: ILearningHoursData, 
    startY: number, 
    pageWidth: number
  ): number {
    // Título de sección
    doc.setFontSize(16);
    doc.setTextColor(...this.hexToRgb(this.COLORS.primary));
    doc.setFont('helvetica', 'bold');
    doc.text('Horas de Aprendizaje', 15, startY);

    startY += 10;

    // Tabla de horas
    autoTable(doc, {
      startY: startY,
      head: [['Horas', 'Descripción']],
      body: [
        [
          `${learningHours.hours} horas`,
          learningHours.description
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: this.hexToRgb(this.COLORS.primary),
        textColor: this.hexToRgb(this.COLORS.white),
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 12,
        textColor: this.hexToRgb(this.COLORS.dark)
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Agrega sección de gráfico de asistencia
   */
  private addAttendanceChartSection(
    doc: jsPDF, 
    attendanceData: IAttendanceChartData, 
    startY: number, 
    pageWidth: number
  ): number {
    // Título de sección
    doc.setFontSize(16);
    doc.setTextColor(...this.hexToRgb(this.COLORS.primary));
    doc.setFont('helvetica', 'bold');
    doc.text(attendanceData.title, 15, startY);

    startY += 10;

    // Preparar datos para la tabla
    const tableBody = attendanceData.monthlyData.map(data => [
      data.month,
      data.value1.toString(),
      data.value2.toString()
    ]);

    // Tabla de datos mensuales
    autoTable(doc, {
      startY: startY,
      head: [[
        'Mes',
        attendanceData.label1,
        attendanceData.label2
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: this.hexToRgb(this.COLORS.primary),
        textColor: this.hexToRgb(this.COLORS.white),
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 11,
        textColor: this.hexToRgb(this.COLORS.dark),
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 15, right: 15 }
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Agrega sección de progreso de habilidades
   */
  private addSkillsProgressSection(
    doc: jsPDF, 
    skillsData: ISkillsProgressData, 
    startY: number, 
    pageWidth: number
  ): number {
    // Título de sección
    doc.setFontSize(16);
    doc.setTextColor(...this.hexToRgb(this.COLORS.primary));
    doc.setFont('helvetica', 'bold');
    doc.text('Progreso de Habilidades', 15, startY);

    startY += 10;

    if (!skillsData.selectedSkill) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No hay datos de habilidades disponibles', 15, startY);
      return startY + 10;
    }

    // Tabla de progreso
    autoTable(doc, {
      startY: startY,
      head: [['Habilidad', 'Completado', 'Pendiente', 'Porcentaje']],
      body: [[
        skillsData.selectedSkill.skillName,
        `${skillsData.selectedSkill.completed} sesiones`,
        `${skillsData.selectedSkill.pending} sesiones`,
        `${skillsData.selectedSkill.percentage}%`
      ]],
      theme: 'grid',
      headStyles: {
        fillColor: this.hexToRgb(this.COLORS.primary),
        textColor: this.hexToRgb(this.COLORS.white),
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 11,
        textColor: this.hexToRgb(this.COLORS.dark),
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Agrega sección de próximas sesiones
   */
  private addUpcomingSessionsSection(
    doc: jsPDF, 
    sessions: IUpcomingSessionData[], 
    startY: number, 
    pageWidth: number
  ): number {
    // Título de sección
    doc.setFontSize(16);
    doc.setTextColor(...this.hexToRgb(this.COLORS.primary));
    doc.setFont('helvetica', 'bold');
    doc.text('Próximas Sesiones', 15, startY);

    startY += 10;

    if (sessions.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No hay sesiones próximas', 15, startY);
      return startY + 10;
    }

    // Preparar datos para la tabla
    const tableBody = sessions.map(session => [
      session.title,
      session.datetime,
      session.duration
    ]);

    // Tabla de sesiones
    autoTable(doc, {
      startY: startY,
      head: [['Título', 'Fecha y Hora', 'Duración']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: this.hexToRgb(this.COLORS.primary),
        textColor: this.hexToRgb(this.COLORS.white),
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: this.hexToRgb(this.COLORS.dark)
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 50 },
        2: { halign: 'center', cellWidth: 30 }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 15, right: 15 }
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Agrega sección de reseñas/credenciales
   */
  private addReviewsSection(
    doc: jsPDF, 
    reviews: IReviewData, 
    startY: number, 
    pageWidth: number
  ): number {
    // Título de sección
    doc.setFontSize(16);
    doc.setTextColor(...this.hexToRgb(this.COLORS.primary));
    doc.setFont('helvetica', 'bold');
    doc.text(reviews.title, 15, startY);

    startY += 10;

    if (reviews.items.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No hay datos disponibles', 15, startY);
      return startY + 10;
    }

    let tableBody: any[] = [];
    let headers: string[] = [];

    if (reviews.type === 'FEEDBACK') {
      headers = ['Sesión', 'Comentario', 'Calificación'];
      tableBody = reviews.items.map((item: any) => [
        item.sessionTitle || 'N/A',
        item.comment || 'Sin comentario',
        `${item.rating || 0}/5 ⭐`
      ]);
    } else {
      headers = ['Habilidad', 'Porcentaje', 'Fecha'];
      tableBody = reviews.items.map((item: any) => [
        item.skillName || 'N/A',
        `${item.percentageAchieved || 0}%`,
        item.obtainedDate || 'N/A'
      ]);
    }

    // Tabla de reseñas/credenciales
    autoTable(doc, {
      startY: startY,
      head: [headers],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: this.hexToRgb(this.COLORS.primary),
        textColor: this.hexToRgb(this.COLORS.white),
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: this.hexToRgb(this.COLORS.dark)
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 'auto' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 15, right: 15 }
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Agrega footer a todas las páginas
   */
  private addFooter(doc: jsPDF): void {
    const pageCount = (doc as any).getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Línea superior del footer
      doc.setDrawColor(...this.hexToRgb(this.COLORS.secondary));
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      
      // Texto del footer
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'SkillTrip Dashboard Report', 
        pageWidth / 2, 
        pageHeight - 10, 
        { align: 'center' }
      );
      
      // Número de página
      doc.text(
        `Página ${i} de ${pageCount}`, 
        pageWidth - 15, 
        pageHeight - 10, 
        { align: 'right' }
      );
    }
  }

  /**
   * Convierte color hexadecimal a RGB
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ];
  }
}