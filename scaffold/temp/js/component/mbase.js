/**
 * 曾经出现过的问题：
 * vivo 云手机出现过无法改默认viewport的情况
 * 小米2 三星4.1.1 在手淘webview下面加此target-densitydpi=device-dpi属性线可细，但是会出现闪屏，故需加默认的viewport meta
 * ios 6.0.1的width需重置，否则会继承上一次的width值
 * iphone6 width由原来375变为750时，屏幕可左右滑动
 * 中兴 ZTEU930 对rem的计算有问题 1rem != html font-size = font-size
 */

;(function(win) {
    var docEl = document.documentElement;
    var metaEl = document.querySelector('meta[name="viewport"]');
    var fontEl = document.createElement('style');
    var dpr;
    var scale;

    var dpr = win.devicePixelRatio || 1;
    scale = 1 / dpr;   
        
    if(!metaEl) {
        console.warn('请设置默认viewport为：<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />');
        return;
    }
    // ios
    var docWidth = docEl.clientWidth;
    if(/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        //iphone 6 会出现左右可滚动的现象，默认width为375后来为750，先变为980再变为750可解决。
        if(docWidth === 375) {
            metaEl.setAttribute('content', 'user-scalable=no');
        }
        //Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4
        var versionMatches = navigator.userAgent.match(/iPhone OS (\d+)\_\d+/i);
        if(versionMatches && parseInt(versionMatches[1]) < 8) {
            //width=xx 修复ios 6.1.3的问题 因为默认把width=device-width加上会导致ios6的width=320 scale后就变为一半了
            metaEl.setAttribute('content', 'width=' + dpr * docWidth + ',initial-scale=' + scale + ',maximum-scale=' + scale + ', minimum-scale=' + scale + ',user-scalable=no');
        } else {
            metaEl.setAttribute('content', 'initial-scale=' + scale + ',maximum-scale=' + scale + ', minimum-scale=' + scale + ',user-scalable=no');
        }
    } else {
        /**
         * hack 小米2在webview（AppleWebkit/354）下会出现闪屏现象，原因是target-densitydpi=device-dpi导致，会导致先显示整个分辨率的大小，再缩小
         * 原来的普通的页面是scale=1的，当切换到此0.5方案的页面时354以下的webkit会有缩放的过程。
         */
        //android

        var matches = navigator.userAgent.match(/Android[\S\s]+AppleWebkit\/?(\d{3})/i);
       //if(!matches || matches && matches[1] > 534) {
         if(!matches || matches && matches[1] > 537) {
            //nexus chrome 一些不支持target-densitydpi属性的现代机型，后面的initial-scale=scale依然有效作用
            metaEl.setAttribute('content', 'target-densitydpi=device-dpi,user-scalable=no,initial-scale=' + scale + ',maximum-scale=' + scale + ', minimum-scale=' + scale);
            
        } else {
            //其他 类似小米2webview webkit版本是534及以下
            dpr = 1;
        }
    }

    // alert(navigator.userAgent);
    // alert(metaEl.getAttribute('content'));
     // alert(docEl.clientWidth);
    
    docEl.firstElementChild.appendChild(fontEl);
    docEl.setAttribute('data-dpr', dpr);

    function setUnitA(){
        var docWidth = docEl.clientWidth;
        var extraStyle = '}';

        //如果是pc pc上宽度一般是1024以上 ipad的分辨率宽度1024 ipad就让其满屏显示 其余pc上显示640居中
        if(!navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i) && docWidth > 1024) {
            docWidth = 640;
            //仅pc下body为640 且居中
            extraStyle = ';max-width:'+ docWidth + 'px;margin-right:auto!important;margin-left:auto!important;}';
        }
        win.rem = docWidth / 10;

        //ZTE 中兴 ZTE U930_TD/1.0 Linux/2.6.39/Android/4.0Release/3.5.2012 Browser/AppleWebkit534.30
        //老机器bug rem计算不是标准=html fontsize
        if(/ZTE U930_TD/.test(navigator.userAgent)) {
            win.rem = win.rem * 1.13;
        }

        fontEl.innerHTML = 'html{font-size:' + win.rem + 'px!important;}body{font-size:' + 12 * (docWidth / 320) + 'px' + extraStyle;
    }

    win.dpr = dpr;

    win.addEventListener('resize', function() {
        //resize时立刻change,pad上刷屏明显
        setUnitA();
    }, false);


    win.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            setUnitA();
        }
    }, false);
    
    setUnitA();
    
})(window);

