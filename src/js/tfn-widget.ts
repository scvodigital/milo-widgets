import { BaseWidget } from './base-widget';
import '../styles/tfn.scss';

class TFNWidget extends BaseWidget {
    number: number = 3;
    style: string = 'basic';
    hideMap: boolean = true;

    constructor() {
        super('');
        this.style = this.scriptTag.data('style');
        this.number = this.scriptTag.data('number');
    }
}

var widget = new BaseWidget('tfn');
