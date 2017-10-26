;(function(win, UpAct, $) {
    let ua = window.navigator.userAgent;
    let isIOS = (/iPhone|iPad|iPod/i).test(ua);

    const query = function(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"),
            r = location['search'].substr(1).match(reg);
        if (r != null) {
            return decodeURIComponent(r[2]);
        }
        return null;

    };

    const addParam = function(url, data) {
        if (typeof data === 'undefined') {
            return;
        }

        var hashReg = /#.*$/gi,
            hashMatch = url.match(hashReg),
            hash = '';

        if (hashMatch) {
            hash = hashMatch[0];
        }

        // 去除hash值的url
        var preUrl = url.replace(hash, '');

        var searchReg = /\?(.*?)$/gi;
        var result = searchReg.exec(preUrl)
        var query, newUrl;
        if (result) {
            query = result[1].split('#')[0];
        }

        var id = !query ? '' : '&';

        return preUrl + (query && query.length > 0 ? '' : '?') + (id + $.param(data)) + hash;
    }


    const delQuery = function(url, key) {
        var path = '',
            param = '',
            hash = '';
        if (url.indexOf('?') == -1) {
            path = url;
        } else {
            path = url.substr(0, url.indexOf('?'));
            param = url.substr(url.indexOf('?') + 1);
            if (param.indexOf('#') != -1) {
                hash = param.substr(param.indexOf('#') + 1);
                param = param.substr(0, param.indexOf('#'));
            }
        }
        var params = param.split('&');
        for (var i = params.length - 1; i >= 0; i--) {
            if (params[i].indexOf(key + '=') > -1) {
                params.splice(i, 1);
                break;
            }
        }

        return path + (params.join('&') ? ('?' + params.join('&')) : '') + (hash ? ('#' + hash) : '');
    }

    let envi = function(ua) {
        let platform = {};
        let device = {};
        let env;

        if (ua.match(/uplive/i) || query('pl', 'hash') == 'uplive') {
            platform = {
                val: 2002,
                name: 'uplive',
                isUplive: true
            };
        } else if (ua.match(/micromessenger/i)) {
            // 微信
            platform = {
                val: 1,
                name: 'wechat',
                isWeixin: true
            };
        } else if (ua.match(/qq/i) || ua.match(/and_sq_/i)) {
            // QQ
            platform = {
                val: 4001,
                name: 'qq',
                isQQ: true
            };
        } else if (ua.match(/weibo/i)) {
            // 微博
            platform = {
                val: 8001,
                name: 'weibo',
                isWeibo: true
            };
        } else if (ua.match(/[Tt]witter/i)) {
            // twitter
            platform = {
                val: 2,
                name: 'twitter',
                isTwitter: true
            };
        } else if (ua.match(/FB_IAB/i)) {
            // facebook
            platform = {
                val: 3,
                name: 'facebook',
                isFacebook: true
            };
        } else {
            platform = {
                val: 0,
                name: 'unknown',
                isOther: true
            };
        }

        if (ua.match(/android/i)) {
            device = {
                val: 1,
                name: 'android',
                isAndroid: true
            }
        } else if (ua.match(/iphone|ipad|itouch/i)) {
            device = {
                val: 2,
                name: 'ios',
                isIOS: true
            }
        } else {
            device = {
                val: 3,
                name: 'unknown',
                isOther: true
            }
        }

        let _env = query('env');

        if (!_env || _env == 'null') {
            env = 'pro';
        } else {
            env = _env;
        }

        return {
            device: device,
            platform: platform,
            env: env
        }
    }(navigator.userAgent);

    let setTitle = function(value) {
        var nodeTitle = $('title').eq(0);

        if (value && value !== '') {
            nodeTitle.html(value);
        }

        if (isIOS) {
            let $iframe;

            $iframe = $('<iframe src="http://n.cdn.pengpengla.com/1000401/game/pic/1460535512667.png" style="display:none;border:0;width:0;height:0;"></iframe>');
            $iframe.on('load', function() {
                setTimeout(function() {
                    $iframe.off('load').remove();
                }, 300);
            }).appendTo('body');
        }
    };

    UpAct.device = envi.device;
    UpAct.platform = envi.platform;
    UpAct.BaseUtil = {
        query: query,
        addParam: addParam,
        delQuery: delQuery,
        envi: envi,
        setTitle: setTitle,

    };
    $.getScript = function(url, options) {

        var script = document.createElement('script'),
            isFunction = $.isFunction(options),
            timer;

        // 清除定时器
        function clearTimer() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        }

        // success
        if (isFunction || (options && options.success)) {
            script.onload = function() {
                clearTimer();
                isFunction ? options() : options.success.call(options.context);
            };
        }

        if (!isFunction && options) {
            // failure
            if (options.error) {
                script.onerror = function() {
                    clearTimer();
                    options.error.call(options.context);
                }
            }
            // timeout
            if (options.timeout) {
                timer = setTimeout(function() {
                    timer = null;
                    if (options.error) {
                        options.error.call(options.context);
                    }
                }, options.timeout);
            }
        }

        script.setAttribute('data-path', url);

        script.src = url;

        return document.body.appendChild(script);

    };
})(window, window['UpAct'] || (window['UpAct'] = {}), Zepto);