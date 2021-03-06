import { Component, ElementRef, Renderer } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import * as jq from 'jquery';

@Component({
    selector: 'milo-widgets',
    templateUrl: './app.component.html'
})
export class AppComponent {
    constructor(private router: Router, elementRef: ElementRef, renderer: Renderer) {
        // Good HQ redirect
        if (window.location.hostname == 'widgets.goodhq.org') {
            window.location.href = 'https://goodhq.org';
        }
        if (window.location.hostname == 'widgets.thirdforcenews.scot') {
            window.location.href = 'http://thirdforcenews.scot';
        }
        if (window.location.hostname == 'widgets.goodmoves.com') {
            window.location.href = 'https://goodmoves.com';
        }

        // Scroll to top on new route
        router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                window.scrollTo(0, 0);
            }
        });

        // Click to copy
        renderer.listen(elementRef.nativeElement, 'click', (event) => {
           if (event.target.className == 'btn btn-sm copy') {
               var code = jq("#"+event.target.dataset.source)[0].innerText;
               var aux = document.createElement("input");
               aux.setAttribute("value", code);
               document.body.appendChild(aux);
               aux.select();
               document.execCommand("copy");
               document.body.removeChild(aux);
           }
       });
    }
}
