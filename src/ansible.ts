import exec = require('execa')
import * as semver from 'semver'
import { isInstalled } from './util'

const MIN_ANSIBLE_VERSION = '2.5.4'

export async function getVersion() {
  const result = await exec('ansible', ['--version'])

  const version = result.stdout.split('\n')[0]

  if (!version) {
    throw new Error(`failed to parse ansible version from "${result.stdout}"`)
  }

  return version.replace('ansible ', '')
}

export default async function verifyInstallation() {
  const available = await isInstalled('ansible')
  const version = await getVersion()

  // TODO: Better checks. Docker tags are not valid semver due to leading zero.
  if (!available || !semver.satisfies(version, `^${MIN_ANSIBLE_VERSION}`)) {
    throw new Error(
      `Please download and install Ansible v${MIN_ANSIBLE_VERSION} or higher from from https://docs.ansible.com/ansible/latest/installation_guide/ and make sure it's available on $PATH`
    )
  }
}
