#!/usr/bin/env node

import * as up from '../src/cmd/up'
import program from '../src/program'

program
  .option(
    '-u, --dockeruser <s>',
    'Docker Hub username. Defaults to DOCKERHUB_USER environment variable.'
  )
  .option(
    '-u, --dockerpass <s>',
    'Docker Hub password. Defaults to DOCKERHUB_PASS environment variable.'
  )
  .option(
    '-t, --tag <s>',
    'Mobile Core tag to deploy. Defaults to the most recent tag.'
  )

program.parse(process.argv)

const opts: up.CommandOptions = {
  tag: program.tag,
  dockerpass: program.dockerpass || process.env.DOCKERHUB_USER,
  dockeruser: program.dockerpass || process.env.DOCKERHUB_PASS
}

if (!opts.dockerpass || !opts.dockeruser) {
  throw new Error('--dockeruser and --dockerpass are required options')
} else {
  up.run(opts as up.FuncOptions)
}
