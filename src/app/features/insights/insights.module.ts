import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { InsightsRoutingModule } from './insights-routing.module';
import { InsightsComponent } from './insights.component';

@NgModule({
  declarations: [
    InsightsComponent
  ],
  imports: [
    SharedModule,
    InsightsRoutingModule
  ]
})
export class InsightsModule {}
