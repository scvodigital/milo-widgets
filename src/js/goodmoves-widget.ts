import { BaseWidget } from './base-widget';
import '../styles/goodmoves.scss';

class GoodmovesWidget extends BaseWidget {
    number: number = 3;
    style: string = 'basic';
    hideMap: boolean = true;

    constructor() {
        super('');
        this.number = this.scriptTag.data('number');
        this.style = this.scriptTag.data('style');
    }
}

var widget = new BaseWidget('goodmoves');
