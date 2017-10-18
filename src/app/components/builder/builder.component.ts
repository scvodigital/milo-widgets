import { Component } from '@angular/core';

@Component({
    selector: 'main-container.content',
    templateUrl: './builder.component.html'
})
export class BuilderComponent {
    private type: string = "";
    private filter: string = "";
    private style: string = "basic";
    private hideTitle: boolean = false;
    private hideMap: boolean = false;

    constructor() {}

}
