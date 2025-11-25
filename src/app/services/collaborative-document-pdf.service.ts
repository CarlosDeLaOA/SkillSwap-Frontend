import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

export interface DocumentPdfData {
  sessionId: number;
  content: any; // Delta de Quill
  generatedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CollaborativeDocumentPdfService {

  // Colores del sistema (mismos que tu dashboard)
  private readonly COLORS = {
    primary: '#504AB7',
    secondary: '#AAE16B',
    background: '#39434B',
    dark: '#141414',
    white: '#FFFFFF'
  };

  constructor() { }

  /**
   * Exporta el documento colaborativo a PDF
   */
  async exportCollaborativeDocument(data: DocumentPdfData): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // ========== HEADER ==========
    currentY = this.addHeader(doc, data.sessionId, pageWidth, currentY);

    // ========== CONTENIDO ==========
    currentY = this.addContent(doc, data.content, margin, maxWidth, pageHeight, currentY);

    // ========== FOOTER ==========
    this.addFooter(doc, data.generatedBy);

    // ========== DESCARGA ==========
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    doc.save(`SkillTrip_SessionNotes_${data.sessionId}_${fecha}.pdf`);
  }

  /**
   * Agrega el header del PDF
   */
  private addHeader(doc: jsPDF, sessionId: number, pageWidth: number, startY: number): number {
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(...this.hexToRgb(this.COLORS.primary));
    doc.setFont('helvetica', 'bold');
    doc.text('Notas de Sesión Colaborativa', 20, startY);
    startY += 7;

    // Subtítulo con ID de sesión
    doc.setFontSize(12);
    doc.setTextColor(...this.hexToRgb(this.COLORS.dark));
    doc.setFont('helvetica', 'normal');
    doc.text(`Sesión #${sessionId}`, 20, startY);
    startY += 7;

    // Fecha
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const fecha = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generado: ${fecha}`, 20, startY);
    startY += 3;

    // Línea divisoria
    doc.setDrawColor(...this.hexToRgb(this.COLORS.secondary));
    doc.setLineWidth(0.5);
    doc.line(20, startY, pageWidth - 20, startY);
    startY += 10;

    return startY;
  }

  /**
   * Agrega el contenido del documento
   */
  private addContent(
    doc: jsPDF, 
    delta: any, 
    margin: number, 
    maxWidth: number, 
    pageHeight: number,
    startY: number
  ): number {
    let currentY = startY;

    if (!delta || !delta.ops || delta.ops.length === 0) {
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('(Documento vacío)', margin, currentY);
      return currentY + 10;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // Procesa cada operación del delta
    for (const op of delta.ops) {
      // Verifica si necesitamos nueva página
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }

      let text = op.insert;
      
      // Si es salto de línea
      if (text === '\n') {
        currentY += 6;
        continue;
      }

      // Aplica formato según atributos
      if (op.attributes) {
        // Headers
        if (op.attributes.header === 1) {
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...this.hexToRgb(this.COLORS.primary));
        } else if (op.attributes.header === 2) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...this.hexToRgb(this.COLORS.dark));
        } 
        // Bold
        else if (op.attributes.bold && op.attributes.italic) {
          doc.setFont('helvetica', 'bolditalic');
        } else if (op.attributes.bold) {
          doc.setFont('helvetica', 'bold');
        } 
        // Italic
        else if (op.attributes.italic) {
          doc.setFont('helvetica', 'italic');
        }
        // Underline (simulado con color diferente)
        else if (op.attributes.underline) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 200); // Azul para subrayado
        }
        // Color de texto
        if (op.attributes.color) {
          const rgb = this.hexToRgb(op.attributes.color);
          doc.setTextColor(...rgb);
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
      }

      // Divide texto en líneas que caben en la página
      const lines = doc.splitTextToSize(text, maxWidth);
      
      for (const line of lines) {
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = margin;
        }
        doc.text(line, margin, currentY);
        currentY += 6;
      }

      // Resetea formato para la próxima operación
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
    }

    return currentY;
  }

  /**
   * Agrega footer a todas las páginas
   */
  private addFooter(doc: jsPDF, generatedBy?: string): void {
    const pageCount = (doc as any).getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Línea superior del footer
      doc.setDrawColor(...this.hexToRgb(this.COLORS.secondary));
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
      
      // Texto del footer
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      
      let footerText = 'SkillTrip - Documento Colaborativo';
      if (generatedBy) {
        footerText += ` | Generado por: ${generatedBy}`;
      }
      
      doc.text(
        footerText, 
        pageWidth / 2, 
        pageHeight - 10, 
        { align: 'center' }
      );
      
      // Número de página
      doc.text(
        `Página ${i} de ${pageCount}`, 
        pageWidth - 20, 
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