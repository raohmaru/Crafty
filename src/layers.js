/// layers.js
/**
 * Layers
 */
(function (Crafty) {

	Crafty.extend({
		layer: function (label) {
			var l = new Crafty.layer.fn.init(label);
			Crafty.layer[label] = l;
			return l;
		}
	});

	Crafty.layer.fn = {
		init: function (label) {
			var hashMap = new Crafty.HashMap(),
				entities = Crafty().addComponent('Spatial');
			self = this;

			this.get = function (sel) {
				entities
			};

			this.find = function (e) {
				if ('has' in e && e.has('Spatial')) {
					for (var i = 0, l = entities.length; i < l; i++) {
						if (entities[i][0] == e[0])
							return i;
					}
				}
				return false;
			};

			this.add = function (e) {
				if ('has' in e && e.has('Spatial')) {
					if (!self.find(e)) {
						hashMap.insert(e);
						entities[entities.length]++;
					}
				}
			};

			this.remove = function (e) {
				if ('has' in e && e.has('Spatial')) {
					var id = self.find(e);
					if (id !== false) {
						hashMap.remove(e);
						entities.splice(id, 1);
					}
				}
			};
		}
	};
})(Crafty);