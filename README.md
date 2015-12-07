# BackTalk

[![Build Status](https://travis-ci.org/yourpalal/backtalk.svg)](https://travis-ci.org/yourpalal/backtalk)

        npm install backtalk --save

BackTalk is a programming language that is focused on natural language-inspired embedded scripting. The idea is to let users of your software to talk back to you. The interpreter and parser are implemented in TypeScript, and can be compiled into a relatively simple-to-use library that can be embedded in other {Java|Type}Script software. BackTalk is not done, but is somewhat usable, and can be run both in a command-line REPL as well as in a simple browser-based example (see /examples).

## Features

 * small API for embedders
 * a simple debugger with breakpoints
 * async-transparent code execution with promises
 * well-architected with separate parser, AST, and simple VM.

## Goals
### part of an integrated runtime/developer environment

Code is not free-standing, it only makes sense within the context of the system it is written for. It is expected that users would write small chunks of code that hook into parts of an existing system. This means that the embedding software should help the user as much as possible. They are not expected to be experts.

A scope is created by the embedding program for each of the code chunks a user writes, and this scope contains the necessary information to help the user via code completion and documentation.


### separate program structure from program expression

Code should be written in relatively small, isolated chunks that are basically independent. Maybe they interact with systems, but they do not generally interact with each other.

### easy to read

The goal of this language is not to implement entire large pieces of software, it is to create points of user customisation within software. For this reason, it should be expressive, and tied closely to the software that is running the chunks. For instance, it should be possible to make nearly natural language-like expressions.

#### examples

for a collision handler between ball and paddle

    when:
        $ball is left of $paddle
        then:
            bounce $ball to the left

        $ball is right of $paddle
        then:
            bounce $ball to the right

for a collision handler between ball and screen edges

    when:
        $ball is below $edge
        then:
            bounce $ball down

        $ball is above $edge
        then:
            bounce $ball up

        $ball is left of $edge:
        then:
            increase (left player ) score

        $ball is right of $edge
        then:
            increase ( right player ) score


    -- 'left player' is a function call that retrieves a player object or identifier

### powerful

Composing expressions allows for simpler, more specific functions to be exposed!

    a big red circle:
        a bit left of center
        10 pixels below center

## Technical Goals

 * a safe embeddable, user-controllable programming language that can be parsed/interpreted in the browser. Sandboxing is important!
 * reasonably fast, but speed is not a major goal
 * simple API
