'use strict';

window.Drawing = {
    width: 0,
    height: 0,
    Circle: function(size, color) {
        this.radius = size;
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
    scope.addCommand(['a <bit|pixel>:which <left of|right of|above|below>:direction center',
                   'at $:count <pixel|pixels> <left of|right of|above|below>:direction center'],
        function(args) {
            var count = args.choose("which", [5, 1], args.get("count"));
            if (args.named.direction % 2 == 0) {
              // left, above = -
              count *= -1;
            }

            if (args.named.direction > 1) {
              // up/down
              object.center[1] = (Drawing.height / 2) + count;
            } else {
              // left/right
              object.center[0] = (Drawing.width / 2) + count;
            }

            return object;
        });
};

Drawing.Context.prototype.register = function(btcontext) {
    var ctx = this;

    btcontext.addFunc(['a <small|big>:size <red|yellow|green|blue>:colour circle :'],
        function(args, evaluator) {
            var circle = new Drawing.Circle(args.choose("size", [5, 30]), args.choose("colour", ["red", "yellow", "green", "blue"]));
            ctx.gfx.push(circle);

            if (args.body) {
              Drawing.makeObjectContext(circle, this.scope);
              return evaluator.makeSub().eval(args.body);
            } else {
              return circle;
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
