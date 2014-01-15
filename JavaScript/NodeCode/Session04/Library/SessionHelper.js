/**
 * @author Charlie Calvert
 */

/*jshint jquery:true, node:true, devel: true, strict: true */


var SessionHelper = (function() {
	'use strict';

	var fs = require('fs');
	var handlebars = require('handlebars');


	function SessionHelper() {
	}

	// Please not that we convert to a string.
	var readHtml = function(fileName) {
		return String(fs.readFileSync(fileName));
	};

	SessionHelper.prototype.run = function(request) {
		// debugger;
		console.log(request.headers);
		var mainFile = readHtml('./Templates/SessionInfo.html');

		var template = handlebars.compile(mainFile);

		var result = template({
			pageName: request.url,
			userName: request.session.userName,
			visitCount: request.session.visitCount,
			previousPage: request.session.lastPage,
			host : request.headers.host,
			sessionId: request.sessionID,
			referer: request.headers.referer,
			cookie: request.headers.cookie,
			/*connection: request.headers['connection'],
			userAgent: request.headers['user-agent'],
			cacheControl: request.headers['cache-control'],
			cookieName01: request.cookies['cookieName01'],
			cookieName02: request.cookies['cookieName02'],
			cookieName03: request.cookies['cookieName03'], */
			connection: request.headers.connection,
			userAgent: request.headers.user-agent,
			cacheControl: request.headers.cache-control,
			cookieName01: request.cookies.cookieName01,
			cookieName02: request.cookies.cookieName02,
			cookieName03: request.cookies.cookieName03,
			secret: request.secret,
			httpVersion: request.httpVersion
		});

		return result;
	};

	return SessionHelper;

})();

exports.sessionHelper = new SessionHelper();
