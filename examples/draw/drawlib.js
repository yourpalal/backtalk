'use strict';

window.Drawing = {
    width: 0,
    height: 0,
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


Drawing.makeObjectContext = function(object, scope) {
    scope.addFunc({
        patterns: ['a <bit|pixel> <left of|right of|above|below> center',
                   'at $ <pixel|pixels> <left|right> of center'],
        impl: function() {
            var how, much, lr, what = "center";
            if (arguments[0] == 'bit' || arguments[0] == 'pixel') {
                how = arguments[0];
                much = 1;
                lr = arguments[1];
            } else if (arguments.length == 3) {
                much = arguments[0];
                how = arguments[1];
                lr = arguments[2];
            }


            if (how === 'bit') { much = 5 }
            if (lr === 'left') { much *= -1 }
            if (what === 'center') { what = Drawing.width / 2; }

            object.center[0] = what - much;
        }
    });
};

Drawing.Context.prototype.register = function(btcontext) {
    var ctx = this;

    btcontext.addFunc({
        patterns: ['a <small|big> <red|yellow|green|blue> circle'],
        impl: function(size, colour) {
            var circle = new Drawing.Circle(size, colour);
            ctx.gfx.push(circle);

            Drawing.makeObjectContext(circle, this.scope);

            if (this.newSubEval) {
                this.eval(this.body);
            }
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
