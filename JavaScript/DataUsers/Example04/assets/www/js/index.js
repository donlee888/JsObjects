/*jshint devel: true, browser: true, jquery: true, strict: true */
/*global App: false */

App.Main = (function() {'use strict';

	// Application Constructor
	function Main() {
		console.log("debug: App constructor called");
		$('#data01').empty();
		bindEvents();
	}

	var usePresident = function(i, president) {
		$('#data01').append("<li>" + president.firstName + ' ' + president.lastName + "</li>");
	};

	/*
	 * Bind any events that are required on startup.
	 * Common events: 'load', 'deviceready', 'offline', and 'online'.
	 */
	var bindEvents = function() {
		console.log("debug: App bindEvents called");
		document.addEventListener('deviceready', onDeviceReady, false);

		$.getJSON("index.json", function(json) {
			$('#data01').empty();
			
			// Our callback is the usePresident method above
			$.each(json, usePresident);
			try {
				$('#data01').listview('refresh');
			}
			catch(error) {
				alert(error.message);	
			}
		}).success(function() {
			console.log("csc: success. Loaded index.json");
		}).error(function(jqXHR, textStatus, errorThrown) {
			alert("error calling JSON:" + errorThrown + ". Try JSONLint or JSLint: " + textStatus);
		}).complete(function() {
			console.log("csc: completed call to get index.json");
		});
	};

	// Called when device is fully initialized
	var onDeviceReady = function() {
		console.log("debug: App onDeviceReady called");
		showProgramState();
		showDate();
	};

	var showProgramState = function() {
		var listeningElement = $('.listening');
		var receivedElement = $('.received');
		listeningElement.attr('style', 'display:none;');
		receivedElement.attr('style', 'display:block;');
	};

	var showDate = function() {
		console.log('debug: showDate called');
		var util = new App.Utility();
		$("#curDate").html("Current Date: " + util.getToday());
	};

	return Main;
})();

$(document).ready(function() {"use strict";
	new App.Main();
});
