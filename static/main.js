
var route_point_fields = ['ip','location','isp','isp_nationality','cable_name','port','nsp','nsp_nationality'];

var map;
var geocoder;

var temp_route_marker = [];
var temp_route_polyline = null;
var routes = [];

// get the map tiles
$.ajax({
    url: "/at",
    type: "GET",
    async: true,
    dataType: 'json',
    success: function(data) {
		L.mapbox[data.name] = data.t;
		map = L.mapbox.map('map', 'mapbox.streets').setView([45.50, -73.567],5);
		geocoder = L.mapbox.geocoder('mapbox.places');
    }
});

// get the stored routes from the server
$.get('/today_routes',function(data){
	(JSON.parse(data)).forEach(addRoute);
});

// get the internet exchange points
$.ajax({
    url: "/ixp",
    type: "GET",
    async: true,
    dataType: "json",
    success: function(data) {
    	for(ixp  in data.features) {
    		var description = '<b>Internet Exchange Point (IXP) </b><br>'
    		for (ex in data.features[ixp].properties.exchanges){

    			description += data.features[ixp].properties.exchanges[ex].slug + '<br>';
    		}
    		var url = data.features[ixp].properties.exchanges[ex].url;
    		description += ($('<div>').append($('<a>').attr('href',url).attr('target',"_blank").html(url))).html();
    		data.features[ixp].properties.description = description;
				// console.log(data.features[ixp].type);
				// data.features[ixp].type = 'ixp';
    	}
 	// 	var myLayer = L.mapbox.featureLayer().setGeoJSON(data.features).addTo(map);
		L.geoJson(data.features, {
    // style: function (feature) {
    //     return {color: feature.properties.color};
    // },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.description);
				layer.type = 'ixp';
				layer.on("dblclick", function () {
						if(temp_route_marker.length > 0){
							var marker = temp_route_marker.pop();
							map.removeLayer(marker);
							temp_route_marker.push(layer);
							update_route_polyline();
							console.log('route update');
						}
				    return false;
				});
    }
}).addTo(map);
    }
});


function init_route() {
	route_menu_enable(true);
	temp_route_polyline = L.polyline([],  {color: 'red'}).addTo(map);
	add_route_point();
}

function add_route_point() {
	var index = create_route_input();
	var route_marker = createMarker("dynamic_route_point",undefined,true);//; create_route_marker(index);
	temp_route_marker.push(route_marker);
	// route_marker.on("dblclick", function () {
	//     //my dblclick stuff
	// 		console.log('hi');
	//     return false;
	// });

	temp_route_polyline.addLatLng([
		route_marker.getLatLng().lat,
		route_marker.getLatLng().lng]);
	route_marker.on("drag",function() {
		update_route_polyline();
	});
	return route_marker;
}

var lastHue = 0;
function next_route_color(){
	var clr = new HSLColour(lastHue, 100, 50);
	lastHue = (lastHue + 222.5) % 360;
	return clr.getCSSHexadecimalRGB();
}

function update_route_polyline() {
	latlngs = [];
	for(var m = 0; m < temp_route_marker.length; m++) {
		latlngs.push([
			temp_route_marker[m].getLatLng().lat,
			temp_route_marker[m].getLatLng().lng]);
	}
	temp_route_polyline.setLatLngs(latlngs);
}

function input_location_key(field) {
	console.log('key');
	console.log(field.attr('id'));
}

function create_input_field(id_ext, index){
	var length = $("#route_table > tbody > tr").length;
	var td = $("<td>");
	var td_in = $("<input>")
		.attr("id",id_ext+'_'+index)
		.appendTo(td);
	// if(id_ext == 'location'){
	// 		td.bind('keypress', function(e) {
	// 			console.log(e.keyCode);
	// 			console.log(e);
	// 		});
		// td_in.attr('onkeypress','input_location_key('+("route_point_"+(length-1)+'_'+id_ext)+')');
	// }
	return td;
}

function create_route_input() {
	var index = $("#route_table_body > tr").length;
	var line = $("<tr>");
		// .attr("id","route-row-"+index)
		// .attr("class","route-point-descr");
	// number
	$("<td>"+(index+1)+"</td>")
		.attr("align","center")
		.appendTo(line);

	var fields = route_point_fields;
	for(fi in fields){
		create_input_field("route_point_"+fields[fi],index).appendTo(line);
	}
	line.appendTo($("#route_table_body"));
	var location_field = $('#route_point_location_'+index);
	location_field.attr('route_index',index);
	location_field.attr('value','search location');
	location_field.attr('onFocus',"this.value=''");
	location_field.keypress(function(event){
			// console.log(event);
			if(event.which == 13) {
				console.log(event.target.value);
				if(temp_route_marker[event.target.getAttribute('route_index')].type != 'dynamic_route_point') {
					console.log('not movable point');
					return;
				}
				geocoder.query(event.target.value,function(err, data){
					// console.log(err);
					// console.log(data);
					if(data !== undefined){
						// console.log(event.target.getAttribute('route_index'));
						temp_route_marker[event.target.getAttribute('route_index')].setLatLng(data.latlng);
						map.panTo(data.latlng);
						update_route_polyline();
					}
				});
			}
	});
	return index;
}

function create_tracker_input() {
	// var table = $("#tracker_table > tbody > tr");
	var length = $("#tracker_table > tbody > tr").length;
	var line = $("<tr>")
		.attr("id","tracker-row-"+length);
		// .attr("class","route-point-descr");
	// number
	$("<td>"+length+"</td>")
		.attr("align","center")
		.appendTo(line);
	tracker_create_input_field('tracker_name').appendTo(line);
	tracker_create_input_field('company').appendTo(line);
	tracker_create_input_field('nationality').appendTo(line);
	line.appendTo($("#tracker_table_body"));
	return length;
}

function tracker_create_input_field(id_ext){
	var length = $("#tracker_table > tbody > tr").length;
	var td = $("<td>");
	var td_in = $("<input>")
		.attr("id","tracker_"+(length-1)+'_'+id_ext)
		.appendTo(td);
	return td;
}

// function create_route_marker(id) {
// 	var route_marker = createMarker("route_point",undefined,true);
// 	var coordinate = route_marker.getLatLng();
// 	$("#route_point_"+id+"lat").val(coordinate.lat);
// 	$("#route_point_"+id+"lng").val(coordinate.lng);
// 	route_marker.on("drag",function() {
// 		$("#route_point_"+id+"lat").val(route_marker.getLatLng().lat);
// 		$("#route_point_"+id+"lng").val(route_marker.getLatLng().lng);
// 		update_route_polyline();
// 	});
// 	return route_marker;
// }


function route_done() {
	var points = []
	route_menu_enable(false);
	var fields = route_point_fields;
	for(var m = 0; m < temp_route_marker.length; m++) {
		var router_marker = temp_route_marker[m];
		// if(router_marker.type == 'dynamic_route_point') {
		// 	router_marker.setIcon(get_icon(router_marker.type,false));
		// }
		router_marker.dragging.disable();
		var point = {}
		if($('#route_point_location_'+m)[0].value == 'search location'){
			$('#route_point_location_'+m)[0].value = '';
		}
		for(fi in fields){
			point[fields[fi]] = $('#route_point_'+fields[fi]+'_'+m)[0].value;
		}
		if(router_marker.type == 'dynamic_route_point'){
			point.type = 'regular_route_point'
			map.removeLayer(temp_route_marker[m]);
		} else {
			point.type = router_marker.type;
		}
		// point['ip'] = $('#route_point_ip_'+m)[0].value;
		// point['location'] = $('#route_point_location_'+m)[0].value;
		// point['isp'] = $('#route_point_isp_'+m)[0].value;
		// point['isp_nationality'] = $('#route_point_isp_nationality_'+m)[0].value;
		// point['cable_name'] = $('#route_point_cable_name_'+m)[0].value;
		// point['port'] = $('#route_point_port_'+m)[0].value;
		// point['nsp'] = $('#route_point_nsp_'+m)[0].value;
		// point['nsp_nationality'] = $('#route_point_nsp_nationality_'+m)[0].value;

		point['coordinate'] = [router_marker.getLatLng().lat, router_marker.getLatLng().lng];
		points.push(point);

	}
	temp_route_marker = [];
	temp_route_polyline = null;
	// $(".route-point-descr").remove();
	$("#route_table_body").empty();

	var url = $('#route_url')[0].value;
	var description = $('#route_description')[0].value;
	var total_km = $('#route_total_km')[0].value;
	var datasize = $('#route_datasize')[0].value;
	var co2 = $('#route_co2')[0].value;

	var tracker_no = $("#tracker_table_body tr").length;
	console.log('number of trackers');
	var trackers = [];
	for(var t = 0; t < tracker_no; t++) {
		var tracker = {}
		tracker['tracker_name'] = $('#tracker_'+t+'_tracker_name')[0].value;
		tracker['company'] = $('#tracker_'+t+'_company')[0].value;
		tracker['nationality'] = $('#tracker_'+t+'_nationality')[0].value;
		trackers.push(tracker);
		// console.log(tracker);
	}
	$('#tracker_table_body').empty();
	// console.log(JSON.stringify(trackers));
	// console.log(trackers);
	// console.log(points);
	route = {
		url : url,
		description : description,
		total_km : total_km,
		datasize : datasize,
		co2 : co2,
		points : points,
		trackers : trackers
	};
	addRoute(route);

	$.post('/newroute',{
		url: url,
		description: description,
		total_km: total_km,
		datasize: datasize,
		co2: co2,
		points: JSON.stringify(points),
		trackers : JSON.stringify(trackers)
		// color: temp_route_color
	},function(){
		console.log('new route sent');
	});
}

function route_cancel(){
	route_menu_enable(false);

	for(var m = 0; m < temp_route_marker.length; m++) {
		var router_marker = temp_route_marker[m];
		if(router_marker.type == 'dynamic_route_point'){
			map.removeLayer(temp_route_marker[m]);
		}
	}

	temp_route_marker = [];
	update_route_polyline();
	temp_route_polyline = null;
	// $(".route-point-descr").remove();
	$("#route_table_body").empty();

	$('#tracker_table_body').empty();
}

function route_menu_enable(enable) {
	$("#input_add_route").prop('disabled', enable);
	$(".route_option").prop('disabled', !enable);
	if(enable) {
		$("#input_add_marker").prop('disabled',true);
	} else {
		$("#input_add_marker").prop('disabled',false);
	}
}

function marker_menu_enable(enable) {
	$("#input_add_marker").prop('disabled', enable);
	$(".marker_option").prop('disabled', !enable);
	if(enable) {
		$("#input_add_route").prop('disabled',true);
	} else {
		$("#input_add_route").prop('disabled',false);
	}
}

function createMarker(type, coordinate, temporary) {
	if (coordinate === undefined)
		coordinate = map.getCenter();
	if (temporary === undefined)
		temporary = true;
	// console.log(coordinate);
	var marker = L.marker(coordinate, {
	    icon: get_icon(type,temporary),
	    draggable: temporary,
	}).addTo(map);
	marker.type = type;
	// marker.bindPopup("<b>Hello world!</b><br>I am a popup.");
	return marker;
}


function get_icon(type,is_temp) {
	if(is_temp === undefined)
		is_temp = false;
	var color = is_temp ? "#fa0" : "#a0a0a0";
	var icon = "prison"; //tracker
	//if (type == "tracker")
	if (type == "cookie") {
		icon = "roadblock";
	} else if(type == "dynamic_route_point") {
		icon = "circle";
	} else if(type == 'route_start'){
		icon = 'campsite'
	} else if(type == 'route_destination'){
		icon = 'star'
	}

	return L.mapbox.marker.icon({
	        'marker-size': 'medium',
	        'marker-symbol': icon,
	        'marker-color': color,
	    });
}

function marker_done() {
	tempMarker.setIcon(get_icon(tempMarker.type,false));
	tempMarker.dragging.disable();

	// var lat_ = $("#marker_latitude").val();
	// var lng_ = $("#marker_longitude").val();
	//console.log(lat_,lng_);
	var location = "";
	// locationQuery(lat_,lng_);
	marker_menu_enable(false);
}

function readLocation(geoJSON) {
	// concat neighborhood,place,region,country
	var contexts = geoJSON.features[0].context;
	var searches = ["neighborhood","place","region","country"];
	var returnPart = ["","","",""];
	for(var c = 0; c < contexts.length; c++) {
		var id = contexts[c].id;
		//console.log(id);
		for(var s = 0; s < searches.length; s++) {
			if(id.startsWith(searches[s])) {
				//console.log("found: "+searches[s]+ " > "+contexts[c].text);
				returnPart[s] = " "+contexts[c].text;
			}
		}
	}
	//console.log(returnPart.join());
	return returnPart.join();
}


// var geoCode = geocoder.query('Montreal',function(err, data){
// 	console.log(data);
// });

// console.log(geoCode);

// function locationQuery(lat_,lng_) {
// 	geocoder.reverseQuery(
// 		{lat:lat_,lng:lng_},
// 		function(err, data) {
// 			if(err !== null) {
// 				console.log(err);
// 			}
// 			if(data !== null) {
// 				location = readLocation(data);
// 				//console.log(JSON.stringify(latest));
// 			}
// 			// need the data in order to finnish popup.
// 			tempMarker.bindPopup("<p>"+tempMarker.type+"<br>"
// 				+$("#marker_description").val()
// 				+"<br>IP: "+$("#marker_IP").val()
// 				+"<br>location:"+location+"</p>");
// 				// reset all values to ""
// 				$(".marker_value").val("");
// 				// and clear tempMarker
// 				tempMarker = null;
// 		});
// }

function showMap(err, data) {
    if (data.lbounds) {
        map.fitBounds(data.lbounds);
    } else if (data.latlng) {
        map.setView([data.latlng[0], data.latlng[1]], 13);
    }
}

function addRoute(route){

	// console.log(route);
	var id = routes.length;
	routes.push(route);
	route_box = $('<div>')
		.attr("id","route-"+id)
		.attr("class","routeBox");
	var title = $('<div>');
	title.html('Route: '+(routes.length - 1));
	title.appendTo(route_box);

	var url = $('<span>').html('URL: ' + route.url);
	var description = $('<span>').html(' / description: ' + route.description);
	var total_km = $('<span>').html(' / Total km: ' + route.total_km);
	var datasize = $('<span>').html(' / Data size: ' + route.datasize);
	var co2 = $('<span>').html(' / CO2: ' + route.co2);

	var general = $('<div>');
	url.appendTo(general);
	description.appendTo(general);
	total_km.appendTo(general);
	datasize.appendTo(general);
	co2.appendTo(general);
	general.appendTo(route_box);

	var table = $('<table>');
	th = $('<thead>');
	td = $('<th>').html('#').appendTo(th);
	td = $('<th>').html('IP').appendTo(th);
	td = $('<th>').html('Location').appendTo(th);
	td = $('<th>').html('ISP').appendTo(th);
	td = $('<th>').html('ISP nationality').appendTo(th);
	td = $('<th>').html('Cable name').appendTo(th);
	td = $('<th>').html('port in/out').appendTo(th);
	td = $('<th>').html('NSP').appendTo(th);
	td = $('<th>').html('NSP nationality').appendTo(th);
	th.appendTo(table)
	coords = [];

	// console.log(route.points);
	var fields = route_point_fields;
	for(var p = 0; p < route.points.length; p++){
		var point = route.points[p];
		row = $('<tr>');
		td = $('<td>').html(p).appendTo(row);
		for(pi in fields){
			td = $('<td>').html(point[fields[pi]]).appendTo(row);
		}
		row.appendTo(table);
		coords.push(point.coordinate);

		if(point.type == 'regular_route_point'){
			if(p == 0)
				type = 'route_start';
			else if(p == (route.points.length - 1))
				type = 'route_destination';
			var marker = createMarker(type,point.coordinate,false,false);
			marker.bindPopup('<table> <thead>' + th.html() + ' </thead> '+row.html() + '</table>');
		}
		// TODO for non 'regular_route_point' add popup info
	}

	table.appendTo(route_box);

	var tr_table = $('<table>');
	th = $('<thead>');
	td = $('<th>').html('#').appendTo(th);
	td = $('<th>').html('Tracker name').appendTo(th);
	td = $('<th>').html('Company').appendTo(th);
	td = $('<th>').html('Nationality').appendTo(th);
	th.appendTo(tr_table)

	if('trackers' in route){
		// console.log('found! ' + route.trackers.length);
		for(var p = 0; p < route.trackers.length - 1; p++){
			var tracker = route.trackers[p];
			row = $('<tr>');
			td = $('<td>').html(p).appendTo(row);
			td = $('<td>').html(tracker.tracker_name).appendTo(row);
			td = $('<td>').html(tracker.company).appendTo(row);
			td = $('<td>').html(tracker.nationality).appendTo(row);
			row.appendTo(tr_table);
		}
	}

	tr_table.appendTo(route_box);

	// console.log(coords);
	route_polyline = L.polyline(coords,  {color: next_route_color()}).addTo(map);
	route_polyline.bindPopup('<p>Route:'+ id +'</p>')
	route_box.appendTo($('#routes'));
	// console.log('route added');
}
