(function ($) {
  'use strict';

  $.widget('custom.objectInfoPanel', {
    options: {
      title: 'Información del objeto',
      icon: 'fa-solid fa-circle-info',
      width: 520,
      top: 75,
      right: 18,
      endpoint: '/mdmservices/objectinfo/municipio',
      method: 'POST',
      contentType: 'application/json; charset=UTF-8',
      dataType: 'json',
      dataProvider: null,
      initiallyOpen: false,
      modules: ['general', 'demografia'],
      onOpen: function () {},
      onClose: function () {},
      onLoad: function () {},
      onError: function () {}
    },

    _create: function () {
      this.state = {
        context: null,
        data: null,
        activeModule: 'general'
      };

      this._createShell();
      this._bindEvents();
    },

    _createShell: function () {
      var obj = this;
      var id = obj.element.attr('id') || ('objectInfoPanel_' + Date.now());
      obj.element.attr('id', id).addClass('objectInfoPanel-host');

      if ($.fn.toolPanel) {
        obj.element.toolPanel({
          title: obj.options.title,
          icon: obj.options.icon,
          width: obj.options.width,
          top: obj.options.top,
          right: obj.options.right,
          initiallyOpen: obj.options.initiallyOpen,
          draggable: true,
          resizable: true,
          onClose: function () { obj.options.onClose(obj.state.context); }
        });
        obj.$body = obj.element.toolPanel('getBody');
      } else {
        obj.element.addClass('objectInfoPanel-fallback');
        obj.$body = $('<div class="objectInfoPanel-fallbackBody"></div>').appendTo(obj.element);
      }

      obj.$body.html(
        '<div class="objectInfoPanel">' +
          '<header class="objectInfoPanel-summary">' +
            '<div class="objectInfoPanel-summaryIcon"><i class="fa-solid fa-location-dot"></i></div>' +
            '<div class="objectInfoPanel-summaryText">' +
              '<div class="objectInfoPanel-title">Seleccione un municipio</div>' +
              '<div class="objectInfoPanel-subtitle">La ficha se actualizará con la identificación del mapa.</div>' +
            '</div>' +
          '</header>' +
          '<nav class="objectInfoPanel-tabs" role="tablist"></nav>' +
          '<main class="objectInfoPanel-content"></main>' +
        '</div>'
      );

      obj.$panel = obj.$body.find('.objectInfoPanel');
      obj.$tabs = obj.$panel.find('.objectInfoPanel-tabs');
      obj.$content = obj.$panel.find('.objectInfoPanel-content');
      obj.$title = obj.$panel.find('.objectInfoPanel-title');
      obj.$subtitle = obj.$panel.find('.objectInfoPanel-subtitle');
      obj._renderTabs();
      obj._renderEmpty();
    },

    _renderTabs: function () {
      var obj = this;
      var definitions = {
        general: { label: 'General', icon: 'fa-solid fa-circle-info' },
        demografia: { label: 'Demografía', icon: 'fa-solid fa-users' },
        vivienda: { label: 'Vivienda', icon: 'fa-solid fa-house' },
        educacion: { label: 'Educación', icon: 'fa-solid fa-graduation-cap' },
        economia: { label: 'Economía', icon: 'fa-solid fa-chart-line' },
        documentos: { label: 'Documentos', icon: 'fa-solid fa-file-arrow-down' }
      };
      var html = '';

      $.each(obj.options.modules, function (_, key) {
        var item = definitions[key];
        if (!item) return;
        html += '<button type="button" class="objectInfoPanel-tab" data-module="' + key + '" role="tab">';
        html += '<i class="' + item.icon + '"></i><span>' + item.label + '</span></button>';
      });
      obj.$tabs.html(html);
      obj._activateTab(obj.state.activeModule);
    },

    _bindEvents: function () {
      var obj = this;
      obj.$tabs.on('click.objectInfoPanel', '.objectInfoPanel-tab', function () {
        obj.showModule($(this).data('module'));
      });
    },

    _activateTab: function (module) {
      this.$tabs.find('.objectInfoPanel-tab').removeClass('is-active').attr('aria-selected', 'false');
      this.$tabs.find('[data-module="' + module + '"]').addClass('is-active').attr('aria-selected', 'true');
    },

    openFor: function (context) {
      context = context || {};
      if (!context.cvegeo) {
        this._renderError('No se recibió la clave geoestadística del objeto identificado.');
        this.open();
        return;
      }

      this.state.context = {
        cvegeo: String(context.cvegeo),
        layer: context.layer || context.table || '',
        id: context.id || '',
        geometry: context.geometry || null,
        title: context.title || ''
      };

      this.open();
      this.load(this.state.context);
    },

    open: function () {
      if ($.fn.toolPanel && this.element.data('custom-toolPanel')) {
        this.element.toolPanel('restore');
        this.element.toolPanel('open');
      } else {
        this.element.show();
      }
      this.options.onOpen(this.state.context);
    },

    close: function () {
      if ($.fn.toolPanel && this.element.data('custom-toolPanel')) {
        this.element.toolPanel('close');
      } else {
        this.element.hide();
      }
    },

    load: function (context) {
      var obj = this;
      obj._renderLoading();

      var done = function (response) {
        var normalized = obj._normalizeResponse(response);
        if (!normalized) {
          obj._renderError('El servicio respondió, pero no entregó una ficha válida.');
          return;
        }
        obj.state.data = normalized;
        obj.$title.text(normalized.general.nombre || context.title || 'Objeto identificado');
        obj.$subtitle.text(normalized.general.tipo + ' · CVEGEO ' + normalized.general.cvegeo);
        obj.showModule(obj.state.activeModule);
        obj.options.onLoad(normalized, context);
      };

      var fail = function (xhr) {
        var message = 'No fue posible consultar la ficha municipal.';
        if (xhr && xhr.status === 405) {
          message = 'El servicio rechazó el método HTTP. Revise que el endpoint acepte ' + obj.options.method + '.';
        }
        obj._renderError(message);
        obj.options.onError(xhr, context);
      };

      if ($.isFunction(obj.options.dataProvider)) {
        var result = obj.options.dataProvider(context, done, fail);
        if (result && $.isFunction(result.then)) result.then(done).catch(fail);
        return;
      }

      $.ajax({
        url: obj.options.endpoint,
        method: obj.options.method,
        contentType: obj.options.contentType,
        dataType: obj.options.dataType,
        data: JSON.stringify({ cvegeo: context.cvegeo })
      }).done(done).fail(fail);
    },

    _normalizeResponse: function (response) {
      var data = response && response.data ? response.data : response;
      if (!data) return null;

      var row = data.municipio || data.demografia || data;
      var number = function (value) {
        if (value === null || value === undefined || value === '' || value === '*') return null;
        var parsed = Number(value);
        return isNaN(parsed) ? null : parsed;
      };

      return {
        general: {
          cvegeo: String(row.cvegeo || ''),
          nombre: row.nom_mun || row.nombre || '',
          entidad: row.nom_ent || row.entidad_nombre || 'Nayarit',
          municipio: row.mun || '',
          tipo: row.tipo || 'Municipio'
        },
        demografia: {
          pobtot: number(row.pobtot),
          pobfem: number(row.pobfem),
          pobmas: number(row.pobmas),
          rel_h_m: number(row.rel_h_m),
          pob0_14: number(row.pob0_14),
          pob15_64: number(row.pob15_64),
          pob65_mas: number(row.pob65_mas),
          p3ym_hli: number(row.p3ym_hli),
          pob_afro: number(row.pob_afro),
          pcon_disc: number(row.pcon_disc),
          graproes: number(row.graproes),
          pea: number(row.pea),
          pocupada: number(row.pocupada),
          pdesocup: number(row.pdesocup)
        },
        vivienda: {
          vivtot: number(row.vivtot),
          tvivhab: number(row.tvivhab),
          vivpar_hab: number(row.vivpar_hab),
          electricidad: number(row.vph_c_elec),
          agua: number(row.vph_aguadv),
          drenaje: number(row.vph_drenaj),
          internet: number(row.vph_inter)
        },
        raw: row
      };
    },

    showModule: function (module) {
      this.state.activeModule = module;
      this._activateTab(module);

      if (!this.state.data) {
        this._renderEmpty();
        return;
      }

      switch (module) {
        case 'general': this._renderGeneral(); break;
        case 'demografia': this._renderDemografia(); break;
        case 'vivienda': this._renderVivienda(); break;
        default: this._renderPending(module); break;
      }
    },

    _format: function (value, decimals) {
      if (value === null || value === undefined) return 'No disponible';
      return Number(value).toLocaleString('es-MX', {
        minimumFractionDigits: decimals || 0,
        maximumFractionDigits: decimals || 0
      });
    },

    _card: function (label, value, icon, accent, decimals) {
      return '<article class="objectInfoPanel-card" style="--object-accent:' + accent + '">' +
        '<i class="' + icon + '"></i><div><span>' + label + '</span>' +
        '<strong>' + this._format(value, decimals) + '</strong></div></article>';
    },

    _renderGeneral: function () {
      var g = this.state.data.general;
      this.$content.html(
        '<section class="objectInfoPanel-section">' +
          '<h3>Identificación geográfica</h3>' +
          '<dl class="objectInfoPanel-definition">' +
            '<div><dt>Tipo</dt><dd>' + g.tipo + '</dd></div>' +
            '<div><dt>Municipio</dt><dd>' + g.nombre + '</dd></div>' +
            '<div><dt>Clave geoestadística</dt><dd>' + g.cvegeo + '</dd></div>' +
            '<div><dt>Entidad</dt><dd>' + g.entidad + '</dd></div>' +
          '</dl>' +
        '</section>'
      );
    },

    _renderDemografia: function () {
      var d = this.state.data.demografia;
      var totalEdad = (d.pob0_14 || 0) + (d.pob15_64 || 0) + (d.pob65_mas || 0);
      var bar = function (label, value, total, color) {
        var pct = total > 0 && value !== null ? Math.max(0, Math.min(100, value * 100 / total)) : 0;
        return '<div class="objectInfoPanel-barRow"><div><span>' + label + '</span><b>' + (value === null ? 'No disponible' : Number(value).toLocaleString('es-MX')) + '</b></div>' +
          '<div class="objectInfoPanel-bar"><span style="width:' + pct.toFixed(2) + '%;background:' + color + '"></span></div></div>';
      };

      this.$content.html(
        '<section class="objectInfoPanel-section">' +
          '<h3>Resumen de población</h3>' +
          '<div class="objectInfoPanel-cardGrid">' +
            this._card('Población total', d.pobtot, 'fa-solid fa-users', '#468197') +
            this._card('Mujeres', d.pobfem, 'fa-solid fa-person', '#9a6fa6') +
            this._card('Hombres', d.pobmas, 'fa-solid fa-person', '#4f86b8') +
            this._card('Relación H-M', d.rel_h_m, 'fa-solid fa-scale-balanced', '#64748b', 2) +
          '</div>' +
        '</section>' +
        '<section class="objectInfoPanel-section">' +
          '<h3>Grandes grupos de edad</h3>' +
          bar('0 a 14 años', d.pob0_14, totalEdad, '#5eb1cf') +
          bar('15 a 64 años', d.pob15_64, totalEdad, '#468197') +
          bar('65 años y más', d.pob65_mas, totalEdad, '#7d8f96') +
        '</section>' +
        '<section class="objectInfoPanel-section">' +
          '<h3>Indicadores complementarios</h3>' +
          '<div class="objectInfoPanel-cardGrid objectInfoPanel-cardGrid--compact">' +
            this._card('Lengua indígena', d.p3ym_hli, 'fa-solid fa-language', '#448a70') +
            this._card('Afrodescendencia', d.pob_afro, 'fa-solid fa-people-group', '#795a96') +
            this._card('Con discapacidad', d.pcon_disc, 'fa-solid fa-universal-access', '#a88132') +
            this._card('Escolaridad promedio', d.graproes, 'fa-solid fa-graduation-cap', '#3976b9', 2) +
            this._card('PEA', d.pea, 'fa-solid fa-briefcase', '#5d7f54') +
            this._card('Población ocupada', d.pocupada, 'fa-solid fa-user-check', '#448a70') +
            this._card('Población desocupada', d.pdesocup, 'fa-solid fa-user-clock', '#a34f55') +
          '</div>' +
        '</section>'
      );
    },

    _renderVivienda: function () {
      var v = this.state.data.vivienda;
      this.$content.html(
        '<section class="objectInfoPanel-section"><h3>Vivienda y servicios</h3>' +
        '<div class="objectInfoPanel-cardGrid">' +
          this._card('Viviendas totales', v.vivtot, 'fa-solid fa-house', '#468197') +
          this._card('Viviendas habitadas', v.tvivhab, 'fa-solid fa-house-user', '#448a70') +
          this._card('Particulares habitadas', v.vivpar_hab, 'fa-solid fa-people-roof', '#64748b') +
          this._card('Con electricidad', v.electricidad, 'fa-solid fa-bolt', '#c08a29') +
          this._card('Con agua', v.agua, 'fa-solid fa-droplet', '#3976b9') +
          this._card('Con drenaje', v.drenaje, 'fa-solid fa-faucet-drip', '#5b8d94') +
          this._card('Con internet', v.internet, 'fa-solid fa-wifi', '#795a96') +
        '</div></section>'
      );
    },

    _renderLoading: function () {
      this.$content.html('<div class="objectInfoPanel-state"><span class="objectInfoPanel-spinner"></span><b>Consultando información...</b></div>');
    },

    _renderEmpty: function () {
      this.$content.html('<div class="objectInfoPanel-state"><i class="fa-solid fa-arrow-pointer"></i><b>Identifique un municipio en el mapa</b><span>La información general y demográfica aparecerá aquí.</span></div>');
    },

    _renderError: function (message) {
      this.$content.html('<div class="objectInfoPanel-state objectInfoPanel-state--error"><i class="fa-solid fa-triangle-exclamation"></i><b>Error de consulta</b><span>' + $('<div/>').text(message).html() + '</span></div>');
    },

    _renderPending: function (module) {
      this.$content.html('<div class="objectInfoPanel-state"><i class="fa-solid fa-screwdriver-wrench"></i><b>Módulo preparado</b><span>La sección ' + $('<div/>').text(module).html() + ' se puede habilitar al incorporar su fuente de datos.</span></div>');
    }
  });
})(jQuery);
