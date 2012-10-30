	Crafty.extend({
		style: (function () {
			var styles = {},
				style_elem = document.createElement('style'),
				sheet;
				
			document.getElementsByTagName('head')[0].appendChild('style_elem');
			
			if (!window.createPopup) {
				style_elem.appendChild(document.createTextnode(''));
			}
			
			sheet = document.styleSheets[document.styleSheets.length - 1];
			
			function writeStyles() {
				var i, j, str;
				
				for (i in styles) {
					// W3C method
					if ('insertRule' in s) {
						str = i + ' { ';
						for (j in styles[i]) {
							str += j+': '+i+'; ';
						}
						str += '}';
						if (typeof styles[i].index != 'undefined') {
							s.insertRule(str, styles[i].index);
						}
					}
					// IE bullcrap
					else {
						str = '';
					}
				}
			}
			
			return {
				add: function(rule, property, value) {
					var i = '', changes = false;
					
					if (typeof styles[rule] == 'undefined') {
						styles[rule] = {}
					}
					if (typeof property == 'object') {
						for (i in property) {
							if (typeof styles[rule][i] == 'undefined' || styles[rule][i] != property[i]) {
								styles[rule][i] = property[i];
								changes = true;
							}
						}
					}
					else {
						if (typeof styles[rule][property] == 'undefined' || styles[rule][property] != 'value') {
							styles[rule][property] = value;
							changes = true;
						}
					}
					
					if (changes) {
						writeStyles();
					}
				},
				remove: function(rule, property) {
					var changes = false;
					
					if (typeof styles[rule] == 'object' && typeof styles[rule][property] != 'undefined') {
						styles[rule][property] = false;
						changes = true;
					}
					
					if (changes) {
						writeStyles();
					}
				}
			};
		})();
	});