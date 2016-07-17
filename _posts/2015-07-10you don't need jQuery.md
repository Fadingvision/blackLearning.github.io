
---
layout: post
title:  "you don't need jQuery"
date:   2015-07-10 14:29:29 +0800
category: "javascript"
tags: [javascript]
---


```js
// jQuery的存在只是为了解决丑陋的API,以及浏览器兼容的问题

/**
 ***********************************
  Selector
 ***********************************
 */
// $('');
document.querySelector('[data-herf]');

// $('').find('somenode');
el.querySelector('somenodes');

// $('el').attr('foo');
// $('el').data('foo');
document.querySelector('el').getAttribute('foo');
document.querySelector('el').getAttribute('data-foo');

// $('el').siblings();
[].filter.call(el.parentNode.children, function(child) {
    return child !== el;
})

// el.prev();
// el.next();
el.previousElementSibling();
el.nextElementSibling();

// $('el').closest('queryString');
function closest(el, selector) {
    // matchesSelector用来匹配dom元素是否匹配某css selector。它为一些高级方法的实现提供了基础支持，比如事件代理，parent, closest等。
    const matchsSelector = el.matchs || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;

    // match start from el itself
    while (el) {
        if(matchsSelector.call(el, selector)) {
            return el
        }else {
            el = el.parentElement;
        }
    }
    return null;
}

/**
 ***********************************
  Form
 ***********************************
 */

 // $('input').val();
 document.querySelector('input').value;

// $(e.currentTarget).index('.radio');
[].indexOf.call(document.querySelectorAll('.radio'), e.currentTarget);


/**
 ***********************************
  Css & Style
 ***********************************
 */

// $el.css('width');
el.style.width;
// or
// 注意：此处为了解决当 style 值为 auto 时，返回 auto 的问题
const win = el.ownerDocument.defaultView;
// null 的意思是不返回伪类元素
win.getComputedStyle(el, null).width;


// $el.css('width', '90px');
el.style.width = '90px';

// $el.addClass('active');
el.classList.add('active');

// $el.removeClass('active');
el.classList.remove('active');

// $el.hasClass(clsName);
el.classList.contains(clsName);


// $el.toggleClass(clsName)
el.classList.toggle(clsName);


// $(window).width();
document.documentElement.clientWidth();

// contains scrollbar's width
window.innerWidth;


// $(document).height()
document.documentElement.scrollHeight;

// $el.height();
// 与 jQuery 一致（一直为 content 区域的高度，不含border和padding）;
function getHeight(el) {
  const styles = this.getComputedStyle(el);
  const height = el.offsetHeight;
  const borderTopWidth = parseFloat(styles.borderTopWidth);
  const borderBottomWidth = parseFloat(styles.borderBottomWidth);
  const paddingTop = parseFloat(styles.paddingTop);
  const paddingBottom = parseFloat(styles.paddingBottom);
  return height - borderBottomWidth - borderTopWidth - paddingTop - paddingBottom;
}


// $('iframe').contents().height();
iframe.contentDocument.documentElement.scrollHeight;


// $el.position();
{
	left: el.offsetLeft,
	top: el.offsetTop
}

// $el.offset();
function getOffset (el) {
  const box = el.getBoundingClientRect();

  return {
    top: box.top + window.pageYOffset - document.documentElement.clientTop,
    left: box.left + window.pageXOffset - document.documentElement.clientLeft
  }
}


// $el.scrollTop
(document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop


/**
 ***********************************
 * DOM Manipulation
 ***********************************
 */

// $el.remove();
el.parentNode.removeChild(el);

// $el.text();
// $el.text(sometext)
el.textContent;
el.textContent = sometext;

// $el.html();
// $el.html(someHtml)
el.innerHTML;
el.innerHTML = someHtml;

// $el.append(htmlString);
var newEl = document.createElement('div');
newEl.innerHTML = htmlString;
el.appendChild(newEl);

// $el.prepend(someNode);
el.insertBefore(someNode, el.firstChild);

// $newEl.insertBefore(el);
// $newEl.insertAfter(el);
el.parentNode.insertBefore(newEl, el);
el.parentNode.insertBefore(newEl, el.nextSibling);

// $el.find(selector).length;
el.querySeletor(selector) !== null;

// $el.empty();
el.innerHTML = '';





/**
 *********************************
 *	Events
 * *******************************
 */

// $el.on(eventName, handler);
el.addEventListener(eventName, handler, false);

// $el.off(eventName, handler);
el.removeEventListener(type, listener, false);

// $el.trigger(eventName, dataObj);
if(window.CustomEvent) {
	const event = new CustomEvent(eventName, dataObj)
}else {
	const event = document.createEvent('CustomEvent');
	event.initCustomEvent('custom-event', true, true, dataObj);
}
el.dispatchEvent(event);

// $(function() {});
function ready(fn) {
    if(document.readyState != 'loading') {
        fn();
    }else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

/**
 *********************************
 *	Utilities
 * *******************************
 */

// $el.isArray(arr);
Array.isArray(arr);

// $.trim(string)
string.trim();

// $.extend({}, defaultOpts, opts);
Object.assign({}, defaultOpts, opts);

Object.prototype.assign = function(out) {
    out = out || {};
    for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];
    if (!obj) continue;
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object')
          out[key] = deepExtend(out[key], obj[key]);
        else
          out[key] = obj[key];
      }
    }
  }
  return out;
}

// $.contains(el, child);
el !== child && el.contains(child);

// $(el).each(function(index, el)) {};
Array.prototype.forEach.call(elements, function(el, i)){};

// $.proxy(fn, context);
fn.bind(context);

// $.now();
Date.now();

// $.type(obj);
Object.prototype.toString.call(obj).replace(/^\[object (.+)\]$/, '$1').toLowerCase();



/**
 *********************************
 *	Ajax(可用fetch库替代)
 * *******************************
 */
// native
ReadyStateDesc = {
    0: 'UNSET',
    1: 'OPENED',
    2: 'HEADERS_RECEIVED',
    3: 'LOADING',
    4: 'DONE'
};


StatusDesc = {
    100: 'Continue 初始的请求已经接受，客户应当继续发送请求的其余部分'
    101: 'Switching Protocols 服务器将遵从客户的请求转换到另外一种协议'
    200: 'OK 一切正常，对GET和POST请求的应答文档跟在后面。'
    201: 'Created 服务器已经创建了文档，Location头给出了它的URL。'
    202: 'Accepted 已经接受请求，但处理尚未完成。'
    203: 'Non-Authoritative Information 文档已经正常地返回，但一些应答头可能不正确，因为使用的是文档的拷贝'
    204: 'No Content 没有新文档，浏览器应该继续显示原来的文档。如果用户定期地刷新页面，而Servlet可以确定用户文档足够新，这个状态代码是很有用的'
    205: 'Reset Content 没有新的内容，但浏览器应该重置它所显示的内容。用来强制浏览器清除表单输入内容'
    206: 'Partial Content 客户发送了一个带有Range头的GET请求，服务器完成了它'
    300: 'Multiple Choices 客户请求的文档可以在多个位置找到，这些位置已经在返回的文档内列出。如果服务器要提出优先选择，则应该在Location应答头指明。'
    301: Moved Permanently 客户请求的文档在其他地方，新的URL在Location头中给出，浏览器应该自动地访问新的URL。
    302: Found 类似于301，但新的URL应该被视为临时性的替代，而不是永久性的。
    303: See Other 类似于301/302，不同之处在于，如果原来的请求是POST，Location头指定的重定向目标文档应该通过GET提取
    304: Not Modified 客户端有缓冲的文档并发出了一个条件性的请求（一般是提供If-Modified-:Since头表示客户只想比指定日期更新的文档）。服务器告诉客户，原来缓冲的文档还可以继续使用。
    305: Use Proxy 客户请求的文档应该通过Location头所指明的代理服务器提取
    307: Temporary Redirect 和302（Found）相同。许多浏览器会错误地响应302应答进行重定向，即使原来的请求是POST，即使它实际上只能在POST请求的应答是303时才:能重定向。由于这个原因，HTTP 1.1新增了307，以便更加清除地区分几个状态代码：当出现303应答时，浏览器可以跟随重定向的GET和POST请求；如果是307应答:，则浏览器只能跟随对GET请求的重定向。
    400: Bad Request 请求出现语法错误。
    401: Unauthorized 客户试图未经授权访问受密码保护的页面。应答中会包含一个WWW-Authenticate头，浏览器据此显示用户名字/:密码对话框，然后在填写合适的Authorization头后再次发出请求。
    403: Forbidden 资源不可用。
    404: Not Found 无法找到指定位置的资源
    405: Method Not Allowed 请求方法（GET、POST、HEAD、Delete、PUT、TRACE等）对指定的资源不适用。
    406: Not Acceptable 指定的资源已经找到，但它的MIME类型和客户在Accpet头中所指定的不兼容
    407: Proxy Authentication Required 类似于401，表示客户必须先经过代理服务器的授权。
    408: Request Timeout 在服务器许可的等待时间内，客户一直没有发出任何请求。客户可以在以后重复同一请求。
    409: Conflict 通常和PUT请求有关。由于请求和资源的当前状态相冲突，因此请求不能成功。
    410: Gone 所请求的文档已经不再可用，而且服务器不知道应该重定向到哪一个地址。它和404的不同在于，返回407表示文档永久地离开了指定的位置，而404表示由于:未知的原因文档不可用。
    411: Length Required 服务器不能处理请求，除非客户发送一个Content-Length头
    412: Precondition Failed 请求头中指定的一些前提条件失败
    413: Request Entity Too Large 目标文档的大小超过服务器当前愿意处理的大小。如果服务器认为自己能够稍后再处理该请求，则应该提供一个Retry-After头
    414: Request URI Too Long URI太长
    416: Requested Range Not Satisfiable 服务器不能满足客户在请求中指定的Range头
    500: Internal Server Error 服务器遇到了意料不到的情况，不能完成客户的请求
    501: Not Implemented 服务器不支持实现请求所需要的功能。例如，客户发出了一个服务器不支持的PUT请求
    502: Bad Gateway 服务器作为网关或者代理时，为了完成请求访问下一个服务器，但该服务器返回了非法的应答
    503: Service Unavailable 服务器由于维护或者负载过重未能应答。例如，Servlet可能在数据库连接池已满的情况下返回503。服务器返回503时可以提供一个Retry-After头
    504: Gateway Timeout 由作为代理或网关的服务器使用，表示不能及时地从远程服务器获得应答
    505: HTTP Version Not Supported 服务器不支持请求中所指明的HTTP版本
}



function Ajax(opts) {
    if(!opts) throw new Error('the parameter can not be empty');
    var defaultOpts = {
        type: 'POST'，
        cache: false,
        async: true
    };

    opts = object.assign(defaultOpts, opts);

    // create the new XMLHttpRequest instance
    var xhr = new XMLHttpRequest();

    // onreadystatechange事件会在请求的过程中多次触发
    xhr.onreadystatechange = function() {
        console.log(ReadyStateDesc[xhr.readyState]);
        var DONE = 4,
            OK = 200;
        if(xhr.readyState === DONE && xhr.status === OK) {
            opts.success(xhr.responeseText);
        }else {
            throw new Error('Error status:' + xhr.status)
        }
    }
    // onload事件只会在请求成功之后触发
    xhr.onload = function(e) {
        // set the respenseType
        // dataType: josn (jquery)
        var xhr = e.target;
        if(xhr.responeseType = 'json') {
            var data = xhr.response;
        }else {
            var data = JSON.parse(xhr.responseText);
        }
    }
    xhr.onerror = function() {
        throw new Error('Error status:' + xhr.status)
    };

    // true表示异步
    if(opts.cache) {
        xhr.open(opts.type, opts.url, opts.async);
    }else{
        // 对 Ajax 请求进行缓存的浏览器特性都快被我们忘记了。例如，IE 就默认是这样。
        // aviod the cache(jQuery 默认清除浏览器缓存。);
        var bustCache = '?' + new Date().getTime();
        xhr.open(opts.type, opts.url + bustCache, true);
    }

    xhr.responeseType = 'json';
    xhr.send(opts.data);

    // set the headers
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
}



/**
 *********************************
 *	effects(用css3动画代替)
 * *******************************
 */

 // $el.fadeIn();
 function fadeIn(el) {
     el.style.opacity = 0;
     var last = +new Date();
     var tick = function() {
         el.style.opacity = +el.style.opacity + (new Date() - last) /400;
         last = +new Date();

         if(+el.style.opacity < 1) {
             (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
         }
     }
     tick();
 }
 ```
