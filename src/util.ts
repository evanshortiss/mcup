import exec = require('execa')

/**
 * Determines if the given program is installed
 * @param program
 */
export async function isInstalled(program: string) {
  // TODO: windows support
  return exec('which', [program])
    .then(() => true)
    .catch(() => false)
}
