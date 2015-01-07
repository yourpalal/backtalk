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

    ["small", "big"].map(function(size) {
        ["red", "yellow", "green", "blue"].map(function(color) {
            btcontext.addFunc({
                patterns: [['a',size,color,'circle'].join(" ")],
                impl: (function() {var s = size, c = color;
                        return function() {
                            ctx.gfx.push(new Drawing.Circle(s, c));
                        };})()
            });
        }, this);
    }, this);
};

Drawing.Context.prototype.update = function(canvas, ctx) {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.gfx.map(function(g) {
        g.draw(ctx);
    });
    this.gfx = [];
};
