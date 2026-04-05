import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { HotTableModule } from '@handsontable/angular';
import { TransactionsRoutingModule } from './transactions-routing.module';
import { TransactionsComponent } from './transactions.component';

@NgModule({
  declarations: [
    TransactionsComponent
  ],
  imports: [
    SharedModule,
    TransactionsRoutingModule,
    HotTableModule.forRoot()
  ]
})
export class TransactionsModule {}
