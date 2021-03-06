/** @class Render */
atom.declare('Render', {

	gl: null,
	canvas: null,
	program: null,

	lightDirection  : vec3.create([ 0.3, -0.5,  0.8]),
	directionalColor: vec3.create([ 0.9,  0.8,  0.4]),
	ambientColor    : vec3.create([ 0.1,  0.2,  0.3]),

	initialize: function (onReady) {
		this.viewProjMatrix = mat4.create();
		this.items = [];

		vec3.negate(vec3.normalize(this.lightDirection));

		this.glInit();
		this.shadersInit(onReady);

		this.container = new Box.Container(this.gl);
	},

	/** @param {Image} image */
	setTexture: function (image) {
		this.texture = Utils.loadTexture(this.gl, image);
	},

	/** @param {Voxel} voxel */
	addItem: function (voxel) {
		this.items.push( voxel.buildBuffers(this.container) );
	},

	/** @param {Player} player */
	positionCamera: function (player) {
		var view, proj;

		view = mat4.identity( mat4.create() );
		mat4.rotate   ( view, player.angleVertical  , [1, 0, 0]);
		mat4.rotate   ( view, player.angleHorisontal, [0, 1, 0]);
		mat4.translate( view, player.cameraVector );

		proj = mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, mat4.create());

		mat4.multiply(proj, view, this.viewProjMatrix);
	},

	redraw: function () {
		var gl = this.gl, i, uniforms = this.program.uniforms;

		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear   (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable  (gl.CULL_FACE);

		gl.disable(gl.DEPTH_TEST);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		gl.enable(gl.BLEND);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		gl.uniform1i(uniforms['sampler'], 0);
		gl.uniformMatrix4fv(uniforms['viewProjMatrix'], false, this.viewProjMatrix);

		gl.uniform3fv( uniforms['ambientColor']     , this.ambientColor );
		gl.uniform3fv( uniforms['directionalColor'] , this.directionalColor );
		gl.uniform3fv( uniforms['lightingDirection'], this.lightDirection);

		for (i = 0; i < this.items.length; i++) {
			this.items[i].drawItem(gl, this.program);
		}
	},

	/** @private */
	glInit: function () {
		var gl, canvas;

		canvas = atom.dom('canvas#view').first;

		gl = Utils.getContext(canvas);

		if (!gl) {
			throw new Error('Fail getting WebGL context');
		}

		gl.viewportWidth  = canvas.width;
		gl.viewportHeight = canvas.height;
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable(gl.DEPTH_TEST);

		this.gl     = gl;
		this.canvas = canvas;
	},

	/** @private */
	createUniform: function (name) {
		this.program.uniforms[name] = this.gl.getUniformLocation(this.program, name);
	},

	/** @private */
	createAttribute: function (name) {
		var gl = this.gl, program = this.program;
		program.attributes[name] = gl.getAttribLocation(program, name);
		gl.enableVertexAttribArray(program.attributes[name]);
	},

	/** @private */
	createVariables: function () {
		this.createAttribute('textureCoord');
		this.createAttribute('vertexNormal');
		this.createAttribute('vertexPosition');

		this.createUniform('sampler');
		this.createUniform('modelMatrix');
		this.createUniform('viewProjMatrix');
		// light
		this.createUniform('ambientColor');
		this.createUniform('directionalColor');
		this.createUniform('lightingDirection');
	},

	/** @private */
	shadersInit: function (onReady) {
		var gl = this.gl;

		Utils.loadShaders(gl, [ 'fragment', 'vertex' ], function (shaders) {
			var program = this.program = gl.createProgram();
			gl.attachShader(program, shaders['vertex']  );
			gl.attachShader(program, shaders['fragment']);
			gl.linkProgram (program);

			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				throw new Error('Could not initialize shaders');
			}

			gl.useProgram(program);

			program.uniforms   = {};
			program.attributes = {};

			this.createVariables();

			onReady.call(this);
		}.bind(this));

	}

});
