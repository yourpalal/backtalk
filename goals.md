# philosophical

## part of an IRE (integrated runtime environment)

Code is not free-standing, it only makes sense within the context of the system it is written for. This means that the IRE can/must help the user quite a bit.
Some scope will be created from outside of the code chunks a user writes, and
will be managed by the IRE. Code completion and documentation!!!

## seperate program structure from program expression

Code should be written in relatively small, isolated chunks that are basically
independent. Maybe they interact with systems, but they do not generally interact with each other.

## easy to read

The goal of this language is not to implement entire large pieces of software,
it is to create points of user customisability within software. For this reason,
it should be expressive, and tied closely to the software that is running the
chunks. For instance, it should be possible to make nearly natural-language like
expressions.

EXAMPLE:

        -- for a collision handler between ball and paddle

        if $ball is left of $paddle
        then bounce $ball to the left
        
        if $ball is right of $paddle
        then bounce $ball to the right

        -- for a collision handler between ball and screen edges

        if $ball is below  $edge
        then bounce $ball down
        
        if $ball is above $edge
        then bounce $ball up

        if $ball is left of $edge
        then increase ( left player ) score

        if $ball is right of $edge
        then right ( right player ) score


        -- where ( left player ) is a sub-expression that matches a global
        -- identifier that the player has given an object in their IRE
        -- and ( right player ) is the same idea

# technical

 * a SAFE embeddable, user-controllable programming language that can be
    parsed/interpreted in the browser. Sandboxing is important!

 * reasonably fast, but speed is not a major goal

 * basically some kind of macro type thing where we can define macros outside
 of the code chunks that are used within them, in the pong example above, we
 might have the following macros:

       context: collision handlers
       patterns: "$a is right of $b"
               : "$a is to the right of $b"
               : "$a is right of $b"
       function (collision, a, b) {
        return a.position.x < b.position.x;
        // you would probably do something more complicated but this
        // would work in a very simple scenario
       }

  which macros are available should depend on the context.
  it would also be nice to have full dynamic dispatch (a-la julia) for these,
  but that might not be useful/practical
