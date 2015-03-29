'use strict';


module.exports.inScope = function(scope) {
    this.parts.forEach(function(f) {
        scope.addFunc(f);
    });
    return scope;
};


module.exports.parts = [ 
    {
        'patterns': ['with $!! as $'],
        'impl': function(ref, val) {
            this.scope.set(ref.name, val);
            return val;
        }
    }
];

