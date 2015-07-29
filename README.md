# BackTalk

BackTalk is a programming language that is focused on natural language-inspired embedded scripting. The idea is to let your users talk back to you. This goal is where the name "BackTalk" comes from. The interpreter and parser are implemented in TypeScript, and can be compiled into a relatively simple-to-use library that can be embedded in other {Java|Type}Script software. BackTalk is not done, it is not very usable yet, but it can run both in a command-line REPL as well as in a simple browser-based example (see /examples).

## Goals
### part of an integrated runtime environment (IRE)

Code is not free-standing, it only makes sense within the context of the system it is written for. It is expected that users would write small chunks of code that hook into parts of an existing system. This means that the IRE can/must help the user quite a bit. Some scope will be created by the embedding program for each of the code chunks a user writes, and
the IRE should be able to interrogate this scope to help the user via code completion and documentation. This is one of the loftier goals, and it will require the most work.


### separate program structure from program expression

Code should be written in relatively small, isolated chunks that are basically independent. Maybe they interact with systems, but they do not generally interact with each other.

### easy to read

The goal of this language is not to implement entire large pieces of software, it is to create points of user customisation within software. For this reason, it should be expressive, and tied closely to the software that is running the chunks. For instance, it should be possible to make nearly natural language-like expressions.

EXAMPLE:

    -- for a collision handler between ball and paddle

    when $ball hits $paddle:
        if $ball is left of $paddle:
            bounce $ball to the left

        if $ball is right of $paddle:
            bounce $ball to the right

    -- for a collision handler between ball and screen edges

    when $ball hits edge:
        if $ball is below $edge:
            bounce $ball down

        if $ball is above $edge:
            bounce $ball up

        if $ball is left of $edge:
            increase ( left player ) score

        if $ball is right of $edge:
            increase ( right player ) score


    -- where ( left player ) is a sub-expression that matches a global
    -- identifier that the player has given an object in their IRE
    -- and ( right player ) is the same idea

### powerful

Composing expressions let uses get fancy!

    a big red circle:
        a bit left of center
        10 pixels below center

### technical goals

 * a SAFE embeddable, user-controllable programming language that can be parsed/interpreted in the browser. Sandboxing is important!
 * reasonably fast, but speed is not a major goal
 * extensible by embedders
