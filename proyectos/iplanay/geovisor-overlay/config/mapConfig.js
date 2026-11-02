define(function(){
   var mapConfig = {
	    defaultLayers:[], //Al definirse capas por default, inhibe cualquier capa activa por archivo tree o por paso de variable URL
        layers:[
            {
                    type:'Wms',
                    label:'Vectorial',		             
		            url:'/cgi-bin/mapserv?map=/opt/map/mdm60/vector_iplanay.map&',
                    tiled:false,
                    format:'png'
            },
	    {
                    type:'Wms',
                    label:'Text',		             
                    url:'/cgi-bin/mapserv?map=/opt/map/mdm60/vector_iplanay.map&',
                    tiled:false,
                    format:'png'
            }
        ],
        projection: "EPSG:4326",
        initialExtent: {
            lon: [-106.68773, 20.73025],
            lat: [-103.72090, 23.22357]
        },
        restrictedExtent: { lon: [-106.68773, 20.73025], lat: [-103.72090, 23.22357] },
        resolutions: [
        611.496226171875,
        305.7481130859375,
        152.87405654296876,
        76.43702827148438,
        38.21851413574219,
        19.109257067871095,
        9.554628533935547,
        4.777314266967774,
        2.388657133483887,
        1.1943285667419434,
        0.5971642833709717,
        0.29858214168548586,
        ],
        buffers: {
        limit: "1000",
        },
		
    }
    
   return mapConfig
   
});
