#!/usr/bin/env node

import ansible from '../ansible'
import * as Listr from 'listr'
import * as oc from '../oc'
import * as docker from '../docker'
import * as mcp from '../mobile-core'
const input = require('listr-input')

let url: string

interface DownloadContext {
  releases: mcp.GitHubTag[]
  tag: mcp.GitHubTag
}

export interface CommandOptions {
  dockeruser?: string
  dockerpass?: string
  tag?: string
}

export interface FuncOptions {
  dockeruser: string
  dockerpass: string
  tag?: string
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
    },
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

          ctx.tag = tag
        } else {
          ctx.tag = ctx.releases[0]
        }
      }
    },
    {
      title: 'Download Release Package 🎁',
      task: async (ctx: DownloadContext, task) => {
        task.output = `Downloading release ${ctx.tag.tag_name}`
        await mcp.download(ctx.tag)
      }
    },
    {
      title: 'Unpack Release 📦',
      task: async (ctx: DownloadContext, task) => {
        task.output = `Extracting release ${ctx.tag.tag_name}`
        return mcp.unpack(ctx.tag)
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
              ctx.tag,
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
}
