import { getReleaseList } from '../src/mobile-core'
import * as table from 'table'

getReleaseList().then(list => {
  const data = [['Tag', 'Date', 'Draft', 'Prerelease']]

  list.forEach(release => {
    data.push([
      release.tag_name,
      release.published_at,
      release.draft ? 'Yes' : 'No',
      release.prerelease ? 'Yes' : 'No'
    ])
  })

  console.log(table.table(data))
})
