#!/usr/bin/env node

import program from '../src/program'

program.command(
  'up',
  'starts an openshift instance running mobile core. uses the latest release tag by default'
)
program.command(
  'releases',
  'lists available mobile core release tags that can be used'
)

program.version(require('../package.json').version)

if (!process.argv.slice(2).length) {
  program.outputHelp()
} else {
  program.parse(process.argv)
}
