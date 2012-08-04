window.onload = function () {
	//start crafty
	Crafty.init(400, 320);

	//turn the sprite map into usable components
	Crafty.sprite(16, "images/sprite.png", {
		grass1: [0, 0],
		grass2: [1, 0],
		grass3: [2, 0],
		grass4: [3, 0],
		flower: [0, 1],
		bush1: [0, 2],
		bush2: [1, 2],
		player: [0, 3]
	});

	var animation = {
		0: {
			texture: "walkLeft",
		},
		5: {
			attr: { x: this.x - 15 },
		},
		6: {
			texture: "madRun"
		},
		20: {
			tween: {
				ease: "easeOutExpo",
				path: "crazyWalk"
			}
		}
	};

	Crafty.load(["images/sprite.png"], function () {


		Crafty.bind("Tick", function (time) {
			//console.log(time);
		});

		Crafty.e("Render, Spatial, Color").attr({ x: 30, y: 30, l: 30, w: 30 }).color("red").bind("Tick", function (delta) {
			//console.log(this.x);
			//this.attr("x", this.x + 0.1 * delta);
		});

		Crafty.e("Render, Spatial, Texture").attr({ x: 130, y: 130, l: 16, w: 16 }).texture("images/sprite.png",
			{
				dancingFlowers: { x: 0, y: 16, frames: 4 }
			}).applyTexture("dancingFlowers").bind("Tick", function (delta) {
				//console.log(this.x);
				//this.attr("x", this.x + 0.1 * delta);
			});

		Crafty.timer.FPS(30);
	});

	return;

};