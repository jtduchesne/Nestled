# Nestled

#####Javascript NES emulator

This is version 0.1 of a work-in-progress javascript NES emulator carefully written in the *ECMAScript 6* standard.

As of now, Background rendering is working, but Sprites are not implemented yet. So without Sprites, sprite0Hit is never set and most games hang right at the beginning...

Fully tested using [Mocha.js](http://mochajs.org/) + [Chai.js](http://chaijs.com/)

---
I have put a huge amount of efforts into writing beautiful, well organized and easy to understand code, and the same applies to the Git commits themselves. The repository, with its complete history, can be used for learning the step-by-step creation of a solo side-project using *Git*, *Node.js*, *Rollup*, *Mocha*, *Chai*, *ESLint*, and of course *Javascript* (currently writing a blog about all this).

---
### References

  * [wiki.nesdev.com](http://wiki.nesdev.com/)  indeed...
  * CPU:
    * http://nesdev.com/6502_cpu.txt
    * http://obelisk.me.uk/6502/reference.html
