(function (window, $) {
  'use strict';

  function normalize(value) {
    value = $.trim(String(value || '')).toLowerCase();
    if (value.normalize) {
      value = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return value.replace(/[\s-]+/g, '_');
  }

  function plainValue(value) {
    if (value === null || value === undefined) return '';
    return $.trim($('<div>').html(String(value)).text());
  }

  function parseJson(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(plainValue(value));
    } catch (error) {
      if (window.console && console.error) {
        console.error('[ficha.selector] JSON invalido', error);
      }
      return null;
    }
  }

  function indexFields(data, $source) {
    var fields = {};

    $.each((data && data.list) || [], function (_, item) {
      var field = normalize(
        item.field || item.nameField || item.mnemonic || item.nemonico || item.name
      );
      if (field) fields[field] = plainValue(item.value);
    });

    $source.children('.dinamicPanel-detailList-item').each(function () {
      var $item = $(this);
      var field = normalize($item.attr('data-field'));
      var alias = normalize($item.find('strong').first().text());
      var value = plainValue(
        $item.find('label').first().html() ||
        $item.clone().children('strong').remove().text()
      );

      if (field) fields[field] = value;
      if (alias) fields[alias] = value;
    });

    return fields;
  }

  function resolvePayload(context, $source) {
    var data = context.data || {};
    var candidates = [
      data.fichas_json,
      data.fichasJson,
      data.selector_json,
      data.selectorJson
    ];
    var fields = indexFields(data, $source);

    candidates.push(
      fields.fichas_json,
      fields.fichasjson,
      fields.selector_json,
      fields.selectorjson
    );

    for (var i = 0; i < candidates.length; i += 1) {
      var parsed = parseJson(candidates[i]);
      if (parsed && parsed.modulo === 'selector') return parsed;
    }

    return null;
  }

  function levelLabel(value) {
    var labels = {
      municipio: 'Municipio',
      localidad_urbana: 'Localidad urbana',
      localidad_rural: 'Localidad rural',
      ageb_urbana: 'AGEB urbana',
      colonia: 'Colonia',
      manzana: 'Manzana'
    };

    return labels[normalize(value)] || plainValue(value) || 'Area geografica';
  }

  function optionIcon(type, configuredIcon) {
    if (configuredIcon) return configuredIcon;

    var icons = {
      estadistico: 'fa-chart-column',
      seguridad: 'fa-shield-halved',
      obra_publica: 'fa-person-digging',
      ambiental: 'fa-leaf'
    };

    return icons[normalize(type)] || 'fa-file-lines';
  }

  function buildOption(option) {
    var type = normalize(option.tipo);
    var available =
      option.disponible !== false &&
      option.id !== null &&
      option.id !== undefined &&
      !!option.tabla;

    var $button = $('<button/>', {
      type: 'button',
      'class': 'dp-selector-option',
      'data-selector-action': 'open',
      'data-type': type,
      'aria-label': 'Abrir ' + plainValue(option.titulo || type),
      disabled: !available
    });

    if (option.color) {
      $button.css('--option-color', String(option.color));
    }

    $button.data('selector-option', option);

    $('<span/>', {'class': 'dp-selector-option-icon'})
      .append(
        $('<i/>', {
          'class': 'fa-solid ' + optionIcon(type, option.icono),
          'aria-hidden': 'true'
        })
      )
      .appendTo($button);

    var $copy = $('<span/>', {'class': 'dp-selector-option-copy'}).appendTo($button);
    $('<strong/>').text(option.titulo || type).appendTo($copy);
    $('<span/>')
      .text(option.descripcion || 'Consultar informacion disponible.')
      .appendTo($copy);

    $('<span/>', {'class': 'dp-selector-option-arrow'})
      .append($('<i/>', {'class': 'fa-solid fa-chevron-right', 'aria-hidden': 'true'}))
      .appendTo($button);

    return $button;
  }

  function resolveOriginId(context, payload, options) {
    var data = context.data || {};
    var direct = parseInt(data.id || data.gid, 10);

    if (isFinite(direct)) return direct;

    if (options && options.length) {
      var optionId = parseInt(options[0].id, 10);
      if (isFinite(optionId)) return optionId;
    }

    return null;
  }
  function selectorTableForLevel(level) {
      var selectorTables = {
          municipio: 'c_selector_municipio',
          localidad_urbana: 'c_selector_localidad',
          localidad: 'c_selector_localidad',
          localidad_rural: 'c_selector_lpr',
          ageb_urbana: 'c_selector_ageb',
          ageb: 'c_selector_ageb',
          colonia: 'c_selector_colonia',
          manzana: 'c_selector_manzana'
      };

      return selectorTables[normalize(level)] || '';
  }
  function openOption(context, option, $view) {
    if (
      !option ||
      option.disponible === false ||
      option.id === null ||
      option.id === undefined ||
      !option.tabla
    ) {
      $view.find('[data-selector-status]')
        .text('La ficha seleccionada no esta disponible.');
      return;
    }

    if (!context.widget || !$.isFunction(context.widget.searchDetail)) {
      $view.find('[data-selector-status]')
        .text('No fue posible abrir la ficha seleccionada.');
      return;
    }

    var fichaId = parseInt(option.id, 10);
    var fichaTabla = $.trim(String(option.tabla || ''));

    if (!isFinite(fichaId) || fichaTabla === '') {
      $view.find('[data-selector-status]')
        .text('La configuracion de la ficha no es valida.');
      return;
    }

    var origin = $view.data('selector-origin') || {};
    if (origin.id !== null && origin.id !== undefined && origin.tabla) {
      context.widget.fichaSelectorOrigen = {
        id: origin.id,
        tabla: origin.tabla,
        area: origin.area || null
      };
    }

    if (window.console && console.log) {
      console.log('[ficha.selector] Abriendo opcion:', {
        tipo: option.tipo,
        panel: option.panel,
        id: fichaId,
        tabla: fichaTabla
      });
      console.log(
        '[ficha.selector] Origen guardado:',
        context.widget.fichaSelectorOrigen
      );
    }

    $view.find('[data-selector-status]')
      .text('Abriendo ' + (option.titulo || 'ficha') + '...');

    context.container.off('.fichaSelector');

    window.setTimeout(function () {
      context.widget.searchDetail(fichaId, fichaTabla);
    }, 0);
  }

  var module = {
    template: 'ficha.selector.html',

    render: function (context, template) {
      var $detail = context.container;
      var $source = $detail.find('.dinamicPanel-detailFieldsGrid').first();
      if (!$source.length) return;

      var payload = resolvePayload(context, $source);
      var $view = $(
        template ||
        '<div class="dp-selector-ficha">' +
          '<div class="dp-selector-empty">' +
            '<p>No se pudo cargar la plantilla del selector.</p>' +
          '</div>' +
        '</div>'
      );

      if (!payload) {
        $view.find('[data-selector-empty]')
          .prop('hidden', false)
          .find('p')
          .text('No se pudo interpretar FICHAS JSON.');
        $source.replaceWith($view);
        return;
      }

      var area = payload.area || {};

      var options = $.isArray(
          payload.opciones
      )
          ? payload.opciones
          : [];

      var originId = resolveOriginId(
          context,
          payload,
          options
      );

      var selectorTable = selectorTableForLevel(
          area.tipo
      );

      $view.attr(
          'data-option-count',
          options.length
      );

      $view.data('selector-origin', {
          id: originId,
          tabla: selectorTable,
          area: area
      });

      if (!selectorTable) {
          console.warn(
              '[ficha.selector] No se encontró tabla de retorno para:',
              area.tipo
          );
      }

      $view.find('[data-selector-title]')
        .text(area.nombre || 'Area seleccionada');
      $view.find('[data-selector-subtitle]')
        .text('Seleccione la ficha que desea consultar');
      $view.find('[data-selector-level]')
        .text(levelLabel(area.tipo));
      $view.find('[data-selector-cvegeo]')
        .text(area.cvegeo || 'No disponible');

      var $list = $view.find('[data-selector-options]').empty();
      $.each(options, function (_, option) {
        $list.append(buildOption(option));
      });

      $view.find('[data-selector-empty]')
        .prop('hidden', options.length > 0);

      $source.replaceWith($view);

      $detail
        .attr('data-selector-option-count', options.length)
        .css({
          height: 'auto',
          minHeight: '0'
        });

      $detail
        .off('.fichaSelector')
        .on(
          'click.fichaSelector',
          '[data-selector-action="open"]',
          function (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            openOption(
              context,
              $(this).data('selector-option'),
              $view
            );

            return false;
          }
        );

      var $footer = $detail.find('.dinamicPanel-detailList-exportTools').first();
      if ($footer.length) $footer.hide();

      var $tools = $detail.find('.dinamicPanel-detailTools');
      if ($tools.length && !$tools.children().length) $tools.remove();
    },

    destroy: function (context) {
      context.container
        .off('.fichaSelector')
        .removeAttr('data-selector-option-count')
        .css({height: '', minHeight: ''});
    }
  };

  window.DinamicPanelFichaRegistry.register('selector', module);
})(window, jQuery);
