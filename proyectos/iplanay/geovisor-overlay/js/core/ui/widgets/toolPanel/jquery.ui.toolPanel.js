/* Tooltip unificado MxSIG */
(function ($, window) {
  'use strict';
  if (!$ || !$.fn || !$.fn.tooltip) return;
  window.initMxSigTooltips = window.initMxSigTooltips || function () {
    var $doc = $(document);
    if ($doc.data('mxsigTooltipsReady')) return;
    $doc.data('mxsigTooltipsReady', true).tooltip({
      items: '[data-tooltip]', tooltipClass: 'ui-tooltip-mxsig',
      content: function () { return $(this).attr('data-tooltip') || ''; },
      position: {my: 'right center',at: 'left-14 center',collision: 'flipfit',
        using: function (position, feedback) {
          $(this).css(position).removeClass('tooltip-left tooltip-right')
            .addClass(feedback.horizontal === 'right' ? 'tooltip-left' : 'tooltip-right');
        }
      },
      show: { effect: 'fade', duration: 120 }, hide: { effect: 'fade', duration: 80 }, track: false
    });
  };
  $(window.initMxSigTooltips);
}(jQuery, window));

(function ($) {
  'use strict';

  if (!$ || !$.widget) {
    throw new Error('toolPanel requiere jQuery y jQuery UI Widget Factory.');
  }

  var toolPanelStack = 3000;

  $.widget('custom.toolPanel', {
    options: {
      title: 'Herramienta',
      icon: 'fa-solid fa-screwdriver-wrench',
      width: 338,
      height: 'auto',
      minWidth: 280,
      minHeight: 120,
      maxWidth: null,
      maxHeight: null,
      top: 75,
      left: 85,
      right: null,
      bottom: null,
      appendTo: '#panel-center',
      content: '',
      contentSource: null,
      initiallyOpen: false,
      draggable: true,
      resizable: false,
      minimizable: true,
      closable: true,
      closeOnEscape: true,
      destroySourceOnDestroy: false,
      onOpen: function () {},
      onClose: function () {},
      onMinimize: function () {},
      onRestore: function () {},
      onFocus: function () {},
      beforeClose: function () { return true; }
    },

    _create: function () {
      this.id = this.element.attr('id');
      this._isOpen = false;
      this._isMinimized = false;
      this._source = null;
      this._sourceParent = null;
      this._sourceNext = null;

      if (!this.id) {
        this.id = 'toolPanel_' + new Date().getTime();
        this.element.attr('id', this.id);
      }

      this._build();
      this._setInitialPosition();
      this._bindEvents();
      this._enableInteractions();
      this._loadInitialContent();

      if (this.options.initiallyOpen) {
        this.open();
      } else {
        this.element.hide().attr('aria-hidden', 'true');
      }
    },

    _build: function () {
      var o = this.options;
      var closeButton = o.closable
        ? '<button type="button" class="toolPanel-action toolPanel-close" data-tooltip="Cerrar" aria-label="Cerrar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>'
        : '';
      var minimizeButton = o.minimizable
        ? '<button type="button" class="toolPanel-action toolPanel-minimize" data-tooltip="Minimizar" aria-label="Minimizar"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>'
        : '';

      this.element
        .addClass('custom-toolPanel toolPanel no-print')
        .attr({
          role: 'dialog',
          'aria-modal': 'false',
          'aria-labelledby': this.id + '_title',
          'aria-hidden': 'true',
          'data-tool-panel': this.id
        })
        .css({
          width: this._cssSize(o.width),
          height: this._cssSize(o.height),
          minWidth: this._cssSize(o.minWidth),
          minHeight: this._cssSize(o.minHeight)
        })
        .html(
          '<div class="toolPanel-header">' +
            '<div class="toolPanel-heading">' +
              '<i class="toolPanel-icon ' + this._escapeClass(o.icon) + '" aria-hidden="true"></i>' +
              '<span id="' + this.id + '_title" class="toolPanel-title"></span>' +
            '</div>' +
            '<div class="toolPanel-actions">' + minimizeButton + closeButton + '</div>' +
          '</div>' +
          '<div id="' + this.id + '_body" class="toolPanel-body"></div>' +
          '<div class="toolPanel-resizeStatus" aria-hidden="true"></div>'
        );

      this.header = this.element.children('.toolPanel-header');
      this.body = this.element.children('.toolPanel-body');
      this.titleElement = this.header.find('.toolPanel-title');
      this.iconElement = this.header.find('.toolPanel-icon');
      this.setTitle(o.title);

      if (o.maxWidth !== null) {
        this.element.css('max-width', this._cssSize(o.maxWidth));
      }
      if (o.maxHeight !== null) {
        this.element.css('max-height', this._cssSize(o.maxHeight));
      }

      var $parent = $(o.appendTo).first();
      if (!$parent.length) {
        $parent = $('body');
      }
      this.element.appendTo($parent);
    },

    _setInitialPosition: function () {
      var o = this.options;
      var css = { position: 'absolute' };

      if (o.top !== null) { css.top = this._cssSize(o.top); }
      if (o.left !== null) {
        css.left = this._cssSize(o.left);
        css.right = 'auto';
      } else if (o.right !== null) {
        css.right = this._cssSize(o.right);
        css.left = 'auto';
      }
      if (o.bottom !== null) {
        css.bottom = this._cssSize(o.bottom);
        css.top = 'auto';
      }

      this.element.css(css);
    },

    _bindEvents: function () {
      var obj = this;

      this._on(this.element, {
        'mousedown': function () { obj.focus(); },
        'click .toolPanel-close': function (event) {
          event.preventDefault();
          event.stopPropagation();
          obj.close();
        },
        'click .toolPanel-minimize': function (event) {
          event.preventDefault();
          event.stopPropagation();
          obj.toggleMinimize();
        }
      });

      if (this.options.closeOnEscape) {
        this._keyNamespace = 'keydown.toolPanel_' + this.id;
        $(document).off(this._keyNamespace).on(this._keyNamespace, function (event) {
          if (event.which === 27 && obj.isOpen() && obj.isFocused()) {
            obj.close();
          }
        });
      }
    },

    _enableInteractions: function () {
      var obj = this;
      var o = this.options;

      if (o.draggable && $.fn.draggable) {
        this.element.draggable({
          handle: '.toolPanel-header',
          containment: o.appendTo === 'body' ? 'window' : o.appendTo,
          cancel: '.toolPanel-actions, button, input, select, textarea, a',
          start: function () { obj.focus(); },
          stop: function (event, ui) {
            obj.element.css({ right: 'auto', bottom: 'auto' });
            obj._trigger('move', event, { position: ui.position });
          }
        });
      }

      if (o.resizable && $.fn.resizable) {
        this.element.resizable({
          minWidth: o.minWidth,
          minHeight: o.minHeight,
          maxWidth: o.maxWidth || null,
          maxHeight: o.maxHeight || null,
          handles: 'n,e,s,w,se,sw,ne,nw',
          start: function () { obj.focus(); },
          resize: function (event, ui) {
            obj._trigger('resize', event, { size: ui.size });
          }
        });
      }
    },

    _loadInitialContent: function () {
      if (this.options.contentSource) {
        this.adopt(this.options.contentSource);
      } else if (this.options.content !== '') {
        this.setContent(this.options.content);
      }
    },

    adopt: function (source) {
      var $source = source && source.jquery ? source : $(source).first();
      if (!$source.length) {
        return false;
      }
      if (this._source && this._source[0] !== $source[0]) {
        this.release();
      }

      this._source = $source;
      this._sourceParent = $source.parent();
      this._sourceNext = $source.next();
      $source.detach().appendTo(this.body).show();
      this.body.attr('data-adopted-source', $source.attr('id') || '');
      return true;
    },

    release: function () {
      if (!this._source || !this._source.length) {
        return false;
      }

      if (this._sourceNext && this._sourceNext.length && $.contains(document, this._sourceNext[0])) {
        this._source.insertBefore(this._sourceNext);
      } else if (this._sourceParent && this._sourceParent.length) {
        this._source.appendTo(this._sourceParent);
      }

      this._source = null;
      this._sourceParent = null;
      this._sourceNext = null;
      this.body.removeAttr('data-adopted-source');
      return true;
    },

    setContent: function (content) {
      if (this._source) {
        this.release();
      }
      this.body.empty().append(content);
      return this;
    },

    getBody: function () {
      return this.body;
    },

    setTitle: function (title) {
      this.options.title = title || '';
      this.titleElement.text(this.options.title);
      return this;
    },

    setIcon: function (icon) {
      this.options.icon = icon || '';
      this.iconElement.attr('class', 'toolPanel-icon ' + this._escapeClass(this.options.icon));
      return this;
    },

    open: function () {
      if (this._isOpen) {
        this.focus();
        return this;
      }

      this._isOpen = true;
      this.element
        .stop(true, true)
        .attr('aria-hidden', 'false')
        .fadeIn(140);
      this.focus();
      this._trigger('open');
      this.options.onOpen.call(this.element[0], this);
      return this;
    },

    close: function () {
      if (!this._isOpen) {
        return this;
      }
      if (this.options.beforeClose.call(this.element[0], this) === false) {
        return this;
      }

      this._isOpen = false;
      this.element
        .stop(true, true)
        .fadeOut(120, function () { $(this).attr('aria-hidden', 'true'); });
      this._trigger('close');
      this.options.onClose.call(this.element[0], this);
      return this;
    },

    toggle: function () {
      return this.isOpen() ? this.close() : this.open();
    },

    minimize: function () {
      if (this._isMinimized || !this.options.minimizable) {
        return this;
      }
      this._isMinimized = true;
      this.body.stop(true, true).slideUp(120);
      this.element.addClass('toolPanel-minimized');
      this.header.find('.toolPanel-minimize')
        .attr({ 'data-tooltip': 'Restaurar', 'aria-label': 'Restaurar' }).removeAttr('title')
        .find('i')
        .attr('class', 'fa-solid fa-window-restore');
      this._trigger('minimize');
      this.options.onMinimize.call(this.element[0], this);
      return this;
    },

    restore: function () {
      if (!this._isMinimized) {
        return this;
      }
      this._isMinimized = false;
      this.body.stop(true, true).slideDown(120);
      this.element.removeClass('toolPanel-minimized');
      this.header.find('.toolPanel-minimize')
        .attr({ 'data-tooltip': 'Minimizar', 'aria-label': 'Minimizar' }).removeAttr('title')
        .find('i')
        .attr('class', 'fa-solid fa-minus');
      this._trigger('restore');
      this.options.onRestore.call(this.element[0], this);
      return this;
    },

    toggleMinimize: function () {
      return this._isMinimized ? this.restore() : this.minimize();
    },

    focus: function () {
      $('.custom-toolPanel').removeClass('toolPanel-focused');
      toolPanelStack += 1;
      this.element.addClass('toolPanel-focused').css('z-index', toolPanelStack);
      this._trigger('focus');
      this.options.onFocus.call(this.element[0], this);
      return this;
    },

    isFocused: function () {
      return this.element.hasClass('toolPanel-focused');
    },

    isOpen: function () {
      return this._isOpen && this.element.is(':visible');
    },

    isMinimized: function () {
      return this._isMinimized;
    },

    _cssSize: function (value) {
      if (value === null || value === undefined || value === 'auto') {
        return value;
      }
      return typeof value === 'number' ? value + 'px' : value;
    },

    _escapeClass: function (value) {
      return String(value || '').replace(/[^a-zA-Z0-9_\- ]/g, '');
    },

    _setOption: function (key, value) {
      this._super(key, value);
      if (key === 'title') { this.setTitle(value); }
      if (key === 'icon') { this.setIcon(value); }
      if (key === 'width' || key === 'height') {
        this.element.css(key, this._cssSize(value));
      }
    },

    _destroy: function () {
      $(document).off('keydown.toolPanel_' + this.id);

      if (this._source && !this.options.destroySourceOnDestroy) {
        this.release();
      }

      if ($.fn.draggable && this.element.hasClass('ui-draggable')) {
        this.element.draggable('destroy');
      }
      if ($.fn.resizable && this.element.hasClass('ui-resizable')) {
        this.element.resizable('destroy');
      }

      this.element
        .stop(true, true)
        .removeClass('custom-toolPanel toolPanel toolPanel-focused toolPanel-minimized no-print')
        .removeAttr('role aria-modal aria-labelledby aria-hidden data-tool-panel style')
        .empty();
    }
  });
}(jQuery));
