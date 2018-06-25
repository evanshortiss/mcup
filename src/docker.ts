import exec = require('execa')
import { isInstalled } from './util'

const MIN_DOCKER_VERSION = '17.09.1'

export function getVersion() {
  return exec('docker', ['version', '--format', '{{.Client.Version}}'])
    .then(result => result.stdout.replace('-ce', ''))
    .catch(e => {
      throw new Error(
        `Failed to determine Docker version installed. Ensure Docker is installed an running.`
      )
    })
}

export async function verifyInstallation() {
  const available = await isInstalled('docker')
  const version = await getVersion()

  // TODO: Better checks. Docker tags are not valid semver due to leading zero.
  if (!available || version < MIN_DOCKER_VERSION) {
    throw new Error(
      `Please download and install Docker v${MIN_DOCKER_VERSION} or higher from from https://docs.docker.com/install/ and make sure it's available on $PATH`
    )
  }
}
