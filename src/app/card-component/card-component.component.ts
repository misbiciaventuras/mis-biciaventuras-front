import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-component',
  templateUrl: './card-component.component.html',
  styleUrls: ['./card-component.component.scss']
})
export class CardComponentComponent {
  @Input() imageSrc?: string; // Opcional, si no se provee, no se muestra la imagen
  @Input() title: string = ''; // Título de la tarjeta
  @Input() links?: Array<{ url: string; logo: string }>;
}
