import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

import { Api } from "../../../Services/apiService";
import { PayPadResponse } from "../../../Interfaces/locations";
import { TransactionResponse, Transaction } from "../../../Interfaces/transactions";
import { PayPad } from "../../../Interfaces/charts";

Chart.register(...registerables);

@Component({
  selector: "app-charts",
  templateUrl: "./charts.html",
  imports: [CommonModule, FormsModule],
  styleUrl:'../../../output.css'
})
export class Charts implements OnInit {
  @ViewChild("payChart") payChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("withdrawChart") withdrawChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("transactionChart") transactionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("donutChart") donutChartRef!: ElementRef<HTMLCanvasElement>;

  private payChart?: Chart;
  private withdrawChart?: Chart;
  private transactionChart?: Chart;
  private donutChart?: Chart;

  _activeOptionButtonPay: "1m" | "6m" | "1y" | "all" = "all";
  _activeOptionButtonWithdraw: "1m" | "6m" | "1y" | "all" = "all";
  _activeOptionButtonTransaction: "1m" | "6m" | "1y" | "all" = "all";
  _comparisonRange: "1m" | "6m" | "1y" | "all" = "all";

  _paypads: PayPad[] = [];
  _transactions: Transaction[] = [];

  _chartNumbersPays: { x: number; y: number }[] = [];
  _chartNumbersWithdrawals: { x: number; y: number }[] = [];
  _chartNumbersTransactions: { x: number; y: number }[] = [];

  selectedPaypadId: string = "";
  _donutTxTotal = 0;
  _donutCompareSeries = [0, 0];

  showEmptyState = true; // Mostrar estado vacío al inicio

  constructor(private _api: Api, private _router: Router) {}

  ngOnInit(): void {
    const _user = localStorage.getItem("User");
    if (!_user) {
      this.Exit();
      return;
    }
    this.GetAllPaypads();
  }

  GetAllPaypads() {
    this._api.GetAllPaypads().subscribe({
      next: (res: PayPadResponse) => {
        if (res.statusCode === 200 && res.response) {
          this._paypads = res.response;
        }
      },
      error: (err) => console.error(err)
    });
  }

  GetAllTransaction() {
    this._api.GetAllTransactions().subscribe({
      next: (res: TransactionResponse) => {
        if (res.statusCode === 200 && res.response) {
          this._transactions = res.response.slice();
          this.renderFromTransactions(this._transactions);
          this.showEmptyState = false;
        } else {
          console.log("Api:", res.message);
          this.renderFromTransactions([]);
        }
      },
      error: (err) => {
        console.error(err);
        this.renderFromTransactions([]);
      }
    });
  }

  GetTransactionsByPaypadId(id: number) {
    this._api.GetTransactionsById(id).subscribe({
      next: (res: TransactionResponse) => {
        if (res.statusCode === 200 && res.response) {
          const txs = res.response.slice();
          this.renderFromTransactions(txs);
          this.showEmptyState = false;
        } else {
          console.log("Api:", res.message);
          this.renderFromTransactions([]);
        }
      },
      error: (err) => {
        console.error(err);
        this.renderFromTransactions([]);
      }
    });
  }

  private renderFromTransactions(transactions: Transaction[]) {
    const ordered = transactions.slice().sort(
      (a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
    );

    const buckets = new Map<number, { pay: number; withdraw: number; count: number }>();
    
    for (const t of ordered) {
      const ts = this.startOfDay(new Date(t.dateCreated).getTime());
      const b = buckets.get(ts) ?? { pay: 0, withdraw: 0, count: 0 };

      if (
        t.stateTransaction == "Aprobada" ||
        t.stateTransaction == "Aprobada Error Devuelta" ||
        t.stateTransaction == "Aprobada Sin Notificar"
      ) {
        b.withdraw += this.num((t as any).returnAmount ?? 0);
        b.pay += this.num(t.totalAmount);
      }
      b.count += 1;
      buckets.set(ts, b);
    }

    const points = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
    this._chartNumbersPays = points.map(([x, b]) => ({ x, y: b.pay }));
    this._chartNumbersWithdrawals = points.map(([x, b]) => ({ x, y: b.withdraw }));
    this._chartNumbersTransactions = points.map(([x, b]) => ({ x, y: b.count }));

    setTimeout(() => {
      this.createPayChart();
      this.createWithdrawChart();
      this.createTransactionChart();
      this.createDonutChart();
      this.refreshComparison();
    }, 100);
  }

  private createPayChart() {
    if (this.payChart) {
      this.payChart.destroy();
    }

    const ctx = this.payChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.payChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Pagos',
          data: this._chartNumbersPays,
          borderColor: '#22c55e',
          backgroundColor: this.createGradient(ctx, '#22c55e', '#86efac'),
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5
        }]
      },
      options: this.getLineChartOptions('$')
    });
  }

  private createWithdrawChart() {
    if (this.withdrawChart) {
      this.withdrawChart.destroy();
    }

    const ctx = this.withdrawChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.withdrawChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Retiros',
          data: this._chartNumbersWithdrawals,
          borderColor: '#dc2626',
          backgroundColor: this.createGradient(ctx, '#dc2626', '#fca5a5'),
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5
        }]
      },
      options: this.getLineChartOptions('$')
    });
  }

  private createTransactionChart() {
    if (this.transactionChart) {
      this.transactionChart.destroy();
    }

    const ctx = this.transactionChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.transactionChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Transacciones',
          data: this._chartNumbersTransactions,
          borderColor: '#9333ea',
          backgroundColor: this.createGradient(ctx, '#9333ea', '#d8b4fe'),
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5
        }]
      },
      options: this.getLineChartOptions('')
    });
  }

  private createDonutChart() {
    if (this.donutChart) {
      this.donutChart.destroy();
    }

    const ctx = this.donutChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pagos', 'Retiros'],
        datasets: [{
          data: this._donutCompareSeries,
          backgroundColor: ['#3b82f6', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#1f2937', font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: $${Math.round(value).toLocaleString()}`;
              }
            }
          },
          title: {
            display: true,
            text: `Total Transacciones: ${this._donutTxTotal.toLocaleString()}`,
            color: '#1f2937',
            font: { size: 14, weight: 'bold' }
          }
        }
      }
    });
  }

  private createGradient(ctx: CanvasRenderingContext2D, colorStart: string, colorEnd: string) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, colorStart + '99');
    gradient.addColorStop(1, colorEnd + '33');
    return gradient;
  }

  private getLineChartOptions(prefix: string): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y || 0;
              return prefix ? `${prefix}${Math.round(value).toLocaleString()}` : Math.round(value).toLocaleString();
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: { day: 'dd MMM yyyy' }
          },
          grid: { color: '#e5e7eb' },
          ticks: { color: '#6b7280' }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#e5e7eb' },
          ticks: {
            color: '#6b7280',
            callback: (value) => {
              return prefix ? `${prefix}${Math.round(Number(value)).toLocaleString()}` : Math.round(Number(value)).toLocaleString();
            }
          }
        }
      }
    };
  }

  public UpdateOptionsPay(option: "1m" | "6m" | "1y" | "all"): void {
    this._activeOptionButtonPay = option;
    this.updateChartRange(this.payChart, option);
  }

  public UpdateOptionsWithdraw(option: "1m" | "6m" | "1y" | "all"): void {
    this._activeOptionButtonWithdraw = option;
    this.updateChartRange(this.withdrawChart, option);
  }

  public UpdateOptionsTransaction(option: "1m" | "6m" | "1y" | "all"): void {
    this._activeOptionButtonTransaction = option;
    this.updateChartRange(this.transactionChart, option);
  }

  public UpdateOptionsComparison(option: "1m" | "6m" | "1y" | "all") {
    this._comparisonRange = option;
    this.refreshComparison();
  }

  private updateChartRange(chart: Chart | undefined, range: "1m" | "6m" | "1y" | "all") {
    if (!chart) return;

    const now = Date.now();
    let min: number | undefined;

    if (range === "1m") min = this.monthsAgo(now, 1);
    else if (range === "6m") min = this.monthsAgo(now, 6);
    else if (range === "1y") min = this.yearsAgo(now, 1);

    if (chart.options.scales?.["x"]) {
      chart.options.scales["x"].min = min;
      chart.options.scales["x"].max = range === "all" ? undefined : now;
    }
    chart.update();
  }

  onPaypadChange(idStr: string) {
    this.selectedPaypadId = idStr;

    if (idStr === "all") {
      // Opción "Todos"
      this.GetAllTransaction();
      return;
    }

    if (!idStr) {
      // Limpiar charts
      this.showEmptyState = true;
      this.destroyAllCharts();
      return;
    }

    const id = Number(idStr);
    if (!isNaN(id)) {
      this.GetTransactionsByPaypadId(id);
    }
  }

  private destroyAllCharts() {
    this.payChart?.destroy();
    this.withdrawChart?.destroy();
    this.transactionChart?.destroy();
    this.donutChart?.destroy();
  }

  private refreshComparison() {
    const pagos = this.sumInRange(this._chartNumbersPays, this._comparisonRange);
    const retiros = this.sumInRange(this._chartNumbersWithdrawals, this._comparisonRange);
    this._donutTxTotal = this.countInRange(this._chartNumbersTransactions, this._comparisonRange);
    this._donutCompareSeries = [pagos, retiros];

    if (this.donutChart) {
      this.donutChart.data.datasets[0].data = this._donutCompareSeries;
      if (this.donutChart.options.plugins?.title) {
        this.donutChart.options.plugins.title.text = `Total Transacciones: ${this._donutTxTotal.toLocaleString()}`;
      }
      this.donutChart.update();
    }
  }

  private sumInRange(points: { x: number; y: number }[], range: "1m" | "6m" | "1y" | "all") {
    if (range === "all") return points.reduce((acc, p) => acc + (Number(p.y) || 0), 0);
    const now = Date.now();
    const min =
      range === "1m" ? this.monthsAgo(now, 1)
        : range === "6m" ? this.monthsAgo(now, 6)
          : this.yearsAgo(now, 1);
    return points
      .filter(p => p.x >= min && p.x <= now)
      .reduce((acc, p) => acc + (Number(p.y) || 0), 0);
  }

  private countInRange(points: { x: number; y: number }[], range: "1m" | "6m" | "1y" | "all") {
    if (range === "all") return points.reduce((acc, p) => acc + (Number(p.y) || 0), 0);
    const now = Date.now();
    const min =
      range === "1m" ? this.monthsAgo(now, 1)
        : range === "6m" ? this.monthsAgo(now, 6)
          : this.yearsAgo(now, 1);
    return points
      .filter(p => p.x >= min && p.x <= now)
      .reduce((acc, p) => acc + (Number(p.y) || 0), 0);
  }

  private startOfDay(ts: number): number {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  private monthsAgo(msBase: number, n: number): number {
    const d = new Date(msBase);
    return new Date(d.getFullYear(), d.getMonth() - n, d.getDate()).getTime();
  }

  private yearsAgo(msBase: number, n: number): number {
    const d = new Date(msBase);
    return new Date(d.getFullYear() - n, d.getMonth(), d.getDate()).getTime();
  }

  private num(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  Exit() {
    localStorage.clear();
    this._router.navigate(["/login"]);
  }

  GoToMaps() {
    this._router.navigate(["/dashboard"]);
  }
}