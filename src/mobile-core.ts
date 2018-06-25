import { join } from 'path'
import { homedir } from 'os'
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  write,
  writeFileSync
} from 'fs'
import { ListrTaskWrapper } from 'listr'
import * as rimraf from 'rimraf'
import * as request from 'request'
import exec = require('execa')

const RELEASE_URL = 'https://api.github.com/repos/aerogear/mobile-core/releases'

export interface GitHubTag {
  // The API data contains more fields, but we don't need them
  tag_name: string
  name: string
  draft: boolean
  prerelease: boolean
  published_at: string
  tarball_url: string
  zipball_url: string
}

/**
 * Returns our directory where downloads and settings should be stored
 */
function getTempDir() {
  return join(homedir(), '.mobile-core-cli-tmp')
}

/**
 * Get the path to the file for a given release
 * @param release
 */
function getFilePathToRelease(release: GitHubTag) {
  return join(getTempDir(), release.tag_name)
}

/**
 * This is the folder where releases should be extracted (it's reused)
 */
function getExtractionFolderPath() {
  return join(getTempDir(), 'mcp-source')
}

/**
 * Installs ansible requirements and runs the mobile core installer playbook
 * @param release
 * @param task
 * @param dockerUsername
 * @param dockerPassword
 * @param password
 */
export async function installRelease(
  release: GitHubTag,
  task: ListrTaskWrapper,
  dockerUsername: string,
  dockerPassword: string,
  password: string
) {
  const releasePath = getFilePathToRelease(release)

  function installRequirements() {
    task.output = 'Installing requirements with ansible-galaxy'
    return exec(
      'ansible-galaxy',
      ['install', '-r', './installer/requirements.yml'],
      {
        cwd: getExtractionFolderPath()
      }
    )
  }

  async function runInstaller() {
    task.output =
      'Installing Mobile Core with ansible-playbook (might be a good time for ☕ )'

    // NOTE: If using "--ask-become-pass" using regular child_process works
    // whereas "execa" fails
    //
    // return new Promise((resolve, reject) => {
    //   const cp = spawn(
    //     'ansible-playbook',
    //     [
    //       './installer/playbook.yml',
    //       `-e dockerhub_username=${dockerUsername}`,
    //       `-e dockerhub_password=${dockerPassword}`,
    //       '--ask-become-pass'
    //     ],
    //     {
    //       cwd: getExtractionFolderPath(),
    //       detached: false
    //     }
    //   )

    //   let bufferO = ''
    //   cp.stdout.on('data', (data) => {
    //     bufferO += data
    //   });

    //   let bufferE = ''
    //   cp.stderr.on('data', (data) => {
    //     bufferE += data
    //   });

    //   cp.on('error', (err) => {
    //     console.log('error from cp')
    //     console.log(err)
    //   })

    //   cp.on('close', (code) => {
    //     console.log(bufferE)
    //     console.log(bufferO)
    //     if (code === 0) {
    //       const consoleUrl = bufferO.match(/web console url: *.+/gi)

    //       if (!consoleUrl) {
    //         throw new Error(`Unexpected output from ansible playbooks:\n${bufferO}`)
    //       } else {
    //         return consoleUrl[0]
    //       }
    //     } else {
    //       throw new Error(`
    //         Ansible Installer exited with code ${code}.

    //         stdout:
    //         ${bufferO}

    //         stderr:
    //         ${bufferE}
    //       `)
    //     }
    //   });
    // })

    const result = await exec(
      'ansible-playbook',
      [
        './installer/playbook.yml',
        `-e dockerhub_username=${dockerUsername}`,
        `-e dockerhub_password=${dockerPassword}`,
        `-e ansible_sudo_pass=${password}`
      ],
      {
        cwd: getExtractionFolderPath()
      }
    )

    const consoleUrl = result.stdout.match(/web console url: *.+/gi)

    if (!consoleUrl) {
      throw new Error(
        `Unexpected output from ansible playbooks:\n${result.stdout}`
      )
    } else {
      // TODO: Improve this crappy regex/parsing "https://"
      return consoleUrl[0].replace(/web console url: /gi, '').replace('",', '')
    }
  }

  await installRequirements()
  return await runInstaller()
}

/**
 * Run "make clean" in the mobile core repo to start from a clean slate
 */
export function clean() {
  // TODO Not using this until sudo permission requirements are sorted
  return exec('make', ['clean'], {
    cwd: getExtractionFolderPath()
  })
}

/**
 * Download the tarball for a specific MCP release
 * @param release
 */
export function download(release: GitHubTag) {
  const tempDir = getTempDir()
  const writeFile = `${getFilePathToRelease(release)}.tar.gz`

  if (!existsSync(tempDir)) {
    mkdirSync(tempDir)
  }

  return new Promise((resolve, reject) => {
    request
      .get(release.tarball_url, {
        headers: {
          'user-agent': 'MCP CLI'
        }
      })
      .pipe(createWriteStream(writeFile))
      .on('error', reject)
      .on('finish', resolve)
  })
}

/**
 * Unpack a downloaded release from a tarball
 * @param release
 */
export function unpack(release: GitHubTag) {
  const extractionPath = getExtractionFolderPath()

  // Create/delete older files
  if (existsSync(extractionPath)) {
    rimraf.sync(extractionPath)
    mkdirSync(extractionPath)
  } else {
    mkdirSync(extractionPath)
  }

  return exec(
    'tar',
    [
      '-xvzf',
      `${getFilePathToRelease(release)}.tar.gz`,
      '-C',
      getExtractionFolderPath(),
      '--strip-components=1'
    ],
    {
      cwd: getTempDir()
    }
  )
}

/**
 * Fetches the JSON list of releases for the MCP
 */
export async function getReleaseList(): Promise<GitHubTag[]> {
  return new Promise<GitHubTag[]>((resolve, reject) => {
    request.get(
      RELEASE_URL,
      {
        headers: {
          'user-agent': 'MCP CLI'
        },
        json: true
      },
      (err, res, body) => {
        if (err) {
          reject(err)
        } else if (res.statusCode !== 200) {
          throw new Error(
            `GitHub API returned ${res.statusCode} status from ${RELEASE_URL}`
          )
        } else {
          resolve(body)
        }
      }
    )
  })
}
