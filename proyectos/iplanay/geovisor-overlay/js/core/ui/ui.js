requirejs.config({
    paths: {
		dataSource:'../config/dataSourceConfig',
		mapConfig:'../config/mapConfig',
        iconRouter:'../config/iconRouter',
        dp_translate:'../config/dataTranslate',
		startupConfig:'../config/controlsConfig',
		systemAddons:'core/ui/systemAddons',
		printControl:'core/ui/printControl',
		denueControl:'core/ui/widgets/dinamicPanel/denue/denue',
		routingControl:'core/ui/widgets/dinamicPanel/routing/routing',
        toolPanel:'core/ui/widgets/toolPanel/jquery.ui.toolPanel',
        dinamicPanel:'core/ui/widgets/dinamicPanel/jquery.ui.dinamicPanel',
		dinamicPanelPath:'core/ui/widgets/dinamicPanel/',
		floatingLegend:'core/ui/widgets/floatingLegend/jquery.ui.floatingLegend',
        layerManager:'core/ui/widgets/layerManager/jquery.ui.layerManager',
        layerDisplay:'core/ui/widgets/layerDisplay/jquery.ui.layerDisplay',
		timeLine:'core/ui/widgets/timeLine/jquery.ui.timeLine',
		ecoTool:'core/ui/widgets/ecoTool/jquery.ui.ecoTool',
		cenago:'core/ui/widgets/cenago/jquery.ui.cenago',
		geoelectorales:'core/ui/widgets/geoelectorales/jquery.ui.geoelectorales',
		eod:'core/ui/widgets/eod/jquery.ui.eod',
		generictheme:'core/ui/widgets/generictheme/jquery.ui.generictheme',
		agropecuario:'core/ui/widgets/agropecuario/jquery.ui.agropecuario',
		agroWizzard:'core/ui/widgets/agropecuario/module/wizzard',
        cardCenago:'core/ui/widgets/cardCenago/cardCenago',
        tabulateCenago:'core/ui/widgets/tabulateCenago/tabulateCenago',
		infoCard:'core/ui/widgets/infoCard/jquery.ui.infoCard',
        customAutocomplete:'core/ui/widgets/autocomplete/jquery.ui.customAutocomplete',
        smartDataTable:'core/ui/widgets/smartDataTable/jquery.ui.smartDataTable',
        scaleControl:'core/ui/widgets/scaleControl/jquery.ui.scaleControl',
		toolBar:'core/ui/widgets/toolBar/jquery.ui.toolBar',
		baseMapMini:'core/ui/widgets/baseMapMini/jquery.ui.baseMapMini',
        notification:'core/ui/widgets/notification/notification',
        
        lightGallery:'core/ui/widgets/lightGallery/jquery.ui.lightGallery',
        
        fancyBox:'core/ui/widgets/fancyBox/jquery.fancybox',
        
        optionalPanel:'core/ui/widgets/panel/panel',
		georeferenceAddress:'core/ui/widgets/georeferenceAddress/georeferenceAddress',
		recordCard:'core/ui/widgets/recordCard/recordCard',
		detailCluster:'core/ui/widgets/detailCluster/detailCluster',
		networkLink:'core/ui/widgets/networkLink/networkLink',
		modules:'core/ui/modules',
		widgets:'core/ui/widgets',
		toolsConfig:'../config/toolsConfig',
		tracking:'core/ui/widgets/tracking/jquery.ui.tracking',
		trackingInfo:'core/ui/widgets/trackingInfo/jquery.ui.trackingInfo',
		helper:'core/ui/widgets/helper/helper',
		helperLabels:'core/ui/widgets/helper/labels',
		startUp:'core/ui/startUp',
		share:'core/ui/modules/share/share',
		support:'core/ui/widgets/support/support',
		menuDownload:'core/ui/modules/menuDownload/menuDownload',
		downloadList:'core/ui/widgets/downloadList/jquery.ui.downloadList',
		mapDownload:'core/ui/modules/mapDownload/mapDownload',
		sakbe:'core/ui/modules/sakbe/sakbe',
		
		genericThemeModule:'core/ui/modules/genericThemeModule/genericThemeModule',
		
		inegiHeader:'core/ui/inegiHeader',
        windy:'core/ui/widgets/windy/windy',
        customPopup:'core/ui/widgets/popup/popup',
    },
    shim:{
        toolPanel:{
            exports:'toolPanel'
            },
        dinamicPanel:{
            exports:'dinamicPanel',
            deps:['toolPanel','fancyBox','lightGallery','optionalPanel','dp_translate','georeferenceAddress']
            },
		floatingLegend:{exports:'floatingLegend'},
		layerManager:{exports:'layerManager'},
		layerDisplay:{exports:'layerDisplay'},
		timeLine:{exports:'timeLine'},
		ecoTool:{exports:'ecoTool'},
		cenago:{exports:'cenago'},
		geoelectorales:{exports:'geoelectorales'},
		eod:{exports:'eod'},
		generictheme:{exports:'generictheme'},
		agropecuario:{exports:'agropecuario'},
        cardCenago:{exports:'cardCenago'},
        tabulateCenago:{exports:'tabulateCenago'},
		infoCard:{exports:'infoCard'},
		customAutocomplete:{exports:'customAutocomplete'},
		smartDataTable:{exports:'smartDataTable'},
		scaleControl:{exports:'scaleControl'},
		toolBar:{exports:'toolBar'},
		lightGallery:{exports:'lightGallery'},
		fancyBox:{exports:'fancyBox'},
		optionalPanel:{exports:'optionalPanel'},
		georeferenceAddress:{exports:'georeferenceAddress'},
		recordCard:{exports:'recordCard'},
		downloadList:{exports:'downloadList'},
		detailCluster:{exports:'detailCluster'},
		networkLink:{exports:'networkLink'},
		tracking:{exports:'tracking'},
		trackingInfo:{exports:'trackingInfo'},
		helper:{exports:'helper'},
        windy:{exports:'windy'},
        customPopup:{exports:'customPopup'}
    }
});

define([
	'dataSource',
	'mapConfig',
	'toolsConfig',
	'startUp',
	'share',
	'iconRouter',
	'startupConfig',
	'systemAddons',
	'printControl',
	'denueControl',
	'routingControl',
	'toolPanel',
	'dinamicPanel',
	'floatingLegend',
	'dp_translate',
	'layerManager',
	'layerDisplay',
	'timeLine',
	'ecoTool',
	'cenago',
	'geoelectorales',
	'eod',
	'generictheme',
	'agropecuario',
	'agroWizzard',
    'cardCenago',
    'tabulateCenago',
	'infoCard',
	'tree',
	'customAutocomplete',
	'smartDataTable',
	'scaleControl',
	'toolBar',
	'optionalPanel',
	'baseMapMini',
	'georeferenceAddress',
	'recordCard',
	'detailCluster',
	'tracking',
	'trackingInfo',
	'helper',
	'support',
	'menuDownload',
	'downloadList',
	'mapDownload',
	'sakbe',
	'genericThemeModule',
	'inegiHeader',
    'windy',
    'customPopup'
	],function(
	dataSource,
	mapConfig,
	toolsConfig,
	startUp,
	share,
	iconRouter,
	controls,
	systemAddons,
	printControl,
	denueControl,
	routingControl,
	toolPanel,
	dinamicPanel,
	floatingLegend,
	dp_translate,
	layerManager,
	layerDisplay,
	timeLine,
	ecoTool,
	cenago,
	geoelectorales,
	eod,
	generictheme,
	agropecuario,
	agroWizzard,
    cardCenago,
    tabulateCenago,
	infoCard,
	tree,
	customAutocomplete,
	smartDataTable,
	scaleControl,
	toolBar,
	optionalPanel,
	baseMapMini,
	georeferenceAddress,
	recordCard,
	detailCluster,
	tracking,
	trackingInfo,
	helper,
	support,
	menuDownload,
	downloadList,
	mapDownload,
	sakbe,
	genericThemeModule,
	inegiHeader,
    windy
){
	systemAddons.init();
	//ajuste de herramienta acorde a configuracion
	toolsConfig.denue.active = controls.ui.denueTurista;
	//agrega Listado de elementos a modulos
	denueControl.loadData(toolsConfig.denue);
	routingControl.loadData(toolsConfig.routing);
	routingControl.Notification = map.Notification;
	
	//conecta el evento de click en capas con la creacion de las mismas en el administrador
	denueControl.clickOnLayer = function(layer){
		$("#layersDisplay").layerDisplay('createNewLayer',layer);	
	};
	denueControl.getLayer = function(idLayer){
		return $("#layersDisplay").layerDisplay('getLayer',idLayer);	
	};
	//Ajustes encabezado INEGI
	if(toolsConfig.inegiHeader){
		setTimeout(function(){
			inegiHeader.init(map,toolsConfig.inegiHeader);
		},100);
	}
	
	
	
    //ajustes de despliegues
    // API------------------------------------------------
    MDM6API.layers ={
			    		events:{
			    			onActiveLayer:function(evt){
			    				if ($.isFunction(evt)){
			    					evt();
			    					}
			    			},
			    			onDeactiveLayer:function(evt){
			    				if ($.isFunction(evt)){
			    					evt();
			    					}
			    			}	
			    		},
			    		methods:{
				    		switchMainList:function(){$("#layersDisplay").layerDisplay('switchMainList');},
				    		switchList:function(){},
				    		getLayers:function(){return$.extend({},tree.layers.groups);},
				    		getActiveLayers:function(){$("#layersDisplay").layerDisplay('getActiveLayers');},
				    		getBaseLayers:function(){$("#mdm6Layers").layerManager('getBaseLayers');}
			    		},
						list:tree
			    	};
	
	MDM6API.legend ={
    					methods:{
    						refresh:function(){$("#mdm6DinamicPanel").dinamicPanel('refreshLegend');}
    					}	
    				};	
	
	MDM6API.ui = {};
	MDM6API.ui.gallery ={ 
					methods:{
						showGallery:function(data){$("#mdm6DinamicPanel").dinamicPanel('showGallery',data);}
					}
			};
	MDM6API.geo = {};		
    MDM6API.geo.getGeo = function(id){
		if(id){
			return $("#mdm6DinamicPanel").dinamicPanel('getGeo',id);
		}else{
			return 'error, se requiere ID';
		}
	}
    
    var refreshMapLayers = function(map){
		var layers = $("#layersDisplay").layerDisplay('getActiveLayers');
		//carga de capas activas desde el inicio
		for (var x in layers){
			var layer = layers[x];
			var params = [{id:layer.idLayer,active:true,group:layer.idGroup,format:layer.format,url:layer.url}];
			MDM6API.layers.events.onActiveLayer(layer,$("#layersDisplay").layerDisplay('getLayers'));
			map.statusLayer(params);
			setTimeout(function(){
				$("#mdm6DinamicPanel").dinamicPanel('refreshLegend');
			},800);
		}	
	}
    
    
    var init = function(map){
		MDM6API.mapCore = map;
		printControl.init(dataSource,tree,map);  //despues de cargar las capas buscables
		printControl.getLegends(
				function(){
							var leg = $("#mdm6DinamicPanel").dinamicPanel('getLegendList');
							return  leg;
						  }
				);
		printControl.getCurrentFeatures = function(){
			return $("#mdm6DinamicPanel").dinamicPanel('getAllFeatures');
	};		
	
	var baseUrl = ((typeof apiUrl!=='undefined')?((apiUrl)?apiUrl:''):'');
        MDM6('load','css');
		$.when(
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/toolPanel/jquery.ui.toolPanel.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/dinamicPanel/jquery.ui.dinamicPanel.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/dinamicPanel/panelForms.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/dinamicPanel/sprites.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/floatingLegend/jquery.ui.floatingLegend.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/floatingLegend/sprite.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/layerManager/jquery.ui.layerManager.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/layerManager/sprite.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/timeLine/jquery.ui.timeLine.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/timeLine/timeLine-sprite.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/timeLine/effects.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/ecoTool/jquery.ui.ecoTool.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/infoCard/jquery.ui.infoCard.css'+'?ver='+mdmVersion}).appendTo('head'),
			
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/agropecuario/jquery.ui.agropecuario.css?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/agropecuario/module/wizzard.css?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/cenago/jquery.ui.cenago.css?ver='+mdmVersion}).appendTo('head'),
			
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/geoelectorales/jquery.ui.geoelectorales.css?ver='+mdmVersion}).appendTo('head'),
			
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/eod/jquery.ui.eod.css?ver='+mdmVersion}).appendTo('head'),
			
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/generictheme/jquery.ui.generictheme.css?ver='+mdmVersion}).appendTo('head'),
			
                $('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/cardCenago/cardCenago.css?ver='+mdmVersion}).appendTo('head'),
                $('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/tabulateCenago/tabulateCenago.css?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/layerDisplay/jquery.ui.layerDisplay.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/layerDisplay/icons.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/baseMapMini/jquery.ui.baseMapMini.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/autocomplete/jquery.ui.customAutocomplete.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/smartDataTable/jquery.ui.smartDataTable.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/scaleControl/jquery.ui.scaleControl.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/scaleControl/scaleControl-sprite.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/toolBar/jquery.ui.toolBar.css'+'?ver='+mdmVersion}).appendTo('head'),
				//$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/toolBar/mdm-toolBar.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/baseMapMini/jquery.ui.baseMapMini.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/tooltip/jquery.ui.tooltip.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/lightGallery/jquery.ui.lightGallery.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/fancyBox/jquery.fancybox.css?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/fancyBox/helpers/jquery.fancybox-buttons.css?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/panel/panel.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/networkLink/networkLink.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/recordCard/recordCard.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/detailCluster/detailCluster.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/georeferenceAddress/georeferenceAddress.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/tracking/css/jquery.ui.tracking.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/trackingInfo/css/jquery.ui.trackingInfo.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/detailCluster/template.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/recordCard/template.css'+'?ver='+mdmVersion}).appendTo('head'),
				
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/helper/helper.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/helper/template.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/support/support.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/modules/menuDownload/menuDownload.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/downloadList/jquery.ui.downloadList.css'+'?ver='+mdmVersion}).appendTo('head'),
				$('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/modules/mapDownload/mapDownload.css'+'?ver='+mdmVersion}).appendTo('head'),
                $('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/windy/windy.css'+'?ver='+mdmVersion}).appendTo('head'),
                $('<link>', {rel: 'stylesheet',type: 'text/css',href: baseUrl+'js/core/ui/widgets/popup/popup.css'+'?ver='+mdmVersion}).appendTo('head'),
                
				
				$.Deferred(function( deferred ){
					$( deferred.resolve );
				})
			).done(function(){
				
				//Ajustes Iniciales
				map.idSession = $.fn.createIdSession();
				map.proyName = dataSource.proyName;
				map.serviceVersion = dataSource.servicesVersion;
				tree.defaultLayers = mapConfig.defaultLayers;
				//IsMobile
				var isMobile = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));  
				MDM6API.ui.isMobile = isMobile;
				
				//Local Manage-------------------------------------------------------------------------------
				var layerAdmin={
						activateLayer:function(layer){
							var params = [{id:layer.idLayer,active:true,group:layer.idGroup,image:layer.image,tiled:layer.tiled,format:layer.format,url:layer.url,windy:layer.windy}];
							MDM6API.layers.events.onActiveLayer(layer,$("#layersDisplay").layerDisplay('getLayers'));
							map.statusLayer(params);
							//si hay un tema asociado a la capa
							if(layer && layer.baseMap){
								setTimeout(function(){
									$("#mdm6Layers").layerManager('setBaseMap',layer.baseMap);
								},800);
							}
							setTimeout(function(){
								$("#mdm6DinamicPanel").dinamicPanel('refreshLegend');
							},800);
						},
						deActivateLayer:function(layer){
							var params = [{id:layer.idLayer,active:false,group:layer.idGroup,image:layer.image,tiled:layer.tiled,format:layer.format,url:layer.url,windy:layer.windy}];
							MDM6API.layers.events.onDeactiveLayer(layer,$("#layersDisplay").layerDisplay('getLayers'));
							map.statusLayer(params);
							setTimeout(function(){
								$("#mdm6DinamicPanel").dinamicPanel('refreshLegend');
							},800);
						},
				}
				
				//Se definen contenedores de widgets------------------------------------------------------------------------
				var cadena = '<div id="mdmTimeLine" class="mdm-ui-widget"></div>';
					cadena+= '<div id="mdm6DinamicPanel" class="mdm-ui-widget"></div>';
					cadena+= '<div id="mdm6Layers" class="mdm-ui-widget"></div>';
					cadena+= '<div id="scaleControl" class="mdm-ui-widget"></div>';
					cadena+= '<div id="baseMapMini" class="mdm-ui-widget"></div>';
					cadena+= '<div id="mdmToolBar" class="mdm-ui-widget"></div>';
					cadena+= '<div id="floatingLegend" class="mdm-ui-widget"></div>';
					cadena+= '<div id="toggleView"></div>';
					
				$("#panel-center").append(cadena);
					//********************************************DESPUES DE INICIAR MODULO DE ARRANQUE *********************/
					//despues de iniciar valores
				startUp.afterInit = function(){
					  
						var defaultLayers = [];//['c100','c101','c102'];
						var layers = $.extend({},tree.layers.groups);
						
						for (var x in defaultLayers){
							var layer = defaultLayers[x];
							for (var i in layers){
								if (!(layers[i].layers[layer] === undefined)){
									var idLayer = layer;
									layer = layers[i].layers[defaultLayers[x]];
									layer.idGroup = i;
									layer.idLayer = idLayer;
									defaultLayers[x] = layer;
									break;
								}
							}
						}
						//Sakbe API
						sakbe.init(map,toolsConfig);
						var agropecuarioLaunchCount = 0;
						//Carga de widgets por capa especial --------------------------------------------------------------------------
						window.layerWidgets = {};
						var loadWidget = function(opc){
							var layer = opc.layer;
							var map = opc.map;
							if(window.layerWidgets[layer.idLayer]){
								if(window.layerWidgets[layer.idLayer])
									window.layerWidgets[layer.idLayer].init(opc);
							}else{//si no se a cargado el widget correspondiente a la capa, se invoca la carga
								var path = 'config/layerWidgets/'+layer.idLayer+'/'
								$.when(
										$.getScript( path+'control.js' )
								).done(function(){
									if(window.layerWidgets[layer.idLayer])
										window.layerWidgets[layer.idLayer].init(opc);
								});
							}
						}
						var unloadWidget = function(opc){
							var layer = opc.layer;
							if(window.layerWidgets[layer.idLayer])
								window.layerWidgets[layer.idLayer].remove();
						}
						var mdmEventToWidget = function(evt){
							if(window.layerWidgets){
								var list = window.layerWidgets;
								for(var x in list){
									var item = list[x];
									if(item.widgetActive){
										item.events(evt);
									}
								}
							}
						}
						var isWidgetActive = function(evt){
							var r = false;
							if(window.layerWidgets){
								var list = window.layerWidgets;
								for(var x in list){
									var item = list[x];
									if(item.widgetActive){
										r = true;
									}
								}
							}
							return r;
						}
						//Agropecuario------------------------------------------------------------------------------------------------
						var launchAgropecuario = function(map){
							agropecuarioLaunchCount++;
							if($('#toolAgropecuario').attr('id') === undefined){
								var cadena = '<div id="toolAgropecuario"></div>';
								$("#panel-center").append(cadena);
								var agropecuarioConfig = toolsConfig.agropecuario;
								$('#toolAgropecuario').agropecuario({map:map,config:agropecuarioConfig,
													//	modules:[agroWizzard],
														initCount:agropecuarioLaunchCount,
														collision:function(element){
															var dp_top = $('#mdm6DinamicPanel').position().top+90;
															var a_top = element.position().top;
															return dp_top > a_top;
														},
														onCollision:function(){
															$("#mdm6DinamicPanel").dinamicPanel('hideSearch');
														},
														getResolution:function(){
															return map.getResolution();
														},
														getMapStatus:function(){
															return {zoom:map.getZoomLevel()}
														},
														refreshMap:function(params){
															if(params){
																MDM6('setParams',{
																	layer:'Economico',
																	params:params
																	});
															}else{
																MDM6('setParams',{
																	layer:'Economico',
																	params:{forceRefresh:true}
																	});
															}
														},
														onTransparency:function(data){
															MDM6('setOpacity','Economico',data/100);
														},
														onStart:function(){
															$("#mdm6Layers").layerManager('closeBottomCarrucel');
														},
														extent:function(wkt){
															map.goCoords(wkt);	
														},
														clearIdentify:function(){
															MDM6('deletePolygons','SpetialPolygons');
															MDM6('hideMarkers','identify');
														},
														markerWithText:function(position,content,func){
															MDM6('hideMarkers','identify');
															var params = {lon:position.lon,lat:position.lat,type:'identify',params:{nom:'Información',desc:{custom:content,store:true},image:'info',event:func},showPopup:true};
															var marca = MDM6('addMarker',params);
														},
														systemMessage:function(msg,options){
															if(!options)
																map.Notification({message:msg,time:3000});
															
															var dialog = '<div id="agropecuarioNotification" title="'+((options && options.title)?options.title:'Información')+'">';
																dialog+= msg;
																dialog+= '</div>';
															$('#agropecuarioNotification').remove(); 	
															$('body').append(dialog);
															$('#agropecuarioNotification').dialog({
																resizable:false,
																width:((options && options.width)?options.width:350),
																modal: true,
																height:((options && options.height)?options.height:250),
																close: function(event, ui){
																	$(this).dialog('destroy').remove();
																},
																buttons: {
																	"Aceptar": function() {
																	  $( this ).dialog( "close" );
																	}
																  }
																});
														}
													  });
							}
						}
						//Cenago----------------------
						var launchCenago = function(map){
							if($('#toolCenago').attr('id') === undefined){
								var cadena = '<div id="toolCenago"></div>';
								$("#panel-center").append(cadena);
								var cenagoConfig = toolsConfig.cenago;
								$('#toolCenago').cenago({map:map,config:cenagoConfig,
														getResolution:function(){
															return map.getResolution();
														},
														refreshMap:function(params){
															if(params){
																MDM6('setParams',{
																	layer:'Economico',
																	params:params
																	});
															}else{
																MDM6('setParams',{
																	layer:'Economico',
																	params:{forceRefresh:true}
																	});
															}
														},
														onTransparency:function(data){
															MDM6('setOpacity','Economico',data/100);
														},
														onStart:function(){
															$("#mdm6Layers").layerManager('closeBottomCarrucel');
														},
														extent:function(wkt){
															map.goCoords(wkt);	
														},
														systemMessage:function(msg,options){
															if(!options)
																map.Notification({message:msg,time:3000});
															
															var dialog = '<div id="cenagoNotification" title="'+((options && options.title)?options.title:'Información')+'">';
																dialog+= msg;
																dialog+= '</div>';
																
															$('body').append(dialog);
															$('#cenagoNotification').dialog({
																resizable:false,
																width:((options && options.width)?options.width:350),
																modal: true,
																height:((options && options.height)?options.height:250),
																close: function(event, ui){
																	$(this).dialog('destroy').remove();
																},
																buttons: {
																	"Aceptar": function() {
																	  $( this ).dialog( "close" );
																	}
																  }
																});
														}
													  });
							}
						}
						//Encuesta Origen Destino ---------------------------------------
						var launchEOD = function(map){
							if($('#eod').attr('id') === undefined){
								var cadena = '<div id="eod"></div>';
								$("#panel-center").append(cadena);
								var eodConfig = toolsConfig.eod;
								
								$('#eod').eod({map:map,config:eodConfig,
											   			onTheme:function(data){
															MDM6('eod',data);
														},
											   			onThemeFail:function(){
															MDM6('eod',false);
														},
														onActive:function(){
															//MDM6('eod',true);
															//eodConfig.baseMapBeforeStart = $("#mdm6Layers").layerManager('getCurrentBaseMap');
															$("#mdm6Layers").layerManager('closeRightCarrucel');
															//$('#mdm6Layers').addClass('hideBaseMap hidetreelayer');
															
															/*setTimeout(function(){
																$("#mdm6Layers_layerManager_collapsedTools").Popup({content:'Se deshabilitó la selección de mapa base y capas de forma temporal',showOn:'now',highlight :true,time:10000});
															},1000);*/
														},
														onClose:function(){
															MDM6('eod',false);
															//$('#mdm6Layers').removeClass('hideBaseMap hidetreelayer');
															//$("#mdm6Layers").layerManager('setBaseMap',eodConfig.baseMapBeforeStart);
														},
														getResolution:function(){
															return map.getResolution();
														},
														refreshMap:function(params){
															if(params){
																MDM6('setParams',{
																	layer:'Economico',
																	params:params
																	});
															}else{
																MDM6('setParams',{
																	layer:'Economico',
																	params:{forceRefresh:true}
																	});
															}
														},
														onTransparency:function(data){
															MDM6('setOpacity','Economico',data/100);
														},
														onStart:function(){
															$("#mdm6Layers").layerManager('closeBottomCarrucel');
														},
														extent:function(wkt){
															map.goCoords(wkt);	
														},
														onIdentifyFail:function(data){
															$("#mdm6DinamicPanel").dinamicPanel('identifyPoint',data);  
														},
														onCloseIdentify:function(){
															MDM6('hideMarkers','identify');	
														},
													   detectCollision:function(element){
															var dp_top = $('#mdm6DinamicPanel').position().top+90;
															var a_top = element.position().top;
															if(dp_top > a_top){
																$("#mdm6DinamicPanel").dinamicPanel('hideSearch');
															}
														},
														systemMessage:function(msg,options){
															if(!options)
																map.Notification({message:msg,time:3000});
															
															var dialog = '<div id="eodNotification" title="'+((options && options.title)?options.title:'Información')+'">';
																dialog+= msg;
																dialog+= '</div>';
																
															$('body').append(dialog);
															
															var dialogDefault = {
																resizable:false,
																width:350,
																modal: true,
																height:250,
																close: function(event, ui){
																	$(this).dialog('destroy').remove();
																},
																buttons: {
																	"Aceptar": function() {
																	  $( this ).dialog( "close" );
																	}
																  }
																}
															
															for(var x in options)
																dialogDefault[x] = options[x];	
															
															$('#eodNotification').dialog(dialogDefault);
														}
													  });
							}
						}
						//geoElectorales----------------------
						var launchGeoelectorales = function(map){
							if($('#toolGeoelectorales').attr('id') === undefined){
								var cadena = '<div id="toolGeoelectorales"></div>';
								$("#panel-center").append(cadena);
								var geoelectoralesConfig = toolsConfig.geoelectorales;
								
								$('#toolGeoelectorales').geoelectorales({map:map,config:geoelectoralesConfig,
														onActive:function(){
															geoelectoralesConfig.baseMapBeforeStart = $("#mdm6Layers").layerManager('getCurrentBaseMap');
															$("#mdm6Layers").layerManager('closeRightCarrucel');
															$('#mdm6Layers').addClass('hideBaseMap hidetreelayer');
															
															setTimeout(function(){
																$("#mdm6Layers_layerManager_collapsedTools").Popup({content:'Se deshabilitó la selección de mapa base y capas de forma temporal',showOn:'now',highlight :true,time:10000});
															},1000);
														},
														onClose:function(){
															$('#mdm6Layers').removeClass('hideBaseMap hidetreelayer');
															$("#mdm6Layers").layerManager('setBaseMap',geoelectoralesConfig.baseMapBeforeStart);
														},
														getResolution:function(){
															return map.getResolution();
														},
														refreshMap:function(params){
															if(params){
																MDM6('setParams',{
																	layer:'Economico',
																	params:params
																	});
															}else{
																MDM6('setParams',{
																	layer:'Economico',
																	params:{forceRefresh:true}
																	});
															}
														},
														onTransparency:function(data){
															MDM6('setOpacity','Economico',data/100);
														},
														onStart:function(){
															$("#mdm6Layers").layerManager('closeBottomCarrucel');
														},
														extent:function(wkt){
															map.goCoords(wkt);	
														},
														onIdentifyFail:function(data){
															$("#mdm6DinamicPanel").dinamicPanel('identifyPoint',data);  
														},
														onCloseIdentify:function(){
															MDM6('hideMarkers','identify');	
														},
													   detectCollision:function(element){
															var dp_top = $('#mdm6DinamicPanel').position().top+90;
															var a_top = element.position().top;
															if(dp_top > a_top){
																$("#mdm6DinamicPanel").dinamicPanel('hideSearch');
															}
														},
														systemMessage:function(msg,options){
															if(!options)
																map.Notification({message:msg,time:3000});
															
															var dialog = '<div id="cenagoNotification" title="'+((options && options.title)?options.title:'Información')+'">';
																dialog+= msg;
																dialog+= '</div>';
																
															$('body').append(dialog);
															
															var dialogDefault = {
																resizable:false,
																width:350,
																modal: true,
																height:250,
																close: function(event, ui){
																	$(this).dialog('destroy').remove();
																},
																buttons: {
																	"Aceptar": function() {
																	  $( this ).dialog( "close" );
																	}
																  }
																}
															
															for(var x in options)
																dialogDefault[x] = options[x];	
															
															$('#cenagoNotification').dialog(dialogDefault);
														}
													  });
							}
						}
						//EcoTool----------------------
						//infoCard - economico
						var launchInfoCard = function(vars){
							$('#ecoInfoCard').remove();
							var cadena = '<div id="ecoInfoCard"></div>';
							$("#panel-center").append(cadena);
							$('#ecoInfoCard').infoCard({
								getGralValues:function(){
									return vars
								},
								getVarsData:function(){
									return	$('#ecoTool').ecoTool('getVarsData');
								},
								showVarInfo:function(id){
									$('#ecoTool').ecoTool('openDialogVar',id);
								},
								dataSources:toolsConfig.ecoTool.dataSources,
								printControl:printControl
								});
						}
						var launchEcoTool = function(map){
							if($('#ecoTool').attr('id') === undefined){
								var cadena = '<div id="ecoTool"></div>';
								$("#panel-center").append(cadena);
								var ecoConfig = toolsConfig.ecoTool;
								$('#ecoTool').ecoTool({map:map,config:ecoConfig,noDataStrat:ecoConfig.specialStrats,colorRamps:ecoConfig.colorRamps,defaultData:ecoConfig.defaultData,edos:ecoConfig.edos,var_vals:ecoConfig.vars_vals,var_gs:ecoConfig.vars_gs,dataSource:ecoConfig.dataSources,
														getResolution:function(){
															return map.getResolution();
														},
														refreshLayer:function(data){
															if(data){
																var params = {'LAYERS':'d100,d101,d102,d109,d201'}
																var type = (data.geo.id=='00')?'EDO':data.selection.filter;
																if(data.geoType == 'ZM')type='LOC'; //las zonas metropolitanas se tematizan a municipio
																
																params['MAPAESTATAL'] = (type=='EDO')?data.theme.id:0;
																params['MAPAMUNICIPAL'] = (type=='MUN')?data.theme.id:0;
																params['MAPALOCALIDAD'] = (type=='LOC' && data.geo.id != '9000')?data.theme.id:0;
																params['MAPAAGEB'] = (type=='AGEB')?data.theme.id:0;
																params['MAPAZM'] = (data.geo.id == '9000')?data.theme.id:0;
																
																MDM6('setParams',{
																	layer:'Economico',
																	params:params
																	});
															}else{
																MDM6('setParams',{
																	layer:'Economico',
																	params:{forceRefresh:true}
																	});
															}
														},
														notInGeoArea:function(vars,pos){
															map.event.identify({lon:pos.lon,lat:pos.lat},true);
														},
														inGeoArea:function(vars,data){
															if($('#ecoInfoCard').attr('id')){
																$('#ecoInfoCard').infoCard('addGeo',data);
															}else{
																launchInfoCard(vars);
															}
														},
														onStart:function(){
															$("#mdm6Layers").layerManager('closeBottomCarrucel');
														},
														onClose:function(){
															MDM6('setParams',{
																layer:'Economico',
																params:{'LAYERS':'d100,d101','MAPAESTATAL':0,'MAPAMUNICIPAL':0}
																});
															if($('#ecoInfoCard').attr('id'))
																$('#ecoInfoCard').remove();
															
														},
														getExternalStatus:function(){
															var r = null;
															if($('#ecoInfoCard').attr('id')){
																r =  $('#ecoInfoCard').infoCard('getCurrentData');
															}
															return r;
														},
														onTransparency:function(data){
															MDM6('setOpacity','Economico',data/100);
														},
														extent:function(wkt){
															map.goCoords(wkt);	
														},
														systemMessage:function(msg){
															map.Notification({message:msg,time:3000});
															var dialog = '<div id="ecoNotification" title="Información">';
																dialog+= msg;
																dialog+= '</div>';
																
															$('body').append(dialog);
															$('#ecoNotification').dialog({
																resizable:false,
																width:350,
																modal: true,
																height:250,
																buttons: {
																	"Aceptar": function() {
																	  $( this ).dialog( "close" );
																	}
																  }
																});
														},
													   detectCollision:function(element){
															var dp_top = $('#mdm6DinamicPanel').position().top+90;
															var a_top = element.position().top;
															if(dp_top > a_top){
																$("#mdm6DinamicPanel").dinamicPanel('hideSearch');
															}
														}
													 });
							}
						};
						
						//ScaleControl
						$("#scaleControl").scaleControl({
							isMobile:isMobile,
							onZoomIn:function(){
								map.zoomIn(); 
							},
							onExtent:function(){
								map.extent(); 
							},
							onZoomOut:function(){
								map.zoomOut();
							},
							onGps:function(){
								 var eventos={
									Stop:function(){
										map.Tracking.event({action:'endTracking'});
									},
									byCar:function(){
										map.Tracking.event({action:'starSnap'});
									},
									Walking:function(){
										map.Tracking.event({action:'stopSnap'});
									}
									
								 }
								 map.Tracking.event({action:'starTracking',eventCatch:function(e){$("#map").tracking({data:e,controller:eventos});}});
							},
							onPos:function(){
								map.Tracking.event({action:'showPosition'})
							}
						});
						//Panel dinamico de busquedas
						$("#mdm6DinamicPanel").dinamicPanel({
							modules:[denueControl,routingControl],
							bufferLayers:tree.identificables,
							recurrentIdentify:defaultLayers,
							translateSearch:dp_translate.search,
							translateLayer:function(name){
								var layer = $('#mdmTimeLine').timeLine('convertlayer',name);
								return layer;
							},
							dataSource:dataSource,
							autocomplete:false,
							//translate_params:dp_translate.params,
							//translate_results:dp_translate.results,
							mapConfig:mapConfig,
							getActiveLayers:function(){
								var r = $("#layersDisplay").layerDisplay('getActiveLayers');
								return r;
							},
							getLayer:function(idLayer){
								return $("#layersDisplay").layerDisplay('getLayer',idLayer);	
							},
							getCurrentBaseMap:function(){
								return $("#mdm6Layers").layerManager('getCurrentBase');
							},
							getIcon:function(text){
							  return iconRouter.getIcon(text);  
							},
							getBaseLayers:function(){
							   return $("#mdm6Layers").layerManager('getBaseLayers');
							},
							markerWithText:function(position,content,func){
								MDM6('hideMarkers','identify');
								var params = {lon:position.lon,lat:position.lat,type:'identify',params:{nom:'Información',desc:{custom:content},image:'info',event:func},showPopup:true};
								var marca = MDM6('addMarker',params);
							},
							onRefreshLegend:function(text){
								$('#floatingLegend').floatingLegend('changeContent',text);	
							},
							onLegendWindow:function(){
								$('#floatingLegend').floatingLegend('open');
							},
							onIdentify:function(data){
								amplify.publish( 'onIdentifyMap',{data:data});	
							},
							onCloseDetail:function(){
								amplify.publish( 'onCloseDetail');	
							},
							map:map,
							controlsMap:controls.map,
							onAnalysis:function(params){
                                var type = (params['function']=='INTERSECTS')?'1':'2';
                                var paramsAdditionals = {layers:'d5000',capa:params.table,id:params.polygon,tipo:type};
                                var items = tree.specialActions.identificables;
                                for (var x in items) {
                                    var i = items[x];
                                    if (i.name==params.table) {
                                        if (i.wmsdata) {
                                            paramsAdditionals = $.extend({'wmsdata':i.wmsdata},paramsAdditionals);
                                        }
                                        break;
                                    }
                                }
                                map.setParamsToLayer({layer:'Analisis',params:paramsAdditionals});
                                
                            },//onBufferAnalysis}
							onTabChange:function(tab){
                                
                                var status = (tab=='bufferPanel')?true:false;
                                map.setVisibility('Analisis',status);
                                
                            },
		 					onAnalysisClose:function(){
                                
                                map.setVisibility('Analisis',false);
                                
                            },
							systemMessage:function(msg,options){
								var dialog = '<div id="dinamicPanelNotification" title="'+((options && options.title)?options.title:'Información')+'">';
									dialog+= msg;
									dialog+= '</div>';
								$('#dinamicPanelNotification').remove(); 	
								$('body').append(dialog);
								$('#dinamicPanelNotification').dialog({
									resizable:false,
									width:((options && options.width)?options.width:350),
									modal: true,
									height:((options && options.height)?options.height:250),
									close: function(event, ui){
										$(this).dialog('destroy').remove();
									},
									buttons: {
										"Aceptar": function() {
										  $( this ).dialog( "close" );
										}
									  }
									});
							}
						});
						amplify.subscribe( 'uiGallery', function(data){
							$("#mdm6DinamicPanel").dinamicPanel('showGallery',data);
						});
						//despliegue de leyendas
						$('#floatingLegend').floatingLegend();
						//manejador de capas
						$("#mdm6Layers").layerManager({
											   startTheme:map.bootTheme,
											   autoOpenBottomCarrucel:controls.ui.autoOpenThemeBar,
											   baseLayers:tree.baseLayers,
											   layers:tree.layers,
											   themeLayers:tree.themes,
											   timeLayers:[],
											   verSelection:function(id){
													map.setBaseLayer(id);
													$("#mdm6DinamicPanel").dinamicPanel('refreshLegend');
											   },
											   horSelection:function(layers){
												$("#layersDisplay").layerDisplay('setActiveLayers',layers);
												$("#mdm6DinamicPanel").dinamicPanel('refreshLegend');
											   },
											   openLayerSelected:function(){
													$("#layersDisplay").layerDisplay('switchShortList');
											   },
											   openLayerConf:function(){
													$("#layersDisplay").layerDisplay('switchMainList');
											   },												   
											   onOpenMiniMapBox:function(){
													$("#layersDisplay").layerDisplay('adjustMarginShortList');
											   },
											   onTimeBtn:function(){
													$('#mdmTimeLine').timeLine('show');											   
											   },
											   openHCarrucel:function(height){
												   var base = $('#mdm6Layers').height();
												   $('#mdmTimeLine').animate({'bottom':(height)+'px'});
												   amplify.publish( 'hideTutorial'); 
												   
											   },
											   closeHCarrucel:function(height){
												   var base = $('#mdm6Layers').height();
												   $('#mdmTimeLine').animate({'bottom':(base)+'px'},'fast');
											   },
											   onOpenRightCarrucel:function(){
												   $("#mdmToolBar").addClass('toolBar-right-230');
											   },
											   onCloseRightCarrucel:function(){
												   $("#mdmToolBar").removeClass('toolBar-right-230');
											   },
											   gotoExtend:function(wkt){
												   map.goCoords(wkt);
											   }
						});
						//despliegue de capas
						var cadena = '<div id="layersDisplay"></div>';
						$("body").append(cadena);
						var defaultLayers = map.getActiveLayers();//[{id:'c102',group:'G5'},{id:'t102',group:'G5'},{id:'c110',group:'G5'},{id:'t700',group:'G5'}];
						
						$('#mdmTimeLine').timeLine({
								map:map,
								urlSlider:toolsConfig.timeLine.layers,
								layersList:tree.layers,
								getActiveLayers:function(){
									return $("#layersDisplay").layerDisplay('getActiveLayers');//map.getLayersActive('Vectorial');
								},
								getCurrentTransparency:function(){
									return $("#layersDisplay").layerDisplay('getTransparency');	
								},
								externalActivate:function(layer){
									$('#mdmTimeLine').timeLine('show');
									layerAdmin.activateLayer(layer);
								},
								externalDeactivate:function(layer){
									layerAdmin.deActivateLayer(layer);
								},
								internalDeactivate:function(layer){
									 $("#layersDisplay").layerDisplay('closeLayer',layer);
								},
								onTimePlayerOpen:function(){
									$("#mdm6Layers").hide();
									$("#scaleControl").hide();
									$("#mdm6DinamicPanel").hide();
									$("#mdmToolBar").hide();
									$('#floatingLegend').floatingLegend('bringToFront');
									map.setVisibility('Vectorial',false);
								},
								onTimePlayerClose:function(){
									if ((controls.ui.layersBar)){
										$("#mdm6Layers").show();
									}
									if ((controls.ui.toolBar)){
										 $("#mdmToolBar").show();	
									}
										
									$("#scaleControl").show();
									$("#mdm6DinamicPanel").show();	
									$("#mdmToolBar").show();
									$('#floatingLegend').floatingLegend('sendToNormalPosition');
									map.setVisibility('Vectorial',true);
								},
								onTimeout:function(text){
									map.Notification({message:text,time:3000});	
								}
							}).css('bottom','29px');
						
						$("#layersDisplay").layerDisplay({layers:tree.layers.groups,map:map,tree:tree,
										 dataSource:dataSource,
										 //defaultLayers:defaultLayers,
										 onResetActiveStatus:function(){
											$('#mdmTimeLine').timeLine('resetActiveStatus'); 
										 },
										 onViewLayerData:function(idref){
											 $('body').tabulateCenago({table:idref});
										 },
										 onActiveLayer:function(layer){
												var isTime = layer.time;
												var special = layer.specialLayer;
												if(!isTime){
													layerAdmin.activateLayer(layer);
												}else{
													$('#mdmTimeLine').timeLine('activateLayer',layer.idLayer);	
												}
											 	if(special && special == 'widget'){
													loadWidget({layer:layer,map:map});
												}
												if(special && special == 'Economico'){
													launchEcoTool(map);
												}
											 	if(special && special == 'eod'){
													launchEOD(map);
												}
											 	if(special && special == 'cenago'){
													launchCenago(map);
												}
											    if(special && special == 'cgeoelectorales'){
													var isRdy = MDM6('getMyLocation');
													if(isRdy){ //si esta disponible el valor de posicion lanza de inmediato, de lo contrario espera de forma asincrona
														launchGeoelectorales(map);
													}else{
														setTimeout(function(){
															launchGeoelectorales(map);
														},1500);
														
													}
												}
											 	if(special && special == 'agropecuario'){
													launchAgropecuario(map);
												}
											 
											 	//revisa si es una capa con tema generico
											 	if(layer.generictheme){
													var id = layer.idLayer;
													genericThemeModule.load(id);
												}
												setTimeout(function(){
													amplify.publish( 'onActiveLayer');
												},100);
											},
										 onDeactiveLayer:function(layer){
												var isTime = layer.time;
												var special = layer.specialLayer;
												if(!isTime){
													layerAdmin.deActivateLayer(layer);
												}else{
													$('#mdmTimeLine').timeLine('deactivateLayer',layer.idLayer);		
												}
											 	if(special && special == 'widget'){
													unloadWidget({layer:layer,map:map});
												}
												if(special && special == 'Economico'){
													$('#ecoTool').remove();	
												}
											 	if(special && special == 'eod'){
													$('#eod').remove();	
												}
											    if(special && special == 'cenago'){
													$('#toolCenago').remove();	
												}
											 	if(special && special == 'cgeoelectorales'){
													$('#toolGeoelectorales').remove();	
												}
											 	if(special && special == 'agropecuario'){
													$('#toolAgropecuario').remove();
													MDM6('deletePolygons','SpetialPolygons'); 
													var params = {action:'delete',items:'all',type:'identify'};
        											map.Mark.event(params);
												}
											 	
											 	if(layer.generictheme){
													var id = layer.idLayer;
													genericThemeModule.unload(id);
												}
											 
												setTimeout(function(){
													amplify.publish( 'onDeactiveLayer');
												},100);
                                                if ($("#custom_tabulateCenago").attr('id')) {
                                                   $('body').tabulateCenago('hide',layer.idLayer);
                                                }
											},
										 onThemeLayers:function(layers){
											map.Tree.event.reset();
											if (layers != false && layers.length > 0){
												var tLayers = [];
												for (var x in layers){
													var layer = layers[x];
													var isTime = layer.time;
													if(!isTime){
														tLayers.push({id:layer.idLayer,active:true,group:layer.idGroup});
													}else{
														$('#mdmTimeLine').timeLine('activateLayer',layer.idLayer);		
													}
												}
												map.statusLayer(tLayers);
												setTimeout(function(){
													amplify.publish( 'onActiveLayer');
												},100);
											}
											$("#mdm6DinamicPanel").dinamicPanel('refreshLegend');
										 },
										 onSetScale:function(scale){
											map.zoomToLayer(scale);
										 },
										 onChangeOpacity:function(val){
											map.changeOpacity(val);
										 },
										 getBottomMargin:function(){
											return $("#mdm6Layers").layerManager('miniMapBoxHeight');
										 },
										 onRefreshLists:function(data){
											var sum = data.layers.length+data.services.length+data.outlayers.length;
											$('#mdm6Layers_layerManager_btnLayers2').attr('empty',(sum == 0));
										 },
										 saveStats:function(data){
											saveStats(data);	 
										 }
										 });
							
							
							$('#mdmToolBar').toolBar({
								onAction:function(id){
										switch (id){
											case 'splitscreen': 
												map.ui.splitWindow();
											break;
											case 'contact': 
												$('body').support();
											break;
											case 'share': 
												share.share();
											break;
											case 'print': 
												printControl.printMap();
											break;
											case 'download':
												if($('#menu_mapDownload').length === 0){
													$('#panel-center').menuMapDownload();
												}else{
													$('#panel-center').menuMapDownload('show');
												}
											break;	
										}
								}
							});
		//---------------------------- Activacion selectiva de elementos de interfaz -------------------
							if (!(controls.ui.tool_gps)){
								$("#scaleControl_pos").addClass('hidden_control');
							};
							if (!(controls.ui.toolBar)){
								 $("#mdmToolBar").addClass('hidden_control');
								 $('#baseMapMini').css('top','8px');
								 $('#scaleControl').css('top','8px');
							}
							if (!(controls.ui.layersBar)){
								 $("#mdm6Layers").addClass('hidden_control');
							}
							if (controls.ui.miniBaseMap){
								$('#baseMapMini').baseMapMini({
									data:tree.baseLayers,imgPath:'img/mapaBase',
									baseSelection:function(id){
										map.setBaseLayer(id);
										$("#mdm6DinamicPanel").dinamicPanel('refreshLegend');
									}
								});
							}else{
								$('#baseMapMini').addClass('hidden_control');
							}
			
					//----------------------------Registro de eventos involucrados con interfaz-------------------
						
						MDM6('define','onMoveEnd',function(){
							$("#mdm6DinamicPanel").dinamicPanel('externalEvent','mapChange');
							amplify.publish( 'onMoveEnd');
							
							$('.onmapchanged').each(function(){
								var widgetname = $(this).attr('widgetname');
								switch(widgetname){
									case 'downloadlist':
											$('#'+$(this).attr('id')).downloadlist('mapChanged');
										break;
								}

							})
						});
						
						amplify.subscribe( 'mapReload', function(){
							var mapScale = map.getScale();
							var zoomLevel = map.getZoomLevel();
							
							$("#layersDisplay").layerDisplay('setZoomIcon',mapScale);
							$('#toolAgropecuario').agropecuario('mapChange',zoomLevel);

						});
						
						amplify.subscribe( 'onActiveLayer', function(){
						});
						amplify.subscribe( 'onDeactiveLayer', function(){
						});
					
						amplify.store('hideTutorial',null);
					
						amplify.subscribe( "identifyEconomic",function(data){
							if ($('#ecoTool').attr('id')){
								$('#ecoTool').ecoTool('checkPoint',data);
							}else{
								map.event.identify({lon:data.lon,lat:data.lat},true);
							}
						});
						
						MDM6('define','privateSearch',function(text,func){
							$("#mdm6DinamicPanel").dinamicPanel('privateSearch',{text:text,func:func});
						});
						
						map.loadOverview('B1','mdm6Layers_miniMap');
						$('#mdm6DinamicPanel_inputSearch').focus();
						//map.event.setEventIdentify(function(data){
						
						map.event.setEventIdentify(function(data){
							if(!controls.map.identify.custom){ //si no esta definido función 'identify' dentro de eventos personalizados, identifica de forma normal
								var identify = function(data){
									$("#mdm6DinamicPanel").dinamicPanel('identifyPoint',data);  
								}
								if(isWidgetActive()){
									mdmEventToWidget({event:'identify',data:data,callback:function(data){identify(data);}});	
								}else{
									var toolActive = $('.toolCustomIdentify').attr('id');
									var generic = toolActive;
										if(toolActive && toolActive.substr(0,10) == 'mdmxsig_gt'){
												toolActive = 'generic';
										}
									switch(toolActive){
										case 'toolAgropecuario': //si esta activo herramienta de agropecuario
											var data = {pos:data,func:identify}
											$('#toolAgropecuario').agropecuario('onIdentify',data);   	
										break;
										case 'toolGeoelectorales': //si esta activo herramienta de agropecuario
											var data = {pos:data,func:identify}
											$('#toolGeoelectorales').geoelectorales('onIdentify',data);   	
										break;
										case 'generic': //si esta activo herramienta de agropecuario
											if($('#'+generic).attr('id')){
												var data = {pos:data,func:identify}
												$('#'+generic).generictheme('onIdentify',data);   	
											}
										break;
										default:
											if (window.IplanayCuadernillo) {
												IplanayCuadernillo.abrir(data, map);
											} else {
												identify(data);
											}
										break;
									}
								}
								
								
							}else{
								if ($.isFunction(controls.map.identify.custom))
									controls.map.identify.custom(data);
							}
						});
						refreshMapLayers(map);
						
			} //After init vals
			//********************************************FIN MODULO DE ARRANQUE **************************/
			amplify.subscribe( 'mapAfterLoad', function(){
				startUp.onMapLoad();
				
				//Ajusta Encabezado para INEGI
				/*if(toolsConfig.inegiHeader){
					setTimeout(function(){
						inegiHeader.init(map);
					},1000);
				}*/
			});
			amplify.subscribe( 'whatsHere', function(data){
				denueControl.eventListener({id:'whatshere',value:data});
			});
			amplify.subscribe( 'layerDisplaySpinner', function(data){
				$("#layersDisplay").layerDisplay('controlSpinner',data);
			});
			//startup control
			share.init(map,dataSource);
			//temas genericos
			genericThemeModule.init(map);
			//startup control
			startUp.loadFromShare = function(link){
				share.getValuesFromShare(link,startUp.activeUrlLayers);		
			}
			startUp.loadShareValues = function(link){
				share.loadShareValues();		
			}
			startUp.init(map,tree,dataSource,controls);	
			
			
			
		});
        
    };
    return {init:init};
});