import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss']
})
export class PanelComponent implements OnInit{
  @Output() expandedChange = new EventEmitter<boolean>();
  @Input() expanded:boolean = true;

  ngOnInit(): void {
    this.expandedChange.emit(this.expanded);
  }

  togglePanel() {
    this.expanded = !this.expanded;
    this.expandedChange.emit(this.expanded);
  }
}
