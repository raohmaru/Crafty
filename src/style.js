	/**@
	 * #Crafty.style
	 * @category CSS
	 * Helper methods for adding css to a 'stylesheet'. 
	 */
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
				var i, j, str, del;
				
				for (i in styles) {
					del = true
					// W3C method
					if ('insertRule' in s) {
						str = i + ' { ';
						for (j in styles[i]) {
							if (styles[i][j] && j != 'index') {
								str += j+': '+styles[i][j]+'; ';
								del = false;
							}
						}
						str += '}';
						if (typeof styles[i].index != 'undefined') {
							if (del) {
								s.deleteRule(styles[i].index);
							}
							else {
								s.insertRule(str, styles[i].index);
							}
						}
						else {
							if (!del) {
								styles[i].index = s.insertRule(str, s.cssRules.length);
							}
							// the style hasn't been added yet, so there's nothing to delete
						}
					}
					// IE bullcrap
					else {
						str = '';
						for (j in styles[i]) {
							if (styles[i][j] && j != 'index') {
								str += j+': '+styles[i][j]+'; ';
								del = false;
							}
						}
						if (typeof styles[i].index == 'undefined') {
							styles[i].index = s.rules.length;
							s.addRule(i, str, styles[i].index);
						}
						else if (del) {
							s.removeRule(styles[i].index);
						}
						else {
							s.addRule(i, str, styles[i].index);
						}
					}
				}
			}
			
			return {
				/**@
				 * #Crafty.style.add
				 * @comp Crafty.style
				 * @sign Crafty.style.add(String rule, String property, String value)
				 * @sign Crafty.style.add(String rule, Object property)
				 * @param String rule - the css selector. can be any valid css selector
				 * @param String property - The css property to add a rule for
				 * @param String value - The value of the property. Must include unit.
				 * @param Object property - An object of property:value pairs. Shorthand for several add calls
				 *
				 * Adds a css selector, and sets one or more properties and their values
				 * @example 
				 *   Crafty.style.add('.Spatial', 'position', 'absolute');
				 * @example
				 *   Crafty.style.add('.camera.dthree .layer.dthree', {position: 'absolute', perspective: '1000px'});
				 */
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