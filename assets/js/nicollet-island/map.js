$(function () {
	var markers_array = [];
	var mapCanvas = document.getElementById('g-map');
	var mapOptions = {
		center: new google.maps.LatLng(44.9875815, -93.2628985),
		zoom: 16,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	var map = new google.maps.Map(mapCanvas, mapOptions);
	var geocoder = new google.maps.Geocoder();
	function set_map_on_all_markers(map) {
		$.map(markers_array, function (marker) { 
			marker.setMap(map) 
		});
	}
	function clear_markers() {
		set_map_on_all_markers(null);
		markers_array = [];
	}
	function create_marker(latlong, marker_text) {
		var infowindow = new google.maps.InfoWindow({
			content: marker_text
		});
		var position = new google.maps.LatLng(parseFloat(latlong[0]), parseFloat(latlong[1]));
		var marker = new google.maps.Marker({
			animation: google.maps.Animation.DROP,
			position: position
		});
		marker.addListener('click', function() {
			infowindow.open(map, marker);
		});
		markers_array.push(marker);
	}
	function place_markers(year) {
		clear_markers();
		$.getJSON("/assets/js/nicollet-island/data/stories_for_" + year + "_with_geocodes.json", function (households) {
			var latlongs = {};
			$.map(households, function(household) {
				latlong = household["latlong"]
				if (!(latlong in latlongs))	{
					latlongs[latlong] = []
				}
				latlongs[latlong].push(household);
			});
			$.each(latlongs, function(latlong, households) {
				var household_strings = $.map(households, function (household) {
					var people_string = "<ul>" + $.map(household["people"], function(person) { return "<li>" + person["detail"] + "</li>" }).join("") + "</ul>";
					return "<li>" + "<p>" + household["summary"] + people_string + "</p></li>";
				});
				var marker_info = "<h3>" + households[0]["street_address"] +  "</h3><ul>" + household_strings.join("") + "</ul>";
				create_marker(latlong.split(","), marker_info);
			});
			set_map_on_all_markers(map);
		});
	}
	$('.map_change').click(function () {
		$(".map_change").removeClass("interactive_selected");
		$(this).addClass("interactive_selected");
		place_markers($(this).attr("data-year"));
		return false;
	});
	place_markers("1920");
});
