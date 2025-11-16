import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { IDashboardExportData } from '../interfaces';

/**
 * Service to export dashboard data to Excel with professional styling using ExcelJS
 */
@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  // Colores del sistema
  private readonly COLORS = {
    primary: '504AB7',      // Morado
    secondary: 'AAE16B',    // Verde
    background: '39434B',   // Gris oscuro
    dark: '141414',         // Negro
    white: 'FFFFFF',        // Blanco
    lightGray: 'F5F5F5'     // Gris claro para filas alternas
  };

  constructor() { }

  /**
   * Exporta el dashboard a Excel con formato profesional usando ExcelJS
   */
  async exportToExcel(dashboardData: IDashboardExportData): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Propiedades del documento
    workbook.creator = 'SkillTrip';
    workbook.created = new Date();

    // Crear hoja principal
    const mainSheet = workbook.addWorksheet('Dashboard', {
      views: [{ showGridLines: false }]
    });

    await this.createMainSheet(mainSheet, dashboardData);

    // Crear hoja de próximas sesiones si hay datos
    if (dashboardData.upcomingSessions.length > 0) {
      const sessionsSheet = workbook.addWorksheet('Próximas Sesiones', {
        views: [{ showGridLines: false }]
      });
      this.createSessionsSheet(sessionsSheet, dashboardData.upcomingSessions);
    }

    // Crear hoja de credenciales/reseñas si hay datos
    if (dashboardData.reviews.items.length > 0) {
      const reviewsSheet = workbook.addWorksheet(
        dashboardData.reviews.type === 'FEEDBACK' ? 'Mis Reseñas' : 'Mis Credenciales',
        { views: [{ showGridLines: false }] }
      );
      this.createReviewsSheet(reviewsSheet, dashboardData.reviews);
    }

    // Generar y descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    this.downloadFile(buffer, `SkillTrip_Dashboard_${fecha}.xlsx`);
  }

  /**
   * Crea la hoja principal del dashboard
   */
  private async createMainSheet(sheet: ExcelJS.Worksheet, data: IDashboardExportData): Promise<void> {
    let currentRow = 1;

    // ============ HEADER DEL REPORTE ============
    const titleRow = sheet.getRow(currentRow++);
    titleRow.getCell(1).value = 'MI SKILLTRIP - DASHBOARD';
    titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: this.COLORS.primary } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.mergeCells(currentRow - 1, 1, currentRow - 1, 4);
    titleRow.height = 30;

    const dateRow = sheet.getRow(currentRow++);
    dateRow.getCell(1).value = `Reporte generado: ${new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })}`;
    dateRow.getCell(1).font = { size: 10, italic: true };
    dateRow.getCell(1).alignment = { horizontal: 'center' };
    sheet.mergeCells(currentRow - 1, 1, currentRow - 1, 4);

    currentRow++; // Línea vacía

    // ============ SALDO DE LA CUENTA ============
    currentRow = this.addSectionHeader(sheet, currentRow, 'SALDO DE LA CUENTA');
    currentRow = this.addTable(sheet, currentRow, 
      ['Concepto', 'Valor'],
      [['Saldo Actual', `${data.balance.skillCoins} SkillCoins`]]
    );
    currentRow++; // Línea vacía

    // ============ HORAS DE APRENDIZAJE ============
    currentRow = this.addSectionHeader(sheet, currentRow, 'HORAS DE APRENDIZAJE');
    currentRow = this.addTable(sheet, currentRow,
      ['Horas', 'Descripción'],
      [[`${data.learningHours.hours} horas`, data.learningHours.description]]
    );
    currentRow++; // Línea vacía

    // ============ LOGROS OBTENIDOS / ASISTENTES ============
    currentRow = this.addSectionHeader(sheet, currentRow, data.attendanceData.title.toUpperCase());
    const attendanceData = data.attendanceData.monthlyData.map(m => 
      [m.month, m.value1, m.value2]
    );
    currentRow = this.addTable(sheet, currentRow,
      ['Mes', data.attendanceData.label1, data.attendanceData.label2],
      attendanceData
    );
    currentRow++; // Línea vacía

    // ============ PROGRESO DE HABILIDADES ============
    currentRow = this.addSectionHeader(sheet, currentRow, 'PROGRESO DE HABILIDADES');
    if (data.skillsProgress.selectedSkill) {
      const skill = data.skillsProgress.selectedSkill;
      currentRow = this.addTable(sheet, currentRow,
        ['Habilidad', 'Completado', 'Pendiente', 'Porcentaje'],
        [[skill.skillName, `${skill.completed} sesiones`, `${skill.pending} sesiones`, `${skill.percentage}%`]]
      );
    } else {
      const row = sheet.getRow(currentRow++);
      row.getCell(1).value = 'No hay datos de habilidades disponibles';
      row.getCell(1).font = { italic: true, color: { argb: '666666' } };
    }
    currentRow++; // Línea vacía

    // ============ PRÓXIMAS SESIONES ============
    currentRow = this.addSectionHeader(sheet, currentRow, 'PRÓXIMAS SESIONES');
    if (data.upcomingSessions.length > 0) {
      const sessionsToShow = data.upcomingSessions.slice(0, 5).map(s => 
        [s.title, s.datetime, s.duration]
      );
      currentRow = this.addTable(sheet, currentRow,
        ['Título', 'Fecha y Hora', 'Duración'],
        sessionsToShow
      );
      
      if (data.upcomingSessions.length > 5) {
        const row = sheet.getRow(currentRow++);
        row.getCell(1).value = `Ver hoja "Próximas Sesiones" para todas las ${data.upcomingSessions.length} sesiones`;
        row.getCell(1).font = { italic: true };
        sheet.mergeCells(currentRow - 1, 1, currentRow - 1, 3);
      }
    } else {
      const row = sheet.getRow(currentRow++);
      row.getCell(1).value = 'No hay sesiones próximas';
      row.getCell(1).font = { italic: true, color: { argb: '666666' } };
    }

    // Ajustar ancho de columnas
    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 30;
    sheet.getColumn(4).width = 15;
  }

  /**
   * Crea hoja de próximas sesiones
   */
  private createSessionsSheet(sheet: ExcelJS.Worksheet, sessions: any[]): void {
    let currentRow = 1;

    // Header
    const titleRow = sheet.getRow(currentRow++);
    titleRow.getCell(1).value = 'PRÓXIMAS SESIONES';
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: this.COLORS.white } };
    titleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.COLORS.primary }
    };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.mergeCells(currentRow - 1, 1, currentRow - 1, 3);
    titleRow.height = 30;

    currentRow++; // Línea vacía

    // Tabla
    const sessionData = sessions.map(s => [s.title, s.datetime, s.duration]);
    this.addTable(sheet, currentRow, ['Título', 'Fecha y Hora', 'Duración'], sessionData);

    // Ajustar columnas
    sheet.getColumn(1).width = 40;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 15;
  }

  /**
   * Crea hoja de reseñas/credenciales
   */
  private createReviewsSheet(sheet: ExcelJS.Worksheet, reviews: any): void {
    let currentRow = 1;

    // Header
    const titleRow = sheet.getRow(currentRow++);
    titleRow.getCell(1).value = reviews.title.toUpperCase();
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: this.COLORS.white } };
    titleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.COLORS.primary }
    };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.mergeCells(currentRow - 1, 1, currentRow - 1, 3);
    titleRow.height = 30;

    currentRow++; // Línea vacía

    // Tabla
    let headers: string[];
    let data: any[][];

    if (reviews.type === 'FEEDBACK') {
      headers = ['Sesión', 'Comentario', 'Calificación'];
      data = reviews.items.map((item: any) => [
        item.sessionTitle || 'N/A',
        item.comment || 'Sin comentario',
        `${item.rating || 0}/5`
      ]);
      sheet.getColumn(1).width = 30;
      sheet.getColumn(2).width = 60;
      sheet.getColumn(3).width = 15;
    } else {
      headers = ['Habilidad', 'Porcentaje Logrado', 'Fecha Obtenida'];
      data = reviews.items.map((item: any) => [
        item.skillName || 'N/A',
        `${item.percentageAchieved || 0}%`,
        item.obtainedDate || 'N/A'
      ]);
      sheet.getColumn(1).width = 30;
      sheet.getColumn(2).width = 20;
      sheet.getColumn(3).width = 20;
    }

    this.addTable(sheet, currentRow, headers, data);
  }

  /**
   * Agrega un header de sección
   */
  private addSectionHeader(sheet: ExcelJS.Worksheet, rowIndex: number, title: string): number {
    const row = sheet.getRow(rowIndex);
    row.getCell(1).value = title;
    row.getCell(1).font = { bold: true, size: 14, color: { argb: this.COLORS.white } };
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.COLORS.primary }
    };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(1).border = this.getBorder();
    sheet.mergeCells(rowIndex, 1, rowIndex, 4);
    row.height = 25;
    
    return rowIndex + 1;
  }

  /**
   * Agrega una tabla con headers y datos
   */
  private addTable(
    sheet: ExcelJS.Worksheet, 
    startRow: number, 
    headers: string[], 
    data: any[][]
  ): number {
    // Headers
    const headerRow = sheet.getRow(startRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: this.COLORS.white } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.COLORS.primary }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = this.getBorder();
    });
    headerRow.height = 20;

    // Datos
    let currentRow = startRow + 1;
    data.forEach((rowData, rowIndex) => {
      const row = sheet.getRow(currentRow);
      rowData.forEach((cellValue, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = cellValue;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = this.getBorder();
        
        // Filas alternas
        if (rowIndex % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: this.COLORS.lightGray }
          };
        }
        
        // Primera columna en negrita
        if (colIndex === 0) {
          cell.font = { bold: true };
        }
      });
      row.height = 18;
      currentRow++;
    });

    return currentRow;
  }

  /**
   * Obtiene el estilo de borde para las celdas
   */
  private getBorder(): Partial<ExcelJS.Borders> {
    const borderStyle: Partial<ExcelJS.Border> = {
      style: 'thin',
      color: { argb: this.COLORS.background }
    };
    
    return {
      top: borderStyle,
      left: borderStyle,
      bottom: borderStyle,
      right: borderStyle
    };
  }

  /**
   * Descarga el archivo Excel
   */
  private downloadFile(buffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}