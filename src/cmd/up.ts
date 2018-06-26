#!/usr/bin/env node

import ansible from '../ansible'
import { join } from 'path'
import { notify } from 'node-notifier'
import * as Listr from 'listr'
import * as oc from '../oc'
import * as docker from '../docker'
import * as mcp from '../mobile-core'

const input = require('listr-input')

let url: string

interface DownloadContext {
  releases: mcp.GitHubTag[]
  release: string
}

export interface CommandOptions {
  dockeruser?: string
  dockerpass?: string
  tag?: string
  branch?: string
}

export interface FuncOptions {
  dockeruser: string
  dockerpass: string
  tag?: string
  branch?: string
}

export async function run(opts: FuncOptions) {
  const tasks = new Listr([
    {
      title: 'Verify OpenShift 🔴',
      task: (ctx, task) => {
        task.output = 'Checking "oc version"...'
        return oc.verifyInstallation()
      }
    },
    {
      title: 'Verify Ansible 🤖',
      task: (ctx, task) => {
        task.output = 'Checking "ansible --version"...'
        return ansible()
      }
    },
    {
      title: 'Verify Docker 🐳',
      task: (ctx, task) => {
        task.output = 'Running "docker version"...'
        return docker.verifyInstallation()
      }
    }
  ])


  if (opts.branch) {
    const branch = opts.branch

    tasks.add({
      title: `Fetching Branch "${branch}" 🐕`,
      task: async (ctx) => {
        ctx.release = branch
        await mcp.download(branch)
      }
    })
  } else {
    tasks.add([
      {
        title: 'Fetch Mobile Core Releases 🐕',
        task: async (ctx: DownloadContext, task) => {
          task.output = 'Fetching release tags from https://api.github.com'

          ctx.releases = await mcp.getReleaseList()

          if (opts.tag) {
            const tag = ctx.releases.find(t => t.tag_name === opts.tag)

            if (!tag) {
              throw new Error(
                `Provided tag value of "${
                  opts.tag
                }" was not valid. Use "mcp releases" to list valid tags.`
              )
            }

            ctx.release = tag.tag_name
          } else {
            ctx.release = ctx.releases[0].tag_name
          }
        }
      },
      {
        title: 'Download Release Package 🎁',
        task: async (ctx: DownloadContext, task) => {
          task.output = `Downloading release ${ctx.release}`
          await mcp.download(ctx.release)
        }
      }
    ])
  }

  tasks.add([
    {
      title: 'Unpack Mobile Core 📦',
      task: async (ctx: DownloadContext, task) => {
        task.output = `Extracting files...`
        return mcp.unpack(ctx.release)
      }
    },
    // TODO: This requires sudo permissions. Maybe PR "clean.sh" since sudo
    // doesn't seem to be needed by what the script does?
    // {
    //   title: 'Clean Up Existing OpenShift and Mobile Core ✨',
    //   task: (ctx: DownloadContext, task) => {
    //     task.output = `Running "make clean"`
    //     return mcp.clean()
    //   }
    // },
    {
      title: 'Launch OpenShift with Mobile Core 📲',
      task: (ctx: DownloadContext, task) =>
        input('Sudo Password', {
          secret: true,
          done: async (pass: string) => {
            url = await mcp.installRelease(
              ctx.release,
              task,
              opts.dockeruser,
              opts.dockerpass,
              pass
            )
          }
        })
    }
  ])

  await tasks.run()
  console.log(
    `\n📱  OpenShift Origin with Mobile Core is available at: ${url}\n`
  )
  console.log('Mobile Services will be available via the Catalog in a few moments.')

  notify({
    title: 'AeroGear Mobile Core',
    icon: join(__dirname, '../../aerogear.png'),
    message: `Deployment of Mobile Core on OpenShift complete`,
    sound: true
  })
}
