(function (window, $) {
  'use strict';
  var modules = {};
  var templates = {};
  function normalize(value) {
    return $.trim(String(value || 'default')).toLowerCase()
      .replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e')
      .replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o')
      .replace(/[úùüû]/g,'u').replace(/ñ/g,'n').replace(/[\s-]+/g,'_');
  }
  function templateUrl(type, context, module) {
    return (context.templateBaseUrl || 'fichas/') + type + '/' + (module.template || ('ficha.' + type + '.html'));
  }
  var api = {
    register: function (type, module) {
      type = normalize(type);
      if (!module || !$.isFunction(module.render)) throw new Error('Ficha invalida: ' + type);
      modules[type] = module;
    },
    exists: function (type) { return !!modules[normalize(type)]; },
    loadTemplate: function (type, context, module) {
      type = normalize(type);
      if (templates[type]) return $.Deferred().resolve(templates[type]).promise();
      return $.ajax({url: templateUrl(type, context, module), dataType:'html', cache:true})
        .then(function (html) { templates[type] = html; return html; });
    },
    render: function (type, context) {
      type = normalize(type);
      var module = modules[type] || modules.default;
      if (!module) {
        if (window.console && console.error) console.error('[dinamicPanel] Ficha no registrada:', type);
        return;
      }
      context.type = type;
      /* La ficha no debe depender de que la plantilla HTML responda antes de
         transformar el detalle. Se renderiza con plantilla vacia como respaldo;
         si el HTML existe se utiliza, pero un 404 nunca deja la cuadricula generica. */
      this.loadTemplate(type, context, module)
        .done(function (html) { module.render(context, html || ''); })
        .fail(function () {
          if (window.console && console.warn) console.warn('[dinamicPanel] Plantilla no disponible; se usa el renderizador JS:', type);
          module.render(context, '');
        });
    },
    destroy: function (type, context) {
      var module=modules[normalize(type)] || modules.default;
      if (module && $.isFunction(module.destroy)) module.destroy(context);
    }
  };
  window.DinamicPanelFichaRegistry = api;
})(window, jQuery);
