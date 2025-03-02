
//  CONSOLE LOGGING

const RESET       = "\x1b[0m"
const BRIGHT      = "\x1b[1m"
const DIM         = "\x1b[2m"
const UNDERSCORE  = "\x1b[4m"
const BLINK       = "\x1b[5m"
const REVERSE     = "\x1b[7m"
const HIDDEN      = "\x1b[8m"

const BLACK       = "\x1b[30m"
const RED         = "\x1b[31m"
const GREEN       = "\x1b[32m"
const YELLOW      = "\x1b[33m"
const BLUE        = "\x1b[34m"
const MAGENTA     = "\x1b[35m"
const CYAN        = "\x1b[36m"
const WHITE       = "\x1b[37m"

const BG_BLACK    = "\x1b[40m"
const BG_RED      = "\x1b[41m"
const BG_GREEN    = "\x1b[42m"
const BG_YELLOW   = "\x1b[43m"
const BG_BLUE     = "\x1b[44m"
const BG_MAGENTA  = "\x1b[45m"
const BG_CYAN     = "\x1b[46m"
const BG_WHITE    = "\x1b[47m"

module.exports = {
  RESET,
  BRIGHT,
  DIM,
  UNDERSCORE,
  BLINK,
  REVERSE,
  HIDDEN,
  BLACK,
  RED,
  GREEN,
  YELLOW,
  BLUE,
  MAGENTA,
  CYAN,
  WHITE,
  BG_BLACK,
  BG_RED,
  BG_GREEN,
  BG_YELLOW,
  BG_BLUE,
  BG_MAGENTA,
  BG_CYAN,
  BG_WHITE
}

/*

            EXAMPLES
    const { RED, BG_GREEN, BRIGHT, RESET } = require('../utility/colors.js');
    
    console.log(RED + 'This text will be red.' + RESET);
    console.log(BG_GREEN + 'This text will have a green background.' + RESET);
    console.log(BRIGHT + 'This text will be bright.' + RESET);


*/