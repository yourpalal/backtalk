enable optional words like "?just <$|one|two|three> pixels to the left"

Add support for varargs. Possible pattern syntax is `$...:foo` or `$!...:foo` or `$!!...:foo` .
Might also be cool to do something like <$ |with$| without $>...:args, to enable things like

      draw a closed polygon from 5 10 to 8 10 to 10 10 to 5 5

which would use a pattern like "draw a ?closed polygon from $:start_x $:start_y to $:next_x $:next_y <to $:x $:y>...:args"
to allow for repeating "to $ $" arguments.
