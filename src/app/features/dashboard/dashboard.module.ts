import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { TrendChartComponent } from './components/trend-chart/trend-chart.component';
import { CategoryChartComponent } from './components/category-chart/category-chart.component';

@NgModule({
  declarations: [
    DashboardComponent,
    TrendChartComponent,
    CategoryChartComponent
  ],
  imports: [
    SharedModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule {}
