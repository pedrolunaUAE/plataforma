(function (window, $) {
  'use strict';

  var THEMES = [
    ['poblacion','Población','fa-users','#8f1738'],
    ['economia','Economía','fa-chart-line','#166534'],
    ['educacion','Educación','fa-graduation-cap','#6d28d9'],
    ['salud','Servicios de salud','fa-heart-pulse','#b91c1c'],
    ['vivienda','Vivienda','fa-house','#b45309'],
    ['hogares','Hogares','fa-people-roof','#0e7490'],
    ['discapacidad','Discapacidad y limitación','fa-universal-access','#7e22ce'],
    ['migracion','Migración','fa-route','#0369a1'],
    ['poblacion_indigena','Población indígena','fa-language','#15803d'],
    ['afromexicana','Población afromexicana','fa-people-group','#92400e'],
    ['situacion_conyugal','Situación conyugal','fa-ring','#be185d'],
    ['fecundidad','Fecundidad','fa-baby','#e11d48'],
    ['mortalidad','Mortalidad','fa-chart-column','#475569'],
    ['religion','Religión','fa-place-of-worship','#4338ca']
  ];

  function esc(v){ return $('<div>').text(v == null ? '' : String(v)).html(); }
  function plain(v){ return $('<div>').html(v == null ? '' : String(v)).text().trim(); }
  function parse(value) {
    if (value && typeof value === 'object') {
      return value;
    }

    var raw =
      value === null || value === undefined
        ? ''
        : String(value);

    raw = $.trim(raw)
      .replace(/^\uFEFF/, '')
      .replace(/\u00A0/g, ' ')
      .replace(/[\u200B-\u200D\u2060]/g, '');

    if (!raw) {
      return null;
    }

    if (
      raw.charAt(0) === '{' &&
      raw.charAt(raw.length - 1) === '}'
    ) {
      try {
        return JSON.parse(raw);
      } catch (jsonError) {
        console.warn(
          '[ficha.estadistico] No es JSON directo; se probará Base64.'
        );
      }
    }

    var base64 = raw.replace(/\s+/g, '');

    try {
      var binary = window.atob(base64);

      var bytes = new Uint8Array(
        binary.length
      );

      var index;

      for (
        index = 0;
        index < binary.length;
        index += 1
      ) {
        bytes[index] =
          binary.charCodeAt(index);
      }

      var decoded;

      if (window.TextDecoder) {
        decoded = new window.TextDecoder(
          'utf-8'
        ).decode(bytes);
      } else {
        var encoded = '';

        for (
          index = 0;
          index < bytes.length;
          index += 1
        ) {
          encoded +=
            '%' +
            ('00' + bytes[index].toString(16))
              .slice(-2);
        }

        decoded = decodeURIComponent(
          encoded
        );
      }

      return JSON.parse(decoded);
    } catch (error) {
      console.error(
        '[ficha.estadistico] Error al decodificar:',
        error
      );

      console.error(
        '[ficha.estadistico] Longitud Base64:',
        base64.length
      );

      console.error(
        '[ficha.estadistico] Inicio:',
        base64.substring(0, 100)
      );

      console.error(
        '[ficha.estadistico] Final:',
        base64.substring(
          Math.max(
            0,
            base64.length - 100
          )
        )
      );

      return null;
    }
  }
  function value(v,type,unit){
    if (v === null || v === undefined || v === '') return 'No disponible';
    var n = Number(v);
    if (!isFinite(n)) return esc(v);
    var pct = type === 'relativo' || type === 'indicador_relativo' || unit === '%';
    return n.toLocaleString('es-MX',{maximumFractionDigits:pct ? 2 : (Math.round(n)===n ? 0 : 2)}) + (pct ? ' %' : '');
  }
  function themeInfo(id){
    var result = [id,id,'fa-chart-simple','#8f1738'];
    $.each(THEMES,function(_,t){ if(t[0]===id) result=t; });
    return result;
  }
  function normalizeKey(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }
  function payloadFrom(context, $detail) {
    var data = context.data || {};
    var direct = null;
    var key;

    /*
    * Buscar el JSON directamente en los datos recibidos.
    */
    for (key in data) {
      if (
        !Object.prototype.hasOwnProperty.call(data, key)
      ) {
        continue;
      }

      if (normalizeKey(key) === 'fichajson') {
        direct = data[key];
        break;
      }
    }

    var payload = parse(direct);

    if (payload) {
      return payload;
    }

    var found = null;

    $detail
      .find('.dinamicPanel-detailList-item')
      .each(function () {
        var $item = $(this);

        var field = normalizeKey(
          $item.attr('data-field')
        );

        var title = normalizeKey(
          $item
            .find('strong')
            .first()
            .text()
        );

        if (
          field !== 'fichajson' &&
          title !== 'fichajson'
        ) {
          return;
        }

        var raw = '';

        /*
        * En la estructura real de MxSIG, el Base64
        * está dentro del elemento label.
        */
        var $label = $item
          .find('label')
          .first();

        if ($label.length && $label[0]) {
          raw = String(
            $label[0].textContent || ''
          );
        }

        /*
        * Respaldo cuando el contenido no está en label.
        */
        if (!$.trim(raw)) {
          var $copy = $item.clone();

          $copy
            .find('strong')
            .first()
            .remove();

          if ($copy[0]) {
            raw = String(
              $copy[0].textContent || ''
            );
          }
        }

        found = parse(raw);

        if (found) {
          $item.hide();
        }

        return false;
      });

    return found;
  }
  function normalizeThemes(p){
    var list=p.temas||[];
    if(typeof list==='string') list=parse(list)||[];
    if(!$.isArray(list)) list=[];
    return $.map(list,function(t){
      t=t||{};
      var info=themeInfo(t.tema), indicators=t.indicadores||[];
      if(typeof indicators==='string') indicators=parse(indicators)||[];
      t.titulo=t.titulo||info[1]; t.icono=t.icono||info[2]; t.color=t.color||info[3];
      indicators = $.grep(
          $.isArray(indicators) ? indicators : [],
          function (indicator) {
              var currentValue = indicator.valor;

              if (
                  currentValue === null ||
                  currentValue === undefined ||
                  currentValue === ''
              ) {
                  return false;
              }

              var numericValue = Number(currentValue);

              if (!isFinite(numericValue)) {
                  return false;
              }

              /*
              * Solo se presentan valores positivos.
              *
              * Esto excluye:
              *  0  = valor sin aportación visual
              * -6  = confidencial
              * códigos negativos especiales
              */
              return numericValue > 0;
          }
      );

      t.indicadores = indicators;
      return t;
    }).sort(function(a,b){return Number(a.orden||99)-Number(b.orden||99);});
  }

  function indicatorType(x){ return x.tipoValor || x.tipo_valor || ''; }
  function absoluteIndicators(t){
    return $.grep(t.indicadores || [], function(x){ return indicatorType(x) === 'absoluto'; });
  }
  function normalizedText(value){
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  }
  function ageBand(description){
    var label=normalizedText(description),match;
    match=label.match(/(?:de\s+)?(\d+)\s+a\s+(\d+)\s+anos/);
    if(match) return {key:match[1]+'-'+match[2],label:match[1]+'–'+match[2],from:Number(match[1]),to:Number(match[2])};
    match=label.match(/(?:de\s+)?(\d+)\s+anos\s+y\s+mas/);
    if(match) return {key:match[1]+'+',label:match[1]+'+',from:Number(match[1]),to:999};
    return null;
  }
  function findSexTotal(items,sex){
    var result=null;
    $.each(items,function(_,x){
      var label=normalizedText(x.descripcion);
      var isSex=sex==='m'?label.indexOf('masculina')>=0:label.indexOf('femenina')>=0;
      var hasAge=/\d+\s+(?:a|anos)/.test(label);
      if(isSex && !hasAge && result===null) result=Number(x.valor);
    });
    return result;
  }
  function selectCompactBands(rows){
    var schemes=[
      ['0-14','15-29','30-49','50-59','60-64','65+'],
      ['0-14','15-24','25-59','60-64','65+'],
      ['0-14','15-29','30-49','50-64','65+']
    ],byKey={},selected=[];
    $.each(rows,function(_,row){byKey[row.key]=row;});
    $.each(schemes,function(_,scheme){
      var candidate=[];
      $.each(scheme,function(_,key){if(byKey[key]) candidate.push(byKey[key]);});
      if(candidate.length>selected.length) selected=candidate;
    });
    if(selected.length>=4) return selected.sort(function(a,b){return b.from-a.from;});
    rows.sort(function(a,b){
      var aw=a.to===999?999:a.to-a.from,bw=b.to===999?999:b.to-b.from;
      return aw-bw || a.from-b.from;
    });
    var occupied=[],fallback=[];
    $.each(rows,function(_,row){
      var overlaps=false;
      $.each(occupied,function(_,r){if(!(row.to<r.from||row.from>r.to)) overlaps=true;});
      if(!overlaps && fallback.length<6){fallback.push(row);occupied.push(row);}
    });
    return fallback.sort(function(a,b){return b.from-a.from;});
  }
  function populationPyramid(items){
    var bands={};
    $.each(items,function(_,x){
      var description=String(x.descripcion||''),label=normalizedText(description);
      var sex=label.indexOf('femenina')>=0?'f':(label.indexOf('masculina')>=0?'m':null);
      var band=ageBand(description);
      if(!sex||!band) return;
      if(!bands[band.key]) bands[band.key]={key:band.key,label:band.label,from:band.from,to:band.to,m:null,f:null};
      bands[band.key][sex]=Number(x.valor);
    });
    var rows=[];
    $.each(bands,function(_,row){if(isFinite(row.m)&&isFinite(row.f)) rows.push(row);});
    rows=selectCompactBands(rows);
    if(!rows.length) return '<div class="dp-statEmpty">No se encontraron grupos de edad comparables para construir la pirámide.</div>';
    var maleTotal=findSexTotal(items,'m'),femaleTotal=findSexTotal(items,'f'),max=1;
    $.each(rows,function(_,row){max=Math.max(max,row.m,row.f);});
    var h='<div class="dp-statSexTotals">';
    h+='<article class="is-male"><i class="fa-solid fa-person"></i><div><small>Hombres</small><strong>'+value(maleTotal,'absoluto')+'</strong></div></article>';
    h+='<article class="is-female"><i class="fa-solid fa-person-dress"></i><div><small>Mujeres</small><strong>'+value(femaleTotal,'absoluto')+'</strong></div></article></div>';
    h+='<section class="dp-statPyramid"><div class="dp-statPyramidTitle"><i class="fa-solid fa-chart-bar"></i><span>Distribución por grandes grupos de edad</span></div>';
    h+='<div class="dp-statPyramidLegend"><span class="is-male">Hombres</span><span>Edad</span><span class="is-female">Mujeres</span></div><div class="dp-statPyramidRows">';
    $.each(rows,function(_,row){
      var mw=Math.max(1,row.m/max*100),fw=Math.max(1,row.f/max*100);
      h+='<div class="dp-statPyramidRow"><div class="dp-statPyramidSide is-left"><small>'+value(row.m,'absoluto')+'</small><span style="width:'+mw+'%"></span></div><b>'+esc(row.label)+'</b><div class="dp-statPyramidSide is-right"><span style="width:'+fw+'%"></span><small>'+value(row.f,'absoluto')+'</small></div></div>';
    });
    return h+'</div><div class="dp-statPyramidNote">Comparación en valores absolutos. Azul: hombres · Magenta: mujeres</div></section>';
  }


  var MUNICIPAL_THEME_CONFIG = {
    economia:{title:'Participación económica',type:'columns',cards:['economicamente activa','ocupada','desocupada','no economicamente activa'],chart:['economicamente activa','ocupada','desocupada']},
    educacion:{title:'Condiciones educativas',type:'bars',cards:['analfabeta','sin escolaridad','educacion posbasica','grado promedio'],chart:['alfabeta','asistencia escolar','educacion posbasica','sin escolaridad']},
    salud:{title:'Cobertura de salud',type:'donut',cards:['afiliada','sin afiliacion','imss','issste'],chart:['afiliada','sin afiliacion']},
    vivienda:{title:'Cobertura de servicios',type:'bars',cards:['viviendas particulares habitadas','agua entubada','drenaje','energia electrica'],chart:['agua entubada','drenaje','energia electrica','internet','piso de tierra']},
    hogares:{title:'Jefatura de los hogares',type:'donut',cards:['total de hogares','persona de referencia mujer','persona de referencia hombre','promedio de ocupantes'],chart:['persona de referencia mujer','persona de referencia hombre']},
    discapacidad:{title:'Tipos de limitación',type:'bars',cards:['con discapacidad','con limitacion','condicion mental','caminar'],chart:['caminar','ver','oir','recordar','comunicarse']},
    migracion:{title:'Movilidad territorial',type:'columns',cards:['nacida en otra entidad','residente en otra entidad','nacida en otro pais','migrante'],chart:['nacida en otra entidad','residente en otra entidad','nacida en otro pais']},
    poblacion_indigena:{title:'Indicadores de pertenencia',type:'bars',cards:['habla lengua indigena','hogares indigenas','no habla espanol','se considera indigena'],chart:['habla lengua indigena','hogares indigenas','no habla espanol']},
    afromexicana:{title:'Composición afromexicana',type:'donut',cards:['afromexicana','afrodescendiente','femenina','masculina'],chart:['femenina','masculina']},
    situacion_conyugal:{title:'Distribución conyugal',type:'bars',cards:['soltera','casada','union libre','viuda'],chart:['soltera','casada','union libre','separada','viuda']},
    fecundidad:{title:'Fecundidad municipal',type:'columns',cards:['promedio de hijas','hijas e hijos nacidos vivos','mujeres con hijas'],chart:['promedio de hijas','hijas e hijos nacidos vivos']},
    mortalidad:{title:'Mortalidad de hijas e hijos',type:'donut',cards:['hijas e hijos fallecidos','hijas e hijos sobrevivientes'],chart:['hijas e hijos fallecidos','hijas e hijos sobrevivientes']},
    religion:{title:'Adscripción religiosa',type:'bars',cards:['catolica','protestante','otra religion','sin religion'],chart:['catolica','protestante','cristiana evangelica','otra religion','sin religion']}
  };
  function indicatorLabel(x){return normalizedText(x.descripcion||x.campo);}
  function prioritized(theme,kind,limit){
    var cfg=MUNICIPAL_THEME_CONFIG[theme.tema]||{},keys=cfg[kind]||[];
    var source=kind==='cards'?absoluteIndicators(theme):$.grep(theme.indicadores||[],function(x){var n=Number(x.valor);return indicatorType(x)==='relativo'&&isFinite(n)&&n>=0&&n<=100;});
    var selected=[];
    $.each(keys,function(_,key){$.each(source,function(_,x){if(selected.length>=limit)return false;if(indicatorLabel(x).indexOf(normalizedText(key))>=0&&$.inArray(x,selected)<0)selected.push(x);});});
    if(selected.length<limit){$.each(source,function(_,x){if(selected.length<limit&&$.inArray(x,selected)<0)selected.push(x);});}
    return selected.slice(0,limit);
  }
  function compactName(x){return String(x.descripcion||x.campo||'Indicador').replace(/^Porcentaje de\s+/i,'').replace(/^Población\s+/i,'');}
  function renderDonut(items,title){
    if(!items.length)return '';
    var total=0;$.each(items,function(_,x){total+=Math.max(0,Number(x.valor)||0);});if(!total)return '';
    var colors=['#2563a8','#b42362','#d97706','#15803d','#6d28d9'],cursor=0,stops=[];
    $.each(items,function(i,x){var part=Math.max(0,Number(x.valor)||0)/total*100;stops.push(colors[i%colors.length]+' '+cursor+'% '+(cursor+part)+'%');cursor+=part;});
    var h='<section class="dp-statViz dp-statDonut"><div class="dp-statVizTitle"><i class="fa-solid fa-chart-pie"></i>'+esc(title)+'</div><div class="dp-statDonutBody"><div class="dp-statDonutRing" style="background:conic-gradient('+stops.join(',')+')"><span>'+items.length+'</span></div><div class="dp-statDonutLegend">';
    $.each(items,function(i,x){h+='<div><i style="background:'+colors[i%colors.length]+'"></i><span>'+esc(compactName(x))+'</span><strong>'+value(x.valor,'relativo','%')+'</strong></div>';});
    return h+'</div></div></section>';
  }
  function renderBars(items,title,type){
    if(!items.length)return '';
    var h='<section class="dp-statViz dp-stat'+(type==='columns'?'Columns':'Bars')+'"><div class="dp-statVizTitle"><i class="fa-solid fa-chart-column"></i>'+esc(title)+'</div><div class="dp-statVizRows">';
    $.each(items,function(_,x){var n=Math.max(0,Math.min(100,Number(x.valor)||0));h+='<div class="dp-statVizRow"><div><span>'+esc(compactName(x))+'</span><strong>'+value(x.valor,'relativo','%')+'</strong></div><i><b style="--v:'+n+'%"></b></i></div>';});
    return h+'</div></section>';
  }
  function themeDashboard(theme){
    var cfg=MUNICIPAL_THEME_CONFIG[theme.tema]||{title:theme.titulo,type:'bars'},cards=prioritized(theme,'cards',4),chart=prioritized(theme,'chart',5),h='<section class="dp-statDashboard">';
    if(cards.length){h+='<div class="dp-statKpis">';$.each(cards,function(_,x){h+='<article><small>'+esc(x.descripcion||x.campo)+'</small><strong>'+value(x.valor,'absoluto',x.unidad)+'</strong></article>';});h+='</div>';}
    h+=cfg.type==='donut'?renderDonut(chart,cfg.title):renderBars(chart,cfg.title,cfg.type);
    if(!cards.length&&!chart.length)h+='<div class="dp-statEmpty">No hay indicadores destacados disponibles para esta cobertura.</div>';
    return h+'</section>';
  }

  function render(context){
    var $detail=context.container, p=payloadFrom(context,$detail);
    var $grid=$detail.find('.dinamicPanel-detailFieldsGrid').first();
    $detail.off('.fichaEstadistico').find('.dp-statFicha,.dp-statError').remove();
    if(!p){
      var msg='<div class="dp-statError"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>No se pudo interpretar FICHA JSON</strong><span>Verifica que el campo contenga JSON válido.</span></div></div>';
      ($grid.length?$grid:$detail.find('.dinamicPanel-detailHeader')).after(msg);
      return;
    }
    var themes=normalizeThemes(p), summary=p.resumen||{};
    $detail.data('fichaEstadisticaPayload',p);
    $detail.find('.dinamicPanel-export-csv').hide();
    if(typeof summary==='string') summary=parse(summary)||{};
    var cards=[['poblacionTotal','Población total','fa-users'],['poblacionFemenina','Población femenina','fa-person-dress'],['poblacionMasculina','Población masculina','fa-person'],['totalHogares','Hogares censales','fa-people-roof'],['viviendasParticularesHabitadas','Viviendas habitadas','fa-house'],['gradoPromedioEscolaridad','Grado promedio de escolaridad','fa-graduation-cap']];
    var h='<section class="dp-statFicha"><div class="dp-statHero"><div><small>Ficha estadística</small><h2>SCINCE 2020</h2><p>'+themes.length+' temas disponibles</p></div><span><i class="fa-solid fa-chart-pie"></i></span></div><div class="dp-statSummary">';
    $.each(cards,function(_,c){if(summary[c[0]]!==null&&summary[c[0]]!==undefined)h+='<article class="dp-statSummaryCard"><i class="fa-solid '+c[2]+'"></i><div><small>'+esc(c[1])+'</small><strong>'+value(summary[c[0]],'absoluto')+'</strong></div></article>';});
    h+='</div><div class="dp-statThemeBar"><label>Tema</label><select class="dp-statThemeSelect">';
    $.each(themes,function(_,t){h+='<option value="'+esc(t.tema)+'">'+esc(t.titulo)+'</option>';});
    h+='</select><span class="dp-statThemeCount"></span></div><div class="dp-statThemePanels">';
    $.each(themes,function(i,t){
      var abs=absoluteIndicators(t),isPopulation=t.tema==='poblacion';
      h+='<section class="dp-statThemePanel'+(i===0?' is-active':'')+'" data-theme="'+esc(t.tema)+'" style="--dp-theme:'+esc(t.color)+'">';
      h+='<div class="dp-statThemeHeading"><span><i class="fa-solid '+esc(t.icono)+'"></i></span><div><h3>'+esc(t.titulo)+'</h3><p>'+esc(t.descripcion||'')+'</p></div></div>';
      if(isPopulation){h+=populationPyramid(abs);}else{h+=themeDashboard(t);}
      h+='</section>';
    });
    h+='</div><footer class="dp-statMeta"><span><i class="fa-solid fa-database"></i> '+esc(p.fuente||'SCINCE 2020')+'</span><span>Periodo '+esc(p.periodo||2020)+'</span></footer></section>';
    if($grid.length)$grid.before(h).remove();else $detail.find('.dinamicPanel-detailHeader').after(h);
    function show(id){var $p=$detail.find('.dp-statThemePanel').removeClass('is-active').attr('aria-hidden','true').filter(function(){return $(this).attr('data-theme')===id;}).addClass('is-active').attr('aria-hidden','false');var groups=$p.find('.dp-statPyramidRow').length,kpis=$p.find('.dp-statKpis article').length,charts=$p.find('.dp-statVizRow,.dp-statDonutLegend>div').length;$detail.find('.dp-statThemeCount').text(groups?groups+' grupos de edad':'Resumen municipal');}
    $detail.on('change.fichaEstadistico','.dp-statThemeSelect',function(e){e.stopPropagation();show(this.value);});
    var first=$detail.find('.dp-statThemeSelect').val();if(first)show(first);
  }
  window.DinamicPanelFichaRegistry.register('estadistico',{template:'ficha.estadistico.html',render:function(context,template){context.container.find('.dinamicPanel-fichaTemplateMarker').remove();if(template)context.container.find('.dinamicPanel-detailHeader').after($(template));render(context);},destroy:function(context){context.container.off('.fichaEstadistico').find('.dp-statFicha,.dp-statError').remove();}});
})(window,jQuery);
