/**
 * 前端多语言解决方案
 */
;(function(win, UpAct, Util) {
    
    const LangUtil = function() {
        this.initialize.apply(this, arguments);
    }

    LangUtil.prototype = {
        /**
         * @return zh-CN、zh-TW、zh-HK、ar-EG、vi-VN、ja-JP
         */
        lang: '',
        /**
         * @return zhcn、zhtw、zhhk、areg、vivn、jajp
         */
        langType: '',
        /**
         * 支持的语言列表
         */
        languages: ['zh-CN'],
        /**
         * 初始化化入口
         */
        initialize: function(cfg){ 
            // coding
        },

        init: function(cfg) {            
            let LangPack = window.UpLive_LangPack || {};
            let lang = this.getLanguage();
            let langType = lang.replace('-', '').toLowerCase();

            $('html').attr('lang', lang);
            $('body').addClass(langType);

            this.lang = lang;
            this.pack = LangPack[langType];
            this.langType = langType;
        },
        /**
         * 获取语言。优先级：URL配置 > 系统语言 > 默认语言
         */
        getLanguage: function() {
            if (Util.query('_lang')) { // 配置页面语言
                return Util.query('_lang');
            } else if (window.g_Language) { // 系统浏览器语言
                return window.g_Language;
            } else {
                return this.languages[0]; // 若没有，获取第一个活动语言。
            }
        },
        /**
         * 渲染模版内容
         * @param tplStr模版内容
         * @param data 数据
         * @splitWidthEM  默认false
         */
        template: function(tplStr, data, insertEM) {
            let tpl = (this.pack && this.pack[tplStr] || tplStr) + '';
            
            insertEM = (typeof insertEM == 'undefined') ? false : true;
            
            if (!tpl) {
                return '';
            }
            // for 活动规则。段落分隔符号：@@@@
            if (tpl.indexOf('@@@@') >= 0) {
                let strArr = [];

                strArr.push('<ul>');
                tpl.split('@@@@').forEach(function(item, index) {
                    item && strArr.push('<li>' + item + '</li>');
                });
                strArr.push('</ul>');
                tpl = strArr.join('');
            }

            tpl = tpl.replace(/\{([\s\S]+?)\}/ig, function($0, $1) {
                if (insertEM) {
                    return '<em class="' + $1 + '">' + data[$1] + '</em>';
                } else {
                    return data[$1];
                }
            });
            
            return tpl;
        }
    }

    UpAct.lang = new LangUtil();

})(window, window['UpAct'] || (window['UpAct'] = {}), UpAct.BaseUtil);
