window.onload = function () {
	//start crafty
	Crafty.init(400, 320);
	
	function generateWorld() {
		//generate the grass along the x-axis
		for (var i = 0; i < 25; i++) {
			//generate the grass along the y-axis
			for (var j = 0; j < 20; j++) {
				grassType = Crafty.math.randomInt(0, 2);
				Crafty.e("Render, Spatial, Texture")
					.texture("images/sprite.png", { x: 16 * grassType, y: 0, frames: 1 })
					.attr({ x: i * 16 + 8, y: j * 16, w: 16, l: 16 });

				//1/50 chance of drawing a flower and only within the bushes
				if (i > 0 && i < 24 && j > 0 && j < 19 && Crafty.math.randomInt(0, 50) > 49) {
					Crafty.e("Render, Spatial, Texture, solid")
						.texture("images/sprite.png", { x: 0, y: 16, frames: 4 })
						.attr({ x: i * 16 + 8, y: j * 16, l: 16, w: 16, h: 16 });
				}
			}
		}

		//create the bushes along the x-axis which will form the boundaries
		for (var i = 0; i < 20; i++) {
		    Crafty.e("Render, Spatial, Texture, wall_top, solid")
		        .attr({ x: i * 16 + 8, y: 0, z: 2, w: 16, l: 16, h: 16 })
//		        .color("red");
				.texture("images/sprite.png", { x: 16 * Crafty.math.randomInt(0, 1), y: 32, frames: 1 });
			Crafty.e("Render, Spatial, Texture, wall_bottom, solid")
				.attr({ x: i * 16 + 8, y: 304, z: 2, w: 16, l: 16 })
				.texture("images/sprite.png", { x: 16 * Crafty.math.randomInt(0, 1), y: 32, frames: 1 });
		}

		//create the bushes along the y-axis
		//we need to start one more and one less to not overlap the previous bushes
		for (var i = 1; i < 19; i++) {
			Crafty.e("Render, Spatial, Texture, wall_left, solid")
				.attr({ x: 8, y: i * 16, z: 2, w: 16, l: 16, h: 16 })
				.texture("images/sprite.png", { x: 16 * Crafty.math.randomInt(0, 1), y: 32, frames: 1 });
			Crafty.e("Render, Spatial, Texture, wall_right, solid")
				.attr({ x: 392, y: i * 16, z: 2, w: 16, l: 16, h: 16 })
				.texture("images/sprite.png", { x: 16 * Crafty.math.randomInt(0, 1), y: 32, frames: 1 });
		}
	}
	
	//the loading screen that will display while our assets load
	Crafty.scene("loading", function () {
		//load takes an array of assets and a callback when complete
		Crafty.load(["images/sprite.png"], function () {
			Crafty.scene("main"); //when everything is loaded, run the main scene
		});

		//black background with some loading text
		Crafty.background("#000");
		Crafty.e("Render, Spatial, Text").attr({ w: 100, l: 20, x: 150, y: 120 })
			.text("Loading");
//			.css({ "text-align": "center" });
	});

	Crafty.scene("main", function() {
		generateWorld();
		

		Crafty.c('Hero', {
			init: function () {
				//setup animations
				this.requires("Render, Spatial, Texture")
				.texture("images/sprite.png", {
					walk_left: { x: 16 * 6, y: 48, frames: 3 },
					walk_right: { x: 16 * 9, y: 48, frames: 3 },
					walk_up: { x: 16 * 3, y: 48, frames: 3 },
					walk_down: { x: 16 * 0, y: 48, frames: 3 },
					stand: { x: 0, y: 48, frames: 1 }
				})
				.applyTexture("stand")
				//change direction when a direction change event is received
				.bind("NewDirection",
					function (direction) {
						if (direction.x < 0) {
							this.applyTexture("walk_left");
						}
						if (direction.x > 0) {
							this.applyTexture("walk_right");
						}
						if (direction.y < 0) {
							this.applyTexture("walk_up");
						}
						if (direction.y > 0) {
							this.applyTexture("walk_down");
						}
						if (!direction.x && !direction.y) {
							this.applyTexture("stand");
						}
					})
				// A rudimentary way to prevent the user from passing solid areas
				.bind('Moved', function (from) {
					if (this.hit('solid')) {
						console.log("solid");
						this.attr({ x: from.x, y: from.y });
					}
				});
				return this;
			}
		});
		
		Crafty.c("RightControls", {
			init: function () {
				this.requires('Multiway');
			},

			rightControls: function (speed) {
				this.multiway(speed, { UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180 });
				return this;
			}
		});
		
		//create our player entity with some premade components
		player = Crafty.e("RightControls, Hero, Collision")
			.attr({ x: 24, y: 16, z: 1, w: 16, l: 16, h: 16 })
			.rightControls(60);
	});

	Crafty.scene("loading");

	










	return;

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

		Crafty.e("Render, Spatial, Color").attr({ x: 30, y: 30, h: 30, w: 30 }).color("red").bind("Tick", function (delta) {
			//console.log(this.x);
			//this.attr("x", this.x + 0.1 * delta);
		});

		Crafty.e("Render, Spatial, Texture").attr({ x: 130, y: 130, h: 16, w: 16 }).texture("images/sprite.png",
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