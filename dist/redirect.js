(function(){
    var scriptTag = document.querySelector('script[src*="redirect.js"]');
    var toInclude = scriptTag.attributes.getNamedItem('data-main').value;
    var parts = toInclude.split('/');
    var type = parts[parts.length - 1];
    var widgetFileName = type + '.bundle.js';
    var widgetUrl = window.location.protocol + '//' + window.location.host + '/' + widgetFileName;

    var widgetTag = document.createElement('script');
    widgetTag.setAttribute('src', widgetUrl);
    for(var i = 0; i < scriptTag.attributes.length; i++){
        var attr = scriptTag.attributes[i];
        if(attr.name !== 'data-main' && attr.name !== 'src'){
            widgetTag.setAttribute(attr.name, attr.value);
        }
    }
    console.log(widgetTag.outerHTML);
    scriptTag.insertAdjacentElement('afterEnd', widgetTag);
})();