var map;
var marker = {};

function initializeMap() {
	map = new google.maps.Map(document.getElementById('map-canvas'), {
		center: { lat: lat, lng: lng},
		zoom: 19,
		disableDefaultUI: true

	});
}

function updateMarkers() {
	navigator.geolocation.getCurrentPosition(function(position) {
		var selfData = {
			teamname: teamname,
			password: password,
			userid: userid,
			lat: position.coords.latitude,
			lng: position.coords.longitude,
			photo: photo,
			name: fullname,
		};
		var posting = $.post('update', selfData);
		posting.done(function(members) {
			var keep = {};
			for(id in members) {
				var member = members[id];
				keep[id] = 1;
				if(marker[id] === undefined) {
					marker[id] = new google.maps.Marker({
						position: new google.maps.LatLng(member.lat, member.lng),
						map: map,
						icon: member.photo,
						title: member.name
					});
				} else {
					marker[id].setPosition(new google.maps.LatLng(member.lat, member.lng));
				}
			}
			for(id in marker) {
				if(keep[id] === undefined) {
					marker[id].setMap(null);
					delete marker[id];
				}
			}
		});
	});
}

// load complete
$(document).ready(function() {
	navigator.geolocation.getCurrentPosition(function(position) {
		lat = position.coords.latitude;
		lng = position.coords.longitude;
		$("#nav").load("nav"); 
		initializeMap();
		setInterval(updateMarkers, 1000);
	});
	$.ajaxSetup({ cache: true });
});