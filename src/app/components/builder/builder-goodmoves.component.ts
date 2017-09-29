import { Component } from '@angular/core';

@Component({
    selector: 'main-container.content',
    templateUrl: './builder-goodmoves.component.html'
})
export class GoodmovesBuilderComponent {
    private type: string = "basic";
    private number: number = 3;

    constructor() {}

}
