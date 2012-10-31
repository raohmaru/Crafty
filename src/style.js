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
				
			document.getElementsByTagName('head')[0].appendChild(style_elem);
			
			if (!window.createPopup) {
				style_elem.appendChild(document.createTextNode(''));
			}
			
			sheet = document.styleSheets[document.styleSheets.length - 1];
			
			function writeStyles() {
				var i, j, str;

				for (i in styles) {
					// W3C method
					if ('insertRule' in sheet) {
						str = i + ' { ';
						for (j in styles[i]) {
							if (j != 'index' && styles[i][j]) {
								str += j+': '+styles[i][j]+'; ';
							}
						}
						str += '}';
						if (typeof styles[i].index != 'undefined') {
							// insertRule will not overwrite a rule at that position. 
							// It will instead shift everything at the position and above up one.
							// If we want to replace a rule, we have to delete it first
							
							// It seems that index positions are not fixed in stone. 
							// Be very careful about deleting a rule without inserting at the same position
							// I'm worried the index positions will break if you do
							sheet.deleteRule(styles[i].index);
							sheet.insertRule(str, styles[i].index);
						}
						else {
							styles[i].index = sheet.insertRule(str, sheet.cssRules.length);
						}
					}
					// IE bullcrap
					else {
						str = '';
						for (j in styles[i]) {
							if (j != 'index' && styles[i][j]) {
								str += j+': '+styles[i][j]+'; ';
							}
						}
						if (typeof styles[i].index == 'undefined') {
							styles[i].index = sheet.rules.length;
							sheet.addRule(i, str, styles[i].index);
						}
						else {
							sheet.removeRule(styles[i].index);
							sheet.addRule(i, str, styles[i].index);
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
		})()
	});