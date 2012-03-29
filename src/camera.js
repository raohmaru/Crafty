/**
 * Camera
 * ~~~~~~~~~~~~~~
 * 
 * The camera is a viewport into the game world. 
 * 
 * Moving the camera: 
 * 	Cameras have an X and Y, which map to different game world values based on the camera type. These values represent the space between the standard 0,0 view and current position.
 *  Increasing X will pan the viewport to the right. 
 *  Increasing Y will pan the viewport down.
 *
 * Camera types:
 * 	Cameras have several types they can be, which affects how they render the game world.
 *	Types:
 *		Top - Renders the world in a top-down, birds-eye view.
 *		Side - Renders the world from the side, like Mario.
 *		Isometric - Renders the world from a 45 degree angle. Tiles exist as single sprites. (FF Tactics)
 *		IsometricFaces - Renders the world from a 45 degree angle. Tiles exist as boxes with different sprites for the sides (Minecraft)
 *		3DSquare - Renders the world in full 3D, using DOM or SVG elements to create the world itself. All objects exist as faces. (ex. A cube would be 6 DOM elements.) 
 *		3DCanvas - Renders the world using WebGL. Support for this is lacking in browsers, so it isn't recommended.
 *
 * Camera Options:
 *	Cameras accept an optional object containing options to change from defaults.
 *  Parameters:
 *		canvas: boolean - force all rendering onto a Canvas. Has no affect in browsers that do not support canvas
 *		layers: key => value pairs - contains options on what to do with layers. Use null to not render a layer and a float to represent the speed the layer should move relative to the camera
 *
 * 
 */
