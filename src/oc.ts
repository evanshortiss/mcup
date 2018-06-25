import exec = require('execa')
import * as semver from 'semver'
import { isInstalled } from './util'

const MIN_OC_VERSION = '3.9.0'

export async function getVersion() {
  async function _getVersion(): Promise<string> {
    // oc version will return an error if a cluster is not running, but we
    // ignore that since we just care about the CLI version
    try {
      const ret = await exec('oc', ['version'])
      return ret.stdout
    } catch (e) {
      return e.toString()
    }
  }

  const result = await _getVersion()
  const version = result.split('\n').filter(l => l.match(/^oc v/gi))

  if (!version) {
    throw new Error(`"oc version" returned unexpected output format ${result}`)
  }

  // Trim away the leading "oc " string from version output and get info
  const info = semver.parse(version[0].replace('oc ', ''))

  if (!info) {
    throw new Error(`failed to parse "oc version" semver output ${result}`)
  }

  return info
}

export async function verifyInstallation() {
  const available = await isInstalled('oc')
  const version = await getVersion()

  if (!available || !semver.satisfies(version.version, `>=${MIN_OC_VERSION}`)) {
    throw new Error(
      `Please download and install OpenShift CLI v${MIN_OC_VERSION} or higher from from https://github.com/openshift/origin/releases/ and make sure it's available on $PATH`
    )
  }
}
