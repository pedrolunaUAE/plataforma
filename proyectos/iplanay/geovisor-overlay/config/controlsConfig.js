// JavaScript Document
define(function(){
	var ui = {
			ui:{	denueTurista:false, //herramienta ¿Que hay aqui?
					miniBaseMap:false,
					startupTotorial:true,
					layersBar:true, //barra de temas
					autoOpenThemeBar:false,
					toolBar:true, //barra de descarga compartir, imprimir y ayuda
					tool_gps:true //boton GPS en control de vista
				},
			map:{
					geolocation:false,
					identify:{
						enable:true,
						createMarker:true,
						custom:null,
						fixedLayer:null
					},
					elevation:false,
					onOver:{
						showPolygon:false,
						color:{
							filled:"none",
							size:2,
							line:"#01FCEF"
						},
						changeDisplayOn:305.74811
					},
					level:true,
					mousewheel:{
						disable:false,
						message:'No se activara por ahora'
					}
				},
			system:{
					activeCookie:true,
					urlShareVars:true //complementa url con variables de vista actual para compartir
				}
		}
	return ui;
})

