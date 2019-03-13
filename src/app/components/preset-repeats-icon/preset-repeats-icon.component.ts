import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'jt-preset-repeats-icon',
  templateUrl: './preset-repeats-icon.component.html',
  styleUrls: ['./preset-repeats-icon.component.css']
})
export class PresetRepeatsIconComponent implements OnInit {
  @Input()
  val: number;

  constructor() { }

  ngOnInit() {
  }

}
