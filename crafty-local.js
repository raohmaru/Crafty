/* 
 * This file aggregates all the src/ files at runtime
 * You just need to source this file. The src/ files will be loaded and aggregated and evaluated like a final build of a crafty is
 * When using this, Crafty does not need to be rebuilt after every change to a file
 *
 * WARNING!!!
 * This file is to be used for local development of Crafty ONLY. It does a number of Bad Things to achieve its goals, 
 * and should not be used in a production environment for any reason.
 */

(function (window) {
	var include = [
		'core',
		'intro',
		'HashMap',
		'Spatial',
		'camera',
		'layers',
		'collision',
		'DOM',
		'extensions',
		'canvas',
		'controls',
		'animation',
		'sprite',
		'drawing',
		'isometric',
		'particles',
		'sound',
		'style',
		'storage',
		'html',
		'math',
		'text',
		'loader',
		'outro'
	],
	l = include.length, i, tr = new XMLHttpRequest(), output = '', url, base = '', scripts = document.getElementsByTagName('script');
	for (i=0; i<scripts.length; i++) {
		if (scripts[i].src.indexOf('crafty-local.js') != -1) {
			base = scripts[i].src.replace('crafty-local.js', '')+'/src/';
			break;
		}
	}	
	
	for (i=0; i<l; i++) {
		url = base+include[i]+'.js';
		tr.open("GET", url, false);
		try {
			tr.send(null);
		}
		catch (e) {
			alert("Your security settings prevent access to the local file-system. \n\r Access to restricted URI denied code 1012");
			break;
		}
		output += tr.responseText;
	}
	
	output += "\n//@ sourceURL=crafty.js";
	
	eval(output);
})(window);
