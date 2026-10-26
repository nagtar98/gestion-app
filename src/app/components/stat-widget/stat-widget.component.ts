import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular';

// Registro global de controladores, escalas y elementos de Chart.js
Chart.register(...registerables);

/**
 * @fileoverview Widget estadístico agnóstico y reutilizable basado en Chart.js (FASE 2 / RA 3).
 * Soporta tipos de gráfico visuales no basados en barras ('line', 'doughnut', 'pie', 'polarArea').
 * Gestiona minuciosamente el ciclo de vida (ngOnDestroy) para prevenir fugas de memoria (memory leaks)
 * y actualiza reactivamente la vista mediante ngOnChanges y ChangeDetectionStrategy.OnPush.
 * @module Components/StatWidgetComponent
 */
@Component({
  selector: 'app-stat-widget',
  templateUrl: './stat-widget.component.html',
  styleUrls: ['./stat-widget.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent]
})
export class StatWidgetComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Referencia nativa al elemento canvas del DOM */
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  /** Título representativo del widget estadístico */
  @Input() title: string = 'Gráfico';

  /** Etiquetas de las categorías en el eje o segmentos */
  @Input() labels: string[] = [];

  /** Valores numéricos correspondientes a cada etiqueta */
  @Input() data: number[] = [];

  /** Tipo de gráfico a renderizar (evita barras conforme a especificación del docente) */
  @Input() type: 'line' | 'doughnut' | 'pie' | 'polarArea' = 'line';

  /** Instancia activa de Chart.js gestionada internamente */
  private chart: Chart | null = null;

  constructor() {}

  /**
   * Ciclo de vida posterior a la renderización del template. Inicializa el canvas.
   */
  ngAfterViewInit(): void {
    this.createChart();
  }

  /**
   * Reacciona a modificaciones en las propiedades de entrada @Input para redibujar el gráfico.
   * @param changes Cambios detectados por Angular en inputs.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['labels'] || changes['type']) && this.chartCanvas) {
      this.createChart();
    }
  }

  /**
   * Destrucción explícita de la instancia de Chart.js en ngOnDestroy.
   * Evita memory leaks desvinculando listeners de eventos de ventana y referencias al DOM.
   */
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Construye o refresca la instancia de Chart.js sobre el elemento canvas nativo.
   */
  public createChart(): void {
    if (!this.chartCanvas?.nativeElement) {
      return;
    }

    // Destrucción previa si ya existía una instancia activa
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    // Paleta de colores armónica con contraste WCAG AA
    const backgroundColors = [
      'rgba(41, 128, 185, 0.75)',
      'rgba(39, 174, 96, 0.75)',
      'rgba(243, 156, 18, 0.75)',
      'rgba(142, 68, 173, 0.75)',
      'rgba(231, 76, 60, 0.75)'
    ];

    const borderColors = [
      'rgba(41, 128, 185, 1)',
      'rgba(39, 174, 96, 1)',
      'rgba(243, 156, 18, 1)',
      'rgba(142, 68, 173, 1)',
      'rgba(231, 76, 60, 1)'
    ];

    const isLine = this.type === 'line';

    this.chart = new Chart(ctx, {
      type: this.type as any,
      data: {
        labels: this.labels,
        datasets: [
          {
            label: this.title,
            data: this.data,
            backgroundColor: isLine ? 'rgba(41, 128, 185, 0.18)' : backgroundColors.slice(0, this.data.length),
            borderColor: isLine ? '#2563eb' : borderColors.slice(0, this.data.length),
            borderWidth: isLine ? 3 : 1.5,
            fill: isLine,
            tension: 0.35, // Curvatura suave y estética para gráfico de líneas
            pointBackgroundColor: '#2563eb',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: isLine ? 5 : 3,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.type === 'pie' || this.type === 'doughnut' || this.type === 'polarArea',
            position: 'bottom',
            labels: {
              boxWidth: 14,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            enabled: true
          }
        },
        scales: isLine ? {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        } : undefined
      }
    });
  }

  /**
   * Genera una descripción accesible en texto plano para lectores de pantalla.
   */
  public get accessibleDescription(): string {
    if (!this.labels || this.labels.length === 0) {
      return `Gráfico de ${this.title} sin datos disponibles.`;
    }
    const details = this.labels.map((l, i) => `${l}: ${this.data[i] || 0}`).join(', ');
    return `Gráfico ${this.type} de ${this.title}. Datos detallados: ${details}.`;
  }
}