import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'jt-repeats-icon',
  templateUrl: './repeats-icon.component.html',
  styleUrls: ['./repeats-icon.component.css']
})
export class RepeatsIconComponent implements OnInit {
  @Input()
  val: number;
  constructor() { }

  ngOnInit() {
  }

}
