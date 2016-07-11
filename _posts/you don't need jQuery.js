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

