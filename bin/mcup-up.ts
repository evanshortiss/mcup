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
    'Specifies a Mobile Core tag to deploy.'
  )
  .option(
    '-b, --branch <s>',
    'Deploys a specific branch Mobile Core by using the master branch.'
  )

program.parse(process.argv)

const opts: up.CommandOptions = {
  tag: program.tag,
  branch: program.branch,
  dockerpass: program.dockerpass || process.env.DOCKERHUB_USER,
  dockeruser: program.dockerpass || process.env.DOCKERHUB_PASS
}

if (opts.tag && opts.branch) {
  throw new Error('--branch and --tag cannot be used together, pass either branch or tag')
} else if (!opts.dockerpass || !opts.dockeruser) {
  throw new Error('--dockeruser and --dockerpass are required, or DOCKERHUB_USER and DOCKERHUB_PASS environment variables must be set')
} else {
  up.run(opts as up.FuncOptions)
}
