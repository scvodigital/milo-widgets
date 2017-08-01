import { Component, Input, ElementRef } from '@angular/core';
import * as jq from 'jquery';

@Component({
    selector: 'preview',
    template: ''
})
export class PreviewComponent {
    @Input() public type: string = "organisations";
    @Input() public filter: string = "";
    @Input() public hideTitle: boolean = false;
    @Input() public hideMap: boolean = true;

    constructor(private elementRef:ElementRef) {}

    ngOnChanges() {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = "https://milo.scvo.org/"+this.type+".bundle.js";
        if (this.filter !== "") s.setAttribute("data-tsi", ""+this.filter);
        s.setAttribute("data-hide-title", ""+this.hideTitle);
        s.setAttribute("data-hide-map", ""+this.hideMap);
        jq('preview').children().remove();
        this.elementRef.nativeElement.appendChild(s);
    }
}
