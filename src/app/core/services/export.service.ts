import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Parámetros para la exportación de documentos tabulados en formato PDF.
 */
export interface PdfExportOptions {
  /** Título principal del informe */
  title: string;
  /** Subtítulo explicativo o contexto del reporte */
  subtitle?: string;
  /** Nombres de las columnas de cabecera a desplegar */
  headers: string[];
  /** Claves de las propiedades del objeto a extraer */
  dataKeys: string[];
  /** Colección de datos tabulares */
  dataset: Record<string, any>[];
  /** Nombre del archivo resultante (sin extensión obligatoria) */
  filename?: string;
  /** Metadatos del emisor o auditor */
  author?: string;
}

/**
 * @fileoverview Servicio especializado en la generación y exportación de informes tabulados.
 * Proporciona salidas conformes a normativas estándar en PDF estilizado y CSV (RFC 4180 con BOM UTF-8).
 * @module Core/Services/ExportService
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() {}

  /**
   * Genera y descarga un documento PDF con maquetación profesional y tabla estilizada.
   * Utiliza la librería jspdf junto con el plugin jspdf-autotable.
   *
   * @param options Configuración de exportación con títulos, columnas y dataset.
   */
  public exportTableToPdf(options: PdfExportOptions): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 1. Cabecera corporativa y metadatos
    doc.setFillColor(41, 128, 185); // Azul corporativo accesible
    doc.rect(0, 0, 210, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(options.title || 'Informe Ejecutivo de Gestión', 14, 15);

    // 2. Bloque de metadatos del reporte
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Fecha de emisión: ${formattedDate}`, 14, 32);
    if (options.author) {
      doc.text(`Generado por: ${options.author}`, 14, 37);
    }
    if (options.subtitle) {
      doc.setFont('helvetica', 'italic');
      doc.text(options.subtitle, 14, 42);
    }

    // 3. Preparación de la matriz de datos para la tabla
    const bodyRows = options.dataset.map(row => {
      return options.dataKeys.map(key => {
        const val = row[key];
        return val !== null && val !== undefined ? String(val) : '';
      });
    });

    // 4. Inserción de tabla con autoTable y estilos acordes a accesibilidad visual
    autoTable(doc, {
      startY: options.subtitle ? 46 : 41,
      head: [options.headers],
      body: bodyRows,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [40, 40, 40]
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Pie de página con numeración
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount} - Sistema de Gestión Multiplataforma`,
          14,
          doc.internal.pageSize.height - 10
        );
      }
    });

    // 5. Descarga del artefacto PDF generado
    const safeFilename = (options.filename || 'informe_gestion').replace(/\.pdf$/i, '') + '.pdf';
    doc.save(safeFilename);
  }

  /**
   * Exporta un conjunto de datos a formato CSV estándar compatible con hojas de cálculo (Excel, Calc).
   * Incorpora el Byte Order Mark (BOM UTF-8) para garantizar la compatibilidad con tildes y caracteres especiales.
   *
   * @param headers Títulos legibles de las columnas.
   * @param dataKeys Claves de los atributos del dataset correspondientes.
   * @param dataset Colección de datos a transformar.
   * @param filename Nombre del fichero a generar (sin extensión).
   */
  public exportTableToCsv(
    headers: string[],
    dataKeys: string[],
    dataset: Record<string, any>[],
    filename: string = 'informe_datos'
  ): void {
    // 1. Sanitizador de celdas para cumplir con RFC 4180
    const sanitizeCell = (value: any): string => {
      if (value === null || value === undefined) {
        return '""';
      }
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    // 2. Construcción de cabeceras y filas delimitadas por comas
    const csvHeaderLine = headers.map(h => sanitizeCell(h)).join(';');
    const csvRows = dataset.map(row => {
      return dataKeys.map(key => sanitizeCell(row[key])).join(';');
    });

    const csvContent = [csvHeaderLine, ...csvRows].join('\r\n');

    // 3. Incorporación del BOM (\uFEFF) para forzar lectura UTF-8 en clientes como Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 4. Disparo programático de la descarga en el navegador
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
