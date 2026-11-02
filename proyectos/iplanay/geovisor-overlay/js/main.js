requirejs.config({
    urlArgs: "ver=" + (new Date()).getTime(),
    paths: {
        mdmVersion:'../config/mdmVersion',
		socialNetworks:'../config/socialNetworks'
    }
});
define(['mdmVersion','socialNetworks'],function(version,socialNetworks){
    $.when(
				$('<link>', {rel: 'stylesheet',type: 'text/css',href:'js/frameworks/OpenLayers/theme/default/style.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href:'js/core/ui/widgets/toolPanel/jquery.ui.toolPanel.css?ver='+mdmVersion}).appendTo('head'),
                $('<link>', {rel: 'stylesheet',type: 'text/css',href:'css/main.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href:'css/htmlObjectsMod.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href:'css/effects.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href:'css/header.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href:'css/print.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href:'css/plantillas/mainSprite.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$.Deferred(function( deferred ){
					$( deferred.resolve );
				})
    ).done(function(){
			
                        requirejs.config({
                        urlArgs: "ver=" + mdmVersion + "-ol2",
                        baseUrl: ((typeof apiUrl!=='undefined')?((apiUrl)?apiUrl:''):'')+'js/',
                        paths: {
                            OpenLayers:'frameworks/OpenLayers/OpenLayers',
                            //rutas de carga
                            framework: 'frameworks',
							math:'frameworks/math/math.min',
							sugar:'frameworks/sugar/sugar.min',
							
							highcharts:'frameworks/highcharts/highcharts',
							hcmodule_data:'frameworks/highcharts/modules/data',
							hcmodule_data:'frameworks/highcharts/modules/exporting',
							hcmodule_drilldown:'frameworks/highcharts/modules/drilldown',
							
							highstock:'frameworks/highstock/highstock',
                            
							core:'core/core',
                            config:'../config/config',
                            tree:'../config/tree',
                            ui:'core/ui/ui',
                            api:'api',
                            restFullApi:'restfullApi',
                            project:'../projects/init',
                            tutorial:'../tutorial/tutorial',
                            tutorialDenue:'../tutorial/tutorialDenue',
                            tmsReader:'../json/TMSCapabilities',
                        },
                        shim: {
                            tmsReader:{
                                exports:'tmsReader',
                                deps:['OpenLayers']
                            },
							sugar:{
								exports:'sugar'
							},
							hcmodule_data:{
								exports:'hcmodule_data',
								deps:['highstock']
							},
							hcmodule_drilldown:{
								exports:'hcmodule_drilldown',
								deps:['highstock']
							},
							/*highcharts:{
								exports:'highcharts'
							},*/
							highstock:{
								exports:'highstock'
							},
                            OpenLayers: {
                                exports: 'OpenLayers',
                                deps:['config','tree','api','restFullApi']
                            },
                            core:{
                                deps:['ui','sugar','math',/*'highcharts',*/'highstock','hcmodule_data','hcmodule_drilldown']
                            },
                            project:{
                                deps:['api']   
                            },
                            Cookies:{
                                deps:['tutorial']
                            },
							
							/*,
							jsPdf:{
								exports:['jsPdf']
							}*/
                        }
                });
                require(['tmsReader','api','project','core','ui','config','tutorial'],function(OpenLayers,api,project,core,ui,config,tutorial) {
                        $.ajaxPrefilter(function( options, originalOptions, jqXHR) {
                            if ((typeof options.mainPath == 'undefined') && (options.dataType != 'script') && (options.url.indexOf('.html')==-1)) {
                                    options.url = config.dataSource.mainPath + options.url;
                                    jqXHR.setRequestHeader('X-API-KEY', config.dataSource.key);
                            }
                        });
                       
						if(!config.toolsConfig.inegiHeader){ //si se detecta activacion de encabezado especial se oculta el encabezado para generarlo dentro del modulo del headerINEGI
							$('#header').show();	
						}else{
							$('#content').css({top:'0px'});
							
						} 
						
                        core.init();
					
                });
                        /////////
    });
    
});