import { Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms"; 

import {
  NgApexchartsModule,
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexAnnotations,
  ApexDataLabels,
  ApexStroke,
  ApexGrid,
  ApexXAxis,
  ApexYAxis,
  ApexTooltip,
  ApexFill,
  ApexMarkers,
  ApexOptions
} from "ng-apexcharts";

import { Api } from "../../../Services/apiService";
import { PayPadResponse } from "../../../Interfaces/locations";
import { TransactionResponse, Transaction } from "../../../Interfaces/transactions";
import { PayPad } from "../../../Interfaces/charts";
import { ApexNonAxisChartSeries } from 'ng-apexcharts';


export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  annotations?: ApexAnnotations;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  xaxis: ApexXAxis;
  yaxis?: ApexYAxis;
  stroke: ApexStroke;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  fill: ApexFill;
  colors?: string[];
  theme?: any;  
};

@Component({
  selector: "app-charts",
  templateUrl: "./charts.html",
  standalone: true,
  imports: [NgApexchartsModule, CommonModule, FormsModule]
})
export class Charts implements OnInit {
  @ViewChild("_chart", { static: false }) _chartPays!: ChartComponent;
  @ViewChild("_chartWithdraw", { static: false }) _chartWithdrawals!: ChartComponent;
  @ViewChild("_chartTransaction", { static: false }) _chartTransactions!: ChartComponent;
  @ViewChild("_donutCompare", { static: false }) _donutCompare!: ChartComponent;

  showCircularPay = false;
  showCircularWithdraw = false;
  showCircularTransaction = false;
  _donutTxTotal = 0;

  _currentYear: number = new Date().getFullYear();

  _chartOptionsPay: ChartOptions = this.baseAreaOptions();
  _chartOptionsWithdraw: ChartOptions = this.baseAreaOptions();
  _chartOptionsTransaction: ChartOptions = this.baseAreaOptions();

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
  private _autoSelected = false; 

  constructor(
    private _api: Api,
    private _router: Router
  ) {}

  ngOnInit(): void {
    const _user = localStorage.getItem("User");
    if (!_user) { this.Exit(); return; }
    this.GetAllPaypads();
    this.GetAllTransaction();
  }

  GetAllTransaction() {
    this._api.GetAllTransactions().subscribe({
      next: (res: TransactionResponse) => {
        if (res.statusCode === 200 && res.response) {
          this._transactions = res.response.slice();
          this.renderFromTransactions(this._transactions);
          this.maybeAutoFilter();
        } else {
          console.log("Api:", res.message);
          this.renderFromTransactions([]);
        }
      },
      error: (err) => { console.error(err); this.renderFromTransactions([]); }
    });
  }

  GetAllPaypads() {
    this._api.GetAllPaypads().subscribe({
      next: (res: PayPadResponse) => {
        if (res.statusCode === 200 && res.response) {
          this._paypads = res.response;
          console.log(res.response);
          this.maybeAutoFilter();
        }
      },
      error: (err) => console.error(err)
    });
  }

  GetTransactionsByPaypadId(id: number) {
    this._api.GetTransactionsById(id).subscribe({
      next: (res: TransactionResponse) => {
        if (res.statusCode === 200 && res.response) {
          const txs = res.response.slice();
          this.renderFromTransactions(txs);
        } else {
          console.log("Api:", res.message);
          this.renderFromTransactions([]);
        }
      },
      error: (err) => { console.error(err); this.renderFromTransactions([]); }
    });
  }


  private maybeAutoFilter() {
    if (this._autoSelected) return;
    if (!this._paypads.length || !this._transactions.length) return;

    const matchTx = this._transactions.find(
      t => t.idPayPad === 1 || t.payPad === "Pay+ Prueba1" || t.idPayPad === 2 || t.payPad === "Pay+ Santa Rosa Pruebas"

    );
    if (!matchTx) return;

    const forced =
      this._paypads.find(p => p.id === (matchTx.idPayPad ?? 1)) ||
      this._paypads.find(p => p.username === "Pay+ Prueba1");
      this._paypads.find(p => p.id === (matchTx.idPayPad ?? 2)) ||
      this._paypads.find(p => p.username === "Pay+ Santa Rosa Pruebas");

    if (forced) {
      this._autoSelected = true;
      this.selectedPaypadId = String(forced.id);   
      this.GetTransactionsByPaypadId(forced.id);
    }
  }

  private renderFromTransactions(transactions: Transaction[]) {
    const ordered = transactions.slice().sort(
      (a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
    );

    const buckets = new Map<number, { pay: number; withdraw: number; count: number }>();
    for (const t of ordered) {
      const ts = this.startOfDay(new Date(t.dateCreated).getTime());
      const b = buckets.get(ts) ?? { pay: 0, withdraw: 0, count: 0 };

      if(t.stateTransaction == "Aprobada" || t.stateTransaction== "Aprobada Error Devuelta" || t.stateTransaction=="Aprobada Sin Notificar")
      {
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

    this.FillPayChart();
    this.FillWithdrawChart();
    this.FillTransactionChart();
    this.refreshComparison();
  }

  private startOfDay(ts: number): number {
    const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime();
  }
  private monthsAgo(msBase: number, n: number): number {
    const d = new Date(msBase); return new Date(d.getFullYear(), d.getMonth() - n, d.getDate()).getTime();
  }
  private yearsAgo(msBase: number, n: number): number {
    const d = new Date(msBase); return new Date(d.getFullYear() - n, d.getMonth(), d.getDate()).getTime();
  }
  private num(v: any): number { const n = Number(v); return isNaN(n) ? 0 : n; }

  private rangeOptions(range: "1m" | "6m" | "1y" | "all") {
    const now = Date.now();
    if (range === "1m") return { xaxis: { min: this.monthsAgo(now, 1), max: now } };
    if (range === "6m") return { xaxis: { min: this.monthsAgo(now, 6), max: now } };
    if (range === "1y") return { xaxis: { min: this.yearsAgo(now, 1), max: now } };
    return { xaxis: { min: undefined, max: undefined } };
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

  private baseAreaOptions(): ChartOptions {
    return {
    series: [{ name: "", data: [] }],

    chart: {
      type: "area",
      height: 350,
      toolbar: { show: false },
      foreColor: "#e5e7eb",          
      background: "#1f2937"            
    },

    theme: {
      mode: "dark",
      palette: "palette5"             
    },
    
    dataLabels: { enabled: false },
    markers: { size: 0 },

    stroke: { 
      curve: "smooth",
      width: 1.5                  
    },

    grid: { borderColor: "#374151" }, 

    xaxis: { 
      type: "datetime",
      labels: { style: { colors: "#d1d5db" } } 
    },

    yaxis: {
      labels: { 
        style: { colors: "#d1d5db" },
        formatter: (val: number) => Math.round(val).toLocaleString()
      }
    },

    tooltip: { 
      x: { format: "dd MMM yyyy" },
      theme: "dark" 
    },

    fill: {
      type: "gradient",
      gradient: {
        shade: 'dark',              
        type: "vertical",             // 'horizontal', 'vertical', 'diagonal1', 'diagonal2'
        shadeIntensity: 0.7,          
        gradientToColors: ["#00c6ff"], 
        inverseColors: true,
        opacityFrom: 0.9,
        opacityTo: 0.3,
        stops: [50,80,100]         
      }
    }
  };
  }

  private FillPayChart() {
    this._chartOptionsPay = {
      ...this.baseAreaOptions(),
      series: [{ name: "Pagos", data: this._chartNumbersPays }],
      annotations: { yaxis: [{ y: 30, borderColor: "#999" }], xaxis: [{ x: this.yearsAgo(Date.now(), 1), borderColor: "#999" }] },
      yaxis: { labels: { formatter: (v: number) => "$" + Math.round(v).toLocaleString() } },
      stroke: { 
        colors:["green"],
        curve: "smooth",
        width: 1               
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: 'dark',               
          type: "vertical",             
          shadeIntensity: 0.7,
          gradientToColors: ["#36ee4e"], 
          inverseColors: true,
          opacityFrom: 0.9,
          opacityTo: 0.3,
          stops: [80]         
        }
      }
    };
  }
  private FillWithdrawChart() {
    this._chartOptionsWithdraw = {
      ...this.baseAreaOptions(),
      series: [{ name: "Retiros", data: this._chartNumbersWithdrawals }],
      annotations: { yaxis: [{ y: 30, borderColor: "#999" }], xaxis: [{ x: this.yearsAgo(Date.now(), 1), borderColor: "#999" }] },
      yaxis: { labels: { formatter: (v: number) => "$" + Math.round(v).toLocaleString() } },
      stroke: { 
        colors:["#932121"],
        curve: "smooth",
        width: 1               
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: 'dark',               
          type: "vertical",             
          shadeIntensity: 0.7,
          gradientToColors: ["red"], 
          inverseColors: true,
          opacityFrom: 0.9,
          opacityTo: 0.3,
          stops: [80]         
        }
      }
    };
  }
  private FillTransactionChart() {
    this._chartOptionsTransaction = {
      ...this.baseAreaOptions(),
      series: [{ name: "Transacciones", data: this._chartNumbersTransactions }],
      annotations: { yaxis: [{ y: 30, borderColor: "#999" }], xaxis: [{ x: this.yearsAgo(Date.now(), 1), borderColor: "#999" }] },
      yaxis: { labels: { formatter: (v: number) => Math.round(v).toLocaleString() } },
      stroke: { 
        colors:["#2e6dc1"],
        curve: "smooth",
        width: 1               
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: 'dark',               
          type: "vertical",             
          shadeIntensity: 0.7,
          gradientToColors: ["#36a6ee"], 
          inverseColors: true,
          opacityFrom: 0.9,
          opacityTo: 0.3,
          stops: [80]         
        }
      }
    };
  }

  public UpdateOptionsPay(option: "1m" | "6m" | "1y" | "all"): void {
    this._activeOptionButtonPay = option;
    this._chartPays?.updateOptions(this.rangeOptions(option), false, true, true);
  }
  public UpdateOptionsWithdraw(option: "1m" | "6m" | "1y" | "all"): void {
    this._activeOptionButtonWithdraw = option;
    this._chartWithdrawals?.updateOptions(this.rangeOptions(option), false, true, true);
  }
  public UpdateOptionsTransaction(option: "1m" | "6m" | "1y" | "all"): void {
    this._activeOptionButtonTransaction = option;
    this._chartTransactions?.updateOptions(this.rangeOptions(option), false, true, true);
  }

  public UpdateOptionsComparison(option: "1m" | "6m" | "1y" | "all") {
    this._comparisonRange = option;
    this._donutCompare?.updateOptions(this.rangeOptions(option), false, true, true);
    this.refreshComparison();
  }

  onPaypadChange(idStr: string) {
    this.selectedPaypadId = idStr;          
    const id = Number(idStr);
    if (!idStr) { this.GetAllTransaction(); return; }
    if (!isNaN(id)) this.GetTransactionsByPaypadId(id);
  }


  _donutCompareSeries: ApexNonAxisChartSeries = [0, 0]; 
  _donutCompareOptions: ApexOptions = {
    chart: { type: "donut", background: "#1f2937" }, 
    labels: ["Pagos", "Retiros"],
    colors: ["#56cd3d", "#df3d3d"], 
    theme: { mode: "dark" },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: { size: "68%", labels: { show: true, total: { show: true, showAlways:true, label: "Transacciones Totales", formatter: () => new Intl.NumberFormat('es-CO').format(this._donutTxTotal) } } }
      }
    },
    legend: { show: true, labels: { colors: "#d1d5db" } },
    tooltip: {
      theme: "dark",
      y: { formatter: (val: number) => "$" + Math.round(val).toLocaleString() }
    }
  };

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

  private refreshComparison() {
    const pagos = this.sumInRange(this._chartNumbersPays, this._comparisonRange);
    const retiros = this.sumInRange(this._chartNumbersWithdrawals, this._comparisonRange);
    this._donutTxTotal = this.countInRange(this._chartNumbersTransactions, this._comparisonRange);
    this._donutCompareSeries = [pagos, retiros];
  }


  verCharts() {
    document.getElementById('charts-section')
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
  }
  Exit() { 
    localStorage.clear();
    this._router.navigate(["/login"]); 
  }
  GoToMaps() {
    this._router.navigate(["/dashboard"]); 
  }
}