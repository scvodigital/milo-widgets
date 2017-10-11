import { BaseWidget } from './base-widget';
import '../styles/tfn.scss';

class TFNWidget extends BaseWidget {
    number: number = 3;
    hideMap: boolean = true;

    constructor() {
        super('');
        this.number = this.scriptTag.data('number');
        this.hideMap = true;
    }
}

var widget = new BaseWidget('tfn');
