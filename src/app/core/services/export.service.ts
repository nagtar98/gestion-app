import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Opciones para la exportación de tablas a formato PDF.
 */
export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  dataKeys: string[];
  dataset: Record<string, any>[];
  filename?: string;
  author?: string;
  summary?: {
    totalUsuarios: number;
    usuariosActivos: number;
    totalDepartamentos: number;
    tasaActividad: number;
  };
}

/**
 * Servicio encargado de la generación y descarga de informes en PDF y CSV.
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() {}

  /**
   * Genera y descarga un documento PDF con los datos y métricas indicados.
   */
  public exportTableToPdf(options: PdfExportOptions): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Franja superior con estilo moderno
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Acento azul
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 27, pageWidth, 2, 'F');

    // Subtítulo superior
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(147, 197, 253);
    doc.text('PANEL DE GESTIÓN DE PERSONAL', 14, 11);

    // Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text(options.title || 'Listado de Usuarios', 14, 20);

    // Tarjeta con información del informe
    let currentY = 36;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 3, 3, 'FD');

    // Información del autor y fecha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha de emisión:`, 18, currentY + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formattedDate, 50, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Generado por:`, 18, currentY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(options.author || 'Administrador', 50, currentY + 14);

    // Origen de datos
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Base de datos:`, 120, currentY + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('Supabase Cloud', 150, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Total registros:`, 120, currentY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${options.dataset.length} usuarios`, 150, currentY + 14);

    currentY += 28;

    // 3. Mini-bloque de KPIs si se proporciona resumen
    if (options.summary) {
      const kpiWidth = (pageWidth - 28 - 9) / 4;
      const kpis = [
        { label: 'TOTAL PERSONAL', val: `${options.summary.totalUsuarios}`, color: [37, 99, 235] },
        { label: 'ACTIVOS', val: `${options.summary.usuariosActivos}`, color: [16, 185, 129] },
        { label: 'DEPARTAMENTOS', val: `${options.summary.totalDepartamentos}`, color: [245, 158, 11] },
        { label: 'TASA ACTIVIDAD', val: `${options.summary.tasaActividad}%`, color: [99, 102, 241] }
      ];

      kpis.forEach((kpi, idx) => {
        const xPos = 14 + idx * (kpiWidth + 3);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(xPos, currentY, kpiWidth, 14, 2, 2, 'FD');

        // Borde superior de color
        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.roundedRect(xPos, currentY, kpiWidth, 1.5, 1, 1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.val, xPos + 4, currentY + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, xPos + 4, currentY + 12);
      });

      currentY += 18;
    }

    if (options.subtitle) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(options.subtitle, 14, currentY);
      currentY += 4;
    }

    // 4. Preparación de datos tabulares
    const bodyRows = options.dataset.map(row => {
      return options.dataKeys.map(key => {
        const val = row[key];
        return val !== null && val !== undefined ? String(val) : '';
      });
    });

    // 5. Renderizado de tabla con AutoTable y Estilos Ejecutivos
    autoTable(doc, {
      startY: currentY,
      head: [options.headers],
      body: bodyRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // Navy Corporativo Slate (#1e293b)
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
        cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Suave contraste (#f8fafc)
      },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.1,
      styles: {
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        overflow: 'linebreak'
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        // Estilizado dinámico condicional de celdas clave (Estado y Rol)
        if (data.section === 'body') {
          const cellVal = String(data.cell.raw).trim();
          if (cellVal === 'Activo') {
            data.cell.styles.textColor = [16, 185, 129]; // Verde éxito
            data.cell.styles.fontStyle = 'bold';
          } else if (cellVal === 'Inactivo') {
            data.cell.styles.textColor = [239, 68, 68]; // Rojo suave
            data.cell.styles.fontStyle = 'bold';
          } else if (cellVal === 'Administrador') {
            data.cell.styles.textColor = [37, 99, 235]; // Azul primario
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawPage: (data) => {
        // Pie de página con numeración
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

        const pageCount = doc.getNumberOfPages();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);

        doc.text(
          'Informe generado por el sistema de gestión de personal',
          14,
          pageHeight - 7
        );

        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageWidth - 30,
          pageHeight - 7
        );
      }
    });

    const safeFilename = (options.filename || 'informe_usuarios').replace(/\.pdf$/i, '') + '.pdf';
    doc.save(safeFilename);
  }

  /**
   * Exporta los datos a formato CSV compatible con Excel.
   */
  public exportTableToCsv(
    headers: string[],
    dataKeys: string[],
    dataset: Record<string, any>[],
    filename: string = 'informe_usuarios',
    author: string = 'Administrador'
  ): void {
    const sanitizeCell = (value: any): string => {
      if (value === null || value === undefined) {
        return '""';
      }
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const now = new Date();
    const formattedTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const metadataHeader = [
      '# INFORME DE USUARIOS',
      `# Fecha: ${formattedTimestamp}`,
      `# Generado por: ${author}`,
      `# Total registros: ${dataset.length}`
    ].join('\r\n');

    const csvHeaderLine = headers.map(h => sanitizeCell(h)).join(';');
    const csvRows = dataset.map(row => {
      return dataKeys.map(key => sanitizeCell(row[key])).join(';');
    });

    const csvContent = [metadataHeader, csvHeaderLine, ...csvRows].join('\r\n');

    // BOM UTF-8 para compatibilidad con caracteres especiales
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

    const safeFilename = filename.replace(/\.csv$/i, '') + '.csv';
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', safeFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
