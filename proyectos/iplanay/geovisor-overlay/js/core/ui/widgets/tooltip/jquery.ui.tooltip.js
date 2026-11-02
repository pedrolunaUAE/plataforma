(function ($) {
  'use strict';

  function cleanMxSigTooltip() {
    $('.ui-tooltip.ui-tooltip-mxsig').each(function () {
      var $tooltip = $(this);
      $tooltip.stop(true, true).css('opacity', '1');
      $tooltip.children('.bottom, .top, .left, .right, .center').remove();
    });
  }

  $(document)
    .off('tooltipopen.mxsigFix')
    .on('tooltipopen.mxsigFix', function () {
      cleanMxSigTooltip();
      window.setTimeout(cleanMxSigTooltip, 0);
    });

  $(cleanMxSigTooltip);
}(jQuery));
