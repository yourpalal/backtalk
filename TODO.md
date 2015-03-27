enable bare/var patterns like <$|something|else>
enable optional words like "?just <$|one|two|three> pixels to the left"

enable better function patterns with named args, eg:

patterns for one thing:

    just much:a how:<pixel|bit> direction:<left|right> of ref:<$|center>
    just much:$ how:<pixel|pixels> direction:<left|right> of ref:<$|center>

    function(much, how, direction, ref) {
        if (how == 'bit') {
            much = 5;
        }
        if (much === 'a' && how === 'pixel') {
            much = 1;
        }

        if (direction === 'left') {
            much *= -1;
        }

        if (ref === 'center') {
            ref = Canvas.width / 2;
        }

        obj.x = ref + much;
    }


