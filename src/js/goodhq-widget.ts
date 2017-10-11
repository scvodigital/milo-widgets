import { BaseWidget } from './base-widget';
import '../styles/goodhq.scss';

class GoodHQWidget extends BaseWidget {
    xid: string = 'undefined';
    style: string = 'basic';
    hideMap: boolean = true;

    constructor() {
        super('');
        this.xid = this.scriptTag.data('xid');
        this.style = this.scriptTag.data('style');
        this.hideMap = true;
    }
}

var widget = new BaseWidget('goodhq');
