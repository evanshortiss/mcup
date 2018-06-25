import * as program from 'commander'
import chalk from 'chalk'

function errorHandler(e: any) {
  if (e.stack) {
    console.log(`\n ${chalk.red(e.toString())}`)
  } else {
    console.log(`\n ${chalk.red(e)}`)
  }
}

process.on('uncaughtException', errorHandler)
process.on('unhandledRejection', errorHandler)

export default program
