LibCanvas.extract();

/** @class Controls */
atom.declare( 'Controls', {

	initialize: function (player, images) {
		this.player = player;
		this.move = new Controls.Element('move', images);
		this.turn = new Controls.Element('turn', images);
	},

	onTick: function (time) {
		var move = this.move.getValues();
		var turn = this.turn.getValues();

		if (move) {
			this.player.moveStrafe( time*move.x);
			this.player.moveNormal(-time*move.y);
		}

		if (turn) {
			this.player.rotateHorisontal( (time*turn.x).degree() );
			this.player.rotateVertical  ( (time*turn.y).degree() );
		}
	}


});

/** @class Controls */
atom.declare( 'Controls.Element', {

	inside: false,

	minRadius: 40,
	maxRadius: 80,
	pointRadius: 10,

	initialize: function (className, images) {
		var dom = atom.dom.create('canvas');
		this.canvas = dom.first;
		this.canvas.width  = 200;
		this.canvas.height = 200;
		this.ctx = this.canvas.getContext('2d-libcanvas');

		this.shapeOut     = new Circle(100, 100, this.maxRadius + this.pointRadius);
		this.shapeIn      = new Circle(100, 100, this.minRadius);
		this.shapePointer = new Circle(100, 100, this.pointRadius);

		this.images = images;

		dom.addClass('control');
		dom.addClass(className);
		dom.appendTo('body');

		this.bindEvents(dom);

		this.repaint();
	},

	bindEvents: function (dom) {
		var elem = this;

		dom.addEvent('touchstart' , Mouse.prevent);
		dom.addEvent('mousemove', function (e) {
			e.preventDefault();
			elem.changePosition(Mouse.getOffset(e));
		});
		dom.addEvent('touchmove', function (e) {
			elem.checkTouch(e, dom)
		});

		function out (e) {
			e.preventDefault();
			elem.changePosition(null);
		}
		dom.addEvent('mouseout'   , out);
		dom.addEvent('touchcancel', out);
		dom.addEvent('touchleave' , out);
		dom.addEvent('touchend'   , out);
	},

	checkTouch: function (e, dom) {
		var offset, i, diff,
			c = e.changedTouches;
		e.preventDefault();
		offset = dom.offset();

		for (i = 0; i < c.length; i++) {
			diff = new Point(
				c[i].pageX - offset.x,
				c[i].pageY - offset.y
			);

			if (diff.x.between(0, this.canvas.width)
			&&  diff.y.between(0, this.canvas.height)) {
				this.changePosition(diff);
				break;
			}
		}
	},

	getValues: function () {
		if (this.inside) {
			var diff     = this.shapeOut.center.diff(this.shapePointer.center),
				distance = atom.math.hypotenuse(diff.x, diff.y),
				delta    = this.maxRadius - this.minRadius,
				scale    = (distance - this.minRadius) / distance;

			diff.x *= scale / delta;
			diff.y *= scale / delta;

			// diff length is between 0 & 1
			return diff;
		} else {
			return null;
		}
	},

	changePosition: function (point) {
		var diff, distance, center = this.shapeOut.center;

		if (point) {
			diff = center.diff(point);
			distance = atom.math.hypotenuse(diff.x, diff.y);
			this.inside = true;
			if (distance > this.maxRadius) {
				diff.x = Math.floor(diff.x * this.maxRadius / distance);
				diff.y = Math.floor(diff.y * this.maxRadius / distance);
			} else if (distance < this.minRadius) {
				diff.x = 0;
				diff.y = 0;
				this.inside = false;
			}
			this.shapePointer.center
				.set(center)
				.move(diff);
		} else {
			this.inside = false;
		}
		this.repaint();
	},

	repaint: function () {
		var ctx = this.ctx;

		ctx.clearAll();
		ctx.fillStyle = 'rgba(255,255,255,0.3)';
		ctx.drawImage(this.images.get('control'));
		if (this.inside) {
			ctx.drawImage({
				image: this.images.get('point'),
				center: this.shapePointer.center
			});
		}
	}

});