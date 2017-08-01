import { Component } from '@angular/core';

@Component({
    selector: 'main-container.content',
    templateUrl: './builder.component.html'
})
export class BuilderComponent {
    private type: string = "";
    private filter: string = "";
    private hideTitle: boolean = false;
    private hideMap: boolean = true;

    constructor() {}

}
