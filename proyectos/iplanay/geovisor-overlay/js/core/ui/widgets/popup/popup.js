(function ($) {
  'use strict';

  $.widget('custom.Popup', {
    id: 'customPopup',
    padding: 16,
    gap: 10,
    arrowSize: 10,

    options: {
      viewOrder: ['right-top', 'left-top', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'right-bottom', 'left-bottom'],
      root: 'body',
      divLimiter: '#map',
      showOn: 'now', // now | click | onclick | over | hover | focus | manual
      time: null,
      showDelay: 120,
      hideDelay: 100,
      iconClose: true,
      highlight: false,
      content: 'Sin contenido',
      cssClass: '',
      maxWidth: 320,
      closeOnEscape: true,
      closeOnOutsideClick: false,
      followTarget: true,
      events: {
        onShow: $.noop,
        onHide: $.noop,
        onCreate: $.noop
      }
    },

    _create: function () {
      this._showTimer = null;
      this._hideTimer = null;
      this._autoHideTimer = null;
      this._namespace = '.customPopup_' + this.uuid;
      this._buildCloud();
      this._bindPopupEvents();
      this.reposition();

      if (this.options.showOn === 'now') {
        this.show();
      }
      this.options.events.onCreate.call(this.element[0], this.popup);
    },

    _buildCloud: function () {
      var parentId = this.element.attr('id') || ('target_' + this.uuid);
      this._id = this.id + '_' + parentId;

      $('#' + this._id).remove();
      this.popup = $('<div/>', {
        id: this._id,
        'class': 'customPopup ' + (this.options.cssClass || ''),
        role: 'tooltip',
        'aria-hidden': 'true'
      }).css('max-width', this.options.maxWidth + 'px');

      if (this.options.iconClose) {
        this.closeButton = $('<button/>', {
          type: 'button',
          'class': 'close',
          title: 'Cerrar',
          'aria-label': 'Cerrar'
        }).html('&times;').appendTo(this.popup);
      }

      this.content = $('<div/>', {'class': 'content'}).html(this.options.content).appendTo(this.popup);
      $(this.options.root).append(this.popup);
      this.element.attr('aria-describedby', this._id);
    },

    _bindPopupEvents: function () {
      var obj = this;
      var mode = this.options.showOn;

      if (this.closeButton) {
        this.closeButton.on('click' + this._namespace, function (event) {
          event.preventDefault();
          event.stopPropagation();
          obj.hide();
        });
      }

      if (mode === 'click' || mode === 'onclick') {
        this.element.on('click' + this._namespace, function (event) {
          event.preventDefault();
          event.stopPropagation();
          obj.toggle();
        });
      } else if (mode === 'over' || mode === 'hover') {
        this.element
          .on('mouseenter' + this._namespace + ' focusin' + this._namespace, function () { obj._scheduleShow(); })
          .on('mouseleave' + this._namespace + ' focusout' + this._namespace, function () { obj._scheduleHide(); });
        this.popup
          .on('mouseenter' + this._namespace, function () { obj._clearHideTimer(); })
          .on('mouseleave' + this._namespace, function () { obj._scheduleHide(); });
      } else if (mode === 'focus') {
        this.element
          .on('focusin' + this._namespace, function () { obj.show(); })
          .on('focusout' + this._namespace, function () { obj.hide(); });
      }

      $(window).on('resize' + this._namespace + ' scroll' + this._namespace, function () {
        if (obj.options.followTarget && obj.isOpen()) {
          obj.reposition();
        }
      });

      $(document).on('keydown' + this._namespace, function (event) {
        if (obj.options.closeOnEscape && event.key === 'Escape') {
          obj.hide();
        }
      });

      if (this.options.closeOnOutsideClick) {
        $(document).on('mousedown' + this._namespace, function (event) {
          if (!obj.popup.is(event.target) && !obj.popup.has(event.target).length &&
              !obj.element.is(event.target) && !obj.element.has(event.target).length) {
            obj.hide();
          }
        });
      }
    },

    _scheduleShow: function () {
      var obj = this;
      clearTimeout(this._hideTimer);
      clearTimeout(this._showTimer);
      this._showTimer = setTimeout(function () { obj.show(); }, this.options.showDelay);
    },

    _scheduleHide: function () {
      var obj = this;
      clearTimeout(this._showTimer);
      clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(function () { obj.hide(); }, this.options.hideDelay);
    },

    _clearHideTimer: function () {
      clearTimeout(this._hideTimer);
    },

    updateContent: function (content) {
      this.options.content = content;
      this.content.html(content);
      this.reposition();
      if (this.options.showOn === 'now') {
        this.show();
      }
      return this;
    },

    _getLimits: function () {
      var $limiter = $(this.options.divLimiter);
      if (!$limiter.length) {
        return {left: 0, top: 0, right: $(window).width(), bottom: $(window).height()};
      }
      var offset = $limiter.offset();
      return {
        left: offset.left,
        top: offset.top,
        right: offset.left + $limiter.outerWidth(),
        bottom: offset.top + $limiter.outerHeight()
      };
    },

    _candidate: function (position, target, popup) {
      var gap = this.gap;
      var left = target.left;
      var top = target.top;

      switch (position) {
        case 'top-left':
          left = target.left;
          top = target.top - popup.height - gap;
          break;
        case 'top-right':
          left = target.right - popup.width;
          top = target.top - popup.height - gap;
          break;
        case 'bottom-left':
          left = target.left;
          top = target.bottom + gap;
          break;
        case 'bottom-right':
          left = target.right - popup.width;
          top = target.bottom + gap;
          break;
        case 'right-top':
          left = target.right + gap;
          top = target.top;
          break;
        case 'right-bottom':
          left = target.right + gap;
          top = target.bottom - popup.height;
          break;
        case 'left-top':
          left = target.left - popup.width - gap;
          top = target.top;
          break;
        case 'left-bottom':
          left = target.left - popup.width - gap;
          top = target.bottom - popup.height;
          break;
      }
      return {left: left, top: top, position: position};
    },

    reposition: function () {
      if (!this.popup || !this.element.is(':visible')) return this;

      var offset = this.element.offset();
      var target = {
        left: offset.left,
        top: offset.top,
        right: offset.left + this.element.outerWidth(),
        bottom: offset.top + this.element.outerHeight()
      };
      var popup = {
        width: this.popup.outerWidth(),
        height: this.popup.outerHeight()
      };
      var limits = this._getLimits();
      var chosen = null;

      for (var i = 0; i < this.options.viewOrder.length; i++) {
        var candidate = this._candidate(this.options.viewOrder[i], target, popup);
        if (candidate.left >= limits.left + this.padding &&
            candidate.top >= limits.top + this.padding &&
            candidate.left + popup.width <= limits.right - this.padding &&
            candidate.top + popup.height <= limits.bottom - this.padding) {
          chosen = candidate;
          break;
        }
      }

      if (!chosen) {
        chosen = this._candidate(this.options.viewOrder[0], target, popup);
        chosen.left = Math.max(limits.left + this.padding,
          Math.min(chosen.left, limits.right - popup.width - this.padding));
        chosen.top = Math.max(limits.top + this.padding,
          Math.min(chosen.top, limits.bottom - popup.height - this.padding));
      }

      this.popup
        .removeClass('top-left top-right bottom-left bottom-right right-top right-bottom left-top left-bottom none')
        .addClass(chosen.position)
        .css({left: Math.round(chosen.left), top: Math.round(chosen.top)});
      return this;
    },

    show: function () {
      var obj = this;
      clearTimeout(this._autoHideTimer);
      this.reposition();
      this.popup.stop(true, true).fadeIn(120).attr('aria-hidden', 'false');
      if (this.options.highlight) this.popup.addClass('Blinker');
      this.options.events.onShow.call(this.element[0], this.popup);
      if (this.options.time) {
        this._autoHideTimer = setTimeout(function () { obj.hide(); }, this.options.time);
      }
      return this;
    },

    hide: function () {
      clearTimeout(this._autoHideTimer);
      if (!this.popup) return this;
      this.popup.stop(true, true).fadeOut(100).attr('aria-hidden', 'true').removeClass('Blinker');
      this.options.events.onHide.call(this.element[0], this.popup);
      return this;
    },

    toggle: function () {
      return this.isOpen() ? this.hide() : this.show();
    },

    isOpen: function () {
      return !!(this.popup && this.popup.is(':visible'));
    },

    _setOption: function (key, value) {
      this._super(key, value);
      if (key === 'content') this.updateContent(value);
      if (key === 'maxWidth' && this.popup) this.popup.css('max-width', value + 'px');
      return this;
    },

    _destroy: function () {
      clearTimeout(this._showTimer);
      clearTimeout(this._hideTimer);
      clearTimeout(this._autoHideTimer);
      this.element.off(this._namespace).removeAttr('aria-describedby');
      $(window).off(this._namespace);
      $(document).off(this._namespace);
      if (this.popup) this.popup.off(this._namespace).remove();
    }
  });
})(jQuery);
