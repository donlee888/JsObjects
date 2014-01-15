/**
 * @author Charlie Calvert
 */
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

/** 
 * Test if a folder exists, if it does not, make it
 */
var ensureDir = function(folder) {
	if (!fs.existsSync(folder)) {
		mkdirp(folder);	
	}
	return folder;
};

/** 
 * Format the JSON that holds a two dimensional array of
 * numbers representing a grid.
 */
var prettyPrintGrid = function(grid) {
	data = JSON.stringify(grid);
	var result = data.replace(/\[\"/g, '\n\t[');
	return result.replace(']]', ']\n]');
};

/**
 * Be sure we start with a path separator.
 */ 
var ensureStartsWithPathSep = function(fileName) {
	if (fileName.substring(0, 1) !== path.sep) {
		fileName = path.sep + fileName;
	}
	return fileName;
};

var ensureEndsWithPathSep = function(fileName) {
	if (fileName.substring(fileName.length, 1) !== path.sep) {
		fileName = fileName + path.sep ;
	}
	return fileName;
};

/**
 * All I'm really doing here is reminding myself that path.join
 * solves the problem of properly appending a file name onto a path
 * 
 * @param {Object} pathName
 * @param {Object} fileName
 */
var elfJoin = function(pathName, fileName) {
	return path.join(pathName, fileName); 
};

exports.ensureDir = ensureDir;
exports.prettyPrintGrid = prettyPrintGrid;
exports.ensureStartsWithPathSep = ensureStartsWithPathSep;
exports.ensureEndsWithPathSep = ensureEndsWithPathSep;
exports.elfJoin = elfJoin;