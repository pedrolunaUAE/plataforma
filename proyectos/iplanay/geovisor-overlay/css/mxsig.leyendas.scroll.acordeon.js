(function ($) {
  'use strict';

  var panelSelector =
    '#mdm6DinamicPanel_leyendPanel,' +
    '#mdm6DinamicPanel_rasterLegendPanel';

  var groupTitleSelector =
    '.dinamicPanel-vectorGroupTitle,' +
    '.dinamicPanel-rasterGroupTitle';

  var groupSelector =
    '.dinamicPanel-vectorGroup,' +
    '.dinamicPanel-rasterGroup';

  var groupBodySelector =
    '.dinamicPanel-vectorGroupBody,' +
    '.dinamicPanel-rasterGroupBody';

  var themeTitleSelector =
    '.dinamicPanel-vectorThemeTitle,' +
    '.dinamicPanel-rasterThemeTitle';

  function prepareGroups($root) {
    $root.find(groupTitleSelector).each(function () {
      var $title = $(this);
      var $group = $title.closest(groupSelector);

      if (!$title.children('.dinamicPanel-legendChevron').length) {
        $title.prepend('<span class="dinamicPanel-legendChevron" aria-hidden="true"></span>');
      }

      $group.attr('data-open', 'true');
      $title.attr({
        role: 'button',
        tabindex: '0',
        'aria-expanded': 'true'
      });
    });
  }

  function prepareThemes($root) {
    $root.find(themeTitleSelector).each(function () {
      var $title = $(this);

      if (!$title.children('.dinamicPanel-legendChevron').length) {
        $title.prepend('<span class="dinamicPanel-legendChevron" aria-hidden="true"></span>');
      }

      if (!$title.next().hasClass('dinamicPanel-legendThemeContent')) {
        $title.nextUntil(themeTitleSelector).wrapAll(
          '<div class="dinamicPanel-legendThemeContent"></div>'
        );
      }

      $title.attr({
        role: 'button',
        tabindex: '0',
        'data-open': 'true',
        'aria-expanded': 'true'
      });
    });
  }

  function preparePanel(root) {
    var $root = $(root);
    if (!$root.length) return;
    prepareGroups($root);
    prepareThemes($root);
  }

  function prepareAll() {
    $(panelSelector).each(function () {
      preparePanel(this);
    });
  }

  $(document)
    .off('click.mxsigLegendGroup', groupTitleSelector)
    .on('click.mxsigLegendGroup', groupTitleSelector, function (event) {
      event.preventDefault();
      event.stopPropagation();

      var $title = $(this);
      var $group = $title.closest(groupSelector);
      var $body = $group.children(groupBodySelector);
      var isOpen = $group.attr('data-open') !== 'false';

      $group.attr('data-open', isOpen ? 'false' : 'true');
      $title.attr('aria-expanded', isOpen ? 'false' : 'true');
      $body.stop(true, true)[isOpen ? 'slideUp' : 'slideDown'](160);
    })
    .off('click.mxsigLegendTheme', themeTitleSelector)
    .on('click.mxsigLegendTheme', themeTitleSelector, function (event) {
      event.preventDefault();
      event.stopPropagation();

      var $title = $(this);
      var $content = $title.next('.dinamicPanel-legendThemeContent');
      var isOpen = $title.attr('data-open') !== 'false';

      $title.attr({
        'data-open': isOpen ? 'false' : 'true',
        'aria-expanded': isOpen ? 'false' : 'true'
      });
      $content.stop(true, true)[isOpen ? 'slideUp' : 'slideDown'](150);
    })
    .off('keydown.mxsigLegendAccordion', groupTitleSelector + ',' + themeTitleSelector)
    .on('keydown.mxsigLegendAccordion', groupTitleSelector + ',' + themeTitleSelector, function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        $(this).trigger('click');
      }
    });

  $(function () {
    prepareAll();

    if (window.MutationObserver) {
      var observer = new MutationObserver(function (mutations) {
        $.each(mutations, function (_, mutation) {
          $.each(mutation.addedNodes || [], function (_, node) {
            if (node.nodeType !== 1) return;

            if ($(node).is(panelSelector)) {
              preparePanel(node);
            } else {
              $(node).find(panelSelector).each(function () {
                preparePanel(this);
              });
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  });
})(jQuery);
