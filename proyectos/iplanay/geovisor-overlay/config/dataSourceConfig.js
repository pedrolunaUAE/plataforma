define(function(){
    var sources = {
	proyAlias:'Cuadernillos IPLANAY',
    	proyName:'mdm6',
        mapEvaluation:0,
		servicesVersion:'mxsig', //determina si los servicios usaros son de INEGI o no, de no ser asi, debera ser un nombre sin espacios ni caracteres especiales
		key:'mdm2fkXGf31xh-HRDdJFozU8HdM12ZmbQe8xkXDRxVkrho',
        mainPath:'',
		//Ejemplo de configuracion a busqueda solar Externa
		search:{
				url:'/mdmSearchEngine/busq-entidades/shard',
				contentType : "application/json; charset=utf-8",
				type: 'GET',
				dataType: "jsonp",
				jsonp:'json.wrf',
				params:{
					wt:'json',
					ident:'true',
					facet:'true',
					'facet.field':'tipo',
					'defType':'edismax',
					qf:'busqueda'				
				}
        },
        layersSeaIde:{
                    url:'/mdmservices/fieldtypes',
					contentType : "application/json; charset=utf-8",
                    type: 'POST',
                    dataType: "json"
        },
		exportList:{
				url:'/mdmservices/export',
				urlGet:'/mdmservices/export',
				type: 'POST',
				contentType : "application/json; charset=utf-8",
				dataType: "json",
				mainPath:false
		},
		saveStats:{
				url:'/mdmservices/stats/layers',
				type: 'POST',
				contentType : "application/json; charset=utf-8",
				dataType: "json",
		},
		share:{
				contentType : "application/json; charset=utf-8",
				url:'/mdmservices/share',
				type: 'POST',
				dataType: "json"
        },
		shareEmail:{
				contentType : "application/json; charset=utf-8",
				url:'/mdmservices/share/email',
				type: 'POST',
				dataType: "json"
        },
        identify:{
				url:'/mdmservices/identify',
				type: 'POST',
				contentType : "application/json; charset=utf-8",
				dataType: "json",
        },
        bufferLayer:{
					url:'/mdmservices/totals',
                    contentType : "application/json; charset=utf-8",
                    type: 'POST',
                    dataType: "json"
        },
        identifyDetail:{
					url:'/mdmservices/query',
                    type:'POST',
                    contentType : "application/json; charset=utf-8",
                    dataType: "json"
        },
		/*
		crossSearch:{
                    url:'/TableAliasV601/busqueda', 
                    contentType : "application/json; charset=utf-8",
                    type: 'POST',
                    dataType: "json",
                    mainPath:false
        },
		deepSearchTranslate:{
                    url:'TableAliasV60beta/busqueda',
                    type: 'POST',
                    dataType: "json",
					contentType : "application/json; charset=utf-8",
					stringify:true,
					params:{
						tabla: 'geolocator',
						pagina: 1,
						searchCriteria: '',
						proyName: 'mdm6',
						whereTipo: ''
					},
                    mainPath:false
		},
		*/
        denue:{
		        	url:'http://10.1.30.101:9090/solr/denue/select',
		            field:'busqueda',
		            type: 'POST',
		            dataType: "jsonp",
		            jsonp:'json.wrf',
                    mainPath:false
        },
        kml:{
			save:'/mdmexport/kml/download',
			read:'/mdmexport/kml/upload'
		},
		gpx:{
            save:{
				save:'/mdmexport/gpx/download',
				read:'/mdmexport/gpx/upload'
            }
		},
		geometry:{
				store:{
					url:'/mdmservices/geometry',
					type: 'POST',
					dataType: "json",
					contentType : "application/json; charset=utf-8"

				},
				addBuffer:{
					url:'/mdmservices/buffer',
					type:'POST',
					dataType:'json',
					contentType:'application/json; charset=utf-8'
				},
				restore:{
					url:'/mdmservices/wkt/geometries',
					type: 'GET',
					dataType: "json",
					contentType : "application/json; charset=utf-8"
				}
		},
		detailTableSpecial:[		
		],
		timeLine:'',
        school:'',
        leyendUrl:'/cgi-bin/mapserv?map=/opt/map/mdm60/vector_iplanay.map&Request=GetLegendGraphic&format=image/png&Version=1.1.1&Service=WMS&LAYER=',
        synonyms:{
        	list:{
	        		/*farmacia:['botica','drogeria'],
	        		banco:['cajero'],
	        		restaurant:['bar','merendero'],
	        		hospital:['clinica'],
	        		hotel:['motel','posada']*/
        		}
        },
	routing:{
	    movePoint:'routing/point/move'
	},
	cluster:{
	    moreLevels:[2.388657133483887,1.1943285667419434,0.5971642833709717,0.29858214168548586],
	    enableOn:{
		layer:'cdenue14'
	    },
	    recordCard:{
		url:'/mdmservices/denue/label',
		type:'POST',
		dataType:'json',
        contentType:"application/json; charset=utf-8",
	    },
	    nodes:{
		url:'/mdmservices/denue/scian',
		type:'POST',
		dataType:'json'
	    },
	    geometry:{
		url:'/mdmservices/wkt/feature',
		type:'POST',
		dataType:'json'
	    }
	},
    displayGeometry:{
        url:'/mdmservices/wkt/feature',
		type:'POST',
		dataType:'json',
        contentType : "application/json; charset=utf-8"
    },
	//logging:'http://10.1.32.5/SISEC2013/jerseyservices/ServicioSesionJson',
	georeferenceAddress:{
	   	url:'https://gaia.inegi.org.mx/NLB/tunnel/map/reversegeocoding',
	    type: 'POST',//POST
	    dataType: "json",
	    contentType : "application/json; charset=utf-8"
	    
	},
	mousePosition:{
	    elevation:{
		url:'https://gaia.inegi.org.mx/NLB/tunnel/map/raster/elevation',
		type:'POST',
        contentType:'application/json; charset=utf-8',    
		dataType:'json'
	    }
	},
	files:{
	    download:'/mdmdownloadfile/download'
	},
    cenago:{
        card:{
            url:'/mdmservices/theme/cg/label',
            type:'POST',
            dataType:'json',
            contentType : "application/json; charset=utf-8",
            stringify:true
        },
        find:{
            url:'/mdmservices/theme/cg/find',
            type:'POST',
            dataType:'json',
            contentType : "application/json; charset=utf-8",
            stringify:true
        }
    },
    windy:{
        getInfo:{
            url:'/mdmservices/wind/infoWinds',
            type:'GET',
            dataType:'json',
            contentType : "application/json; charset=utf-8",
            stringify:false
        },
        display:{
            url:'/mdmservices/wind/getWind',
            type:'GET',
            dataType:'json',
            contentType : "application/json; charset=utf-8",
            stringify:false
        }
    }
    };
    
    return sources;
});