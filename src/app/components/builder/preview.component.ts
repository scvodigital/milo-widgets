import { Component, Input, ElementRef } from '@angular/core';
import * as jq from 'jquery';

@Component({
    selector: 'preview',
    template: ''
})
export class PreviewComponent {
    @Input() public type: string = "organisations";
    @Input() public filter: string = "";
    @Input() public style: string = "";
    @Input() public xid: string = "";
    @Input() public hideTitle: boolean = false;
    @Input() public hideMap: boolean = true;

    constructor(private elementRef:ElementRef) {}

    ngOnChanges() {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = "https://milo.scvo.org/"+this.type+".bundle.js";
        if (this.filter !== "") s.setAttribute("data-tsi", ""+this.filter);
        if (this.style !== "") s.setAttribute("data-widget-style", ""+this.style);
        if (this.xid !== "") s.setAttribute("data-xid", ""+this.xid);
        s.setAttribute("data-hide-title", ""+this.hideTitle);
        s.setAttribute("data-hide-map", ""+this.hideMap);
        jq('preview').children().remove();
        this.elementRef.nativeElement.appendChild(s);
    }
}
