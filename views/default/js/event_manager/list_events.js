elgg.provide('elgg.event_manager');
var infowindow = null;

elgg.event_manager.execute_search = function() {
	$("#event_manager_result_refreshing").show();

	map_data_only = false;
	if($("#event_manager_result_navigation li.elgg-state-selected a").attr("rel") == "onthemap"){
		map_data_only = true;
		mapBounds = event_manager_gmap.getBounds();
		latitude = mapBounds.getCenter().lat();
		longitude = mapBounds.getCenter().lng();
		distance_latitude = mapBounds.getNorthEast().lat() - latitude;
		distance_longitude = mapBounds.getNorthEast().lng() - longitude;
		if(distance_longitude < 0){
			distance_longitude = 360 + distance_longitude;
		}

		$("#latitude").val(latitude);
		$("#longitude").val(longitude);
		$("#distance_latitude").val(distance_latitude);
		$("#distance_longitude").val(distance_longitude);
	}

	var formData = $("#event_manager_search_form").serialize();

	$.post(elgg.get_site_url() + 'events/proc/search/events', formData, function(response){
		if(response.valid){

			if(map_data_only) {

				if(response.markers) {

					infowindow = new google.maps.InfoWindow();

					var shadowIcon = new google.maps.MarkerImage("//chart.apis.google.com/chart?chst=d_map_pin_shadow",
					        new google.maps.Size(40, 37),
					        new google.maps.Point(0, 0),
					        new google.maps.Point(12, 35));
			        var ownIcon = "//maps.google.com/mapfiles/ms/icons/yellow-dot.png";
			        var attendingIcon = "//maps.google.com/mapfiles/ms/icons/blue-dot.png";

					$.each(response.markers, function(i, event) {
						existing = false;
						if (event_manager_gmarkers) {
							if(event_manager_gmarkers[event.guid]){
								existing = true;
						    }
					  	}
					  	if(!existing){
							var myLatlng = new google.maps.LatLng(event.lat, event.lng);

							markerOptions = {
									map: event_manager_gmap,
									position: myLatlng,
									animation: google.maps.Animation.DROP,
									title: event.title,
									shadow: shadowIcon
								};
							if(event.iscreator){
								markerOptions.icon = ownIcon;
							} else {
								if(event.has_relation){
									markerOptions.icon = attendingIcon;
								}
							}
							var marker = new google.maps.Marker(markerOptions);

							google.maps.event.addListener(marker, 'click', function() {
								infowindow.setContent(event.html);
							  	infowindow.open(event_manager_gmap,marker);
							});

							event_manager_gmarkers[event.guid] = marker;
					  	}
					});
				}

				// make sidebar
				//getMarkersJson();
			} else {
				$('#event_manager_event_list_search_more').remove();
				$('#event_manager_event_listing').html(response.content);
				$("#event_manager_result_refreshing").hide();
			}
		}

		$("#event_manager_result_refreshing").hide();
	}, 'json');
};

elgg.event_manager.list_events_init = function() {
	$('#event_manager_event_search_advanced_enable').click(function() {
		$('#event_manager_event_search_advanced_container, #past_events, #event_manager_event_search_advanced_enable span').toggle();

		if($('#past_events').is(":hidden")) {
			$('#advanced_search').val('1');
		} else {
			$('#advanced_search').val('0');
		}
	});

	$('#event_manager_event_list_search_more').live('click', function()	{
		clickedElement = $(this);
		clickedElement.html('<div class="elgg-ajax-loader"></div>');
		offset = parseInt($(this).attr('rel'), 10);

		$("#event_manager_result_refreshing").show();
		if($('#past_events').is(":hidden") == true) {
			var formData = $("#event_manager_search_form").serialize();
		} else {
			var formData = $($("#event_manager_search_form")[0].elements).not($("#event_manager_event_search_advanced_container")[0].children).serialize();
		}

		$.post(elgg.get_site_url() + 'events/proc/search/events?offset='+offset, formData, function(response) {
			if(response.valid) {
				$('#event_manager_event_list_search_more').remove();
				//$(response.content).insertAfter('.search_listing:last');
				$('#event_manager_event_listing').append(response.content);
			}
			$("#event_manager_result_refreshing").hide();
		}, 'json');
	});

	$('#event_manager_search_form').submit(function(e) {
		elgg.event_manager.execute_search();
		e.preventDefault();
	});

	$("#event_manager_result_navigation li a").click(function() {
		if(!($(this).parent().hasClass("elgg-state-selected"))){
			selected = $(this).attr("rel");

			$("#event_manager_result_navigation li").toggleClass("elgg-state-selected");
			$("#event_manager_event_map, #event_manager_event_listing").toggle();

			$('#search_type').val(selected);

			if(selected == "onthemap"){
				initMaps('event_manager_onthemap_canvas', true);
			} else {
				$("#event_manager_onthemap_sidebar").remove();
				elgg.event_manager.execute_search();
			}
		}
	});
};

elgg.register_hook_handler('init', 'system', elgg.event_manager.list_events_init);