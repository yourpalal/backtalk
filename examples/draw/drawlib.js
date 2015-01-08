'use strict';

window.Drawing = {
    Circle: function(size, color) {
        this.radius = {
            big: 30,
            small: 5
        }[size];
        this.color = color;
        this.center = [0, 0];
    },
};

Drawing.Circle.prototype.draw = function(ctx) {

    ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.moveTo(this.center[0], this.center[1] + this.radius);
        ctx.arc(this.center[0], this.center[1], this.radius, 0, 2*Math.PI);
    ctx.fill();
};

Drawing.Context = function() {
    this.gfx = [];
};

Drawing.Context.prototype.register = function(btcontext) {
    var ctx = this;

    btcontext.addFunc({
        patterns: ['a <small|big> <red|yellow|green|blue> circle'],
        impl: function(size, colour) {
            ctx.gfx.push(new Drawing.Circle(size, colour));
        }
    });
};

Drawing.Context.prototype.update = function(canvas, ctx) {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.gfx.map(function(g) {
        g.draw(ctx);
    });
    this.gfx = [];
};
