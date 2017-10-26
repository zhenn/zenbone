// css文件中不要使用import
import '../css/reset.css';
import '../css/index.css';

// 基础
import './lib/object.assign';
import './lib/promise';
import './lib/base-util';

// 语言
require('./lang/index');

import pageTpl from './template/page.tmpl';

let Game = {
    init: function() {
        let self = this;

        this.renderHTML();
    },

    renderHTML: function() {
        let html = pageTpl({
            data: 'xxx'
        });

        $('#wrap').html(html);
    }
};

$.getScript(langUrl + '?t=' + (+ new Date()) , function(){
    UpAct.lang.init();
    Game.init();
});