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

