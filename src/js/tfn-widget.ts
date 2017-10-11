import { BaseWidget } from './base-widget';

class TFNWidget extends BaseWidget {
    number: number = 3;
    style: string = 'basic';
    hideMap: boolean = true;

    constructor() {
        super('');
        this.number = this.scriptTag.data('number');
        this.style = this.scriptTag.data('style');
        this.hideMap = true;
    }
}

var widget = new BaseWidget('tfn');
