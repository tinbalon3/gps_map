import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AzureMapComponent } from './components/azure-map/azure-map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    AzureMapComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gps-maps';
}
