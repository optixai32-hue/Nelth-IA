import { getAuth } from '@/lib/firebase/admin'

const TARGET_DISPLAY_NAME = process.env.TARGET_DISPLAY_NAME || 'Nelcia Julie'
const TARGET_EMAIL = process.env.TARGET_EMAIL // if set, only update this account
const DRY_RUN = process.env.DRY_RUN === 'true'

async function main() {
  const auth = getAuth()
  let nextPageToken: string | undefined
  let updated = 0
  let skipped = 0

  console.log(
    `Target displayName: "${TARGET_DISPLAY_NAME}"${
      DRY_RUN ? ' (DRY RUN — no writes)' : ''
    }`
  )

  do {
    const list = await auth.listUsers(1000, nextPageToken)
    for (const user of list.users) {
      const current = user.displayName ?? ''
      if (TARGET_EMAIL && user.email !== TARGET_EMAIL) continue
      console.log(
        `uid=${user.uid} email=${user.email ?? '-'} current="${
          current || '(empty)'
        }"`
      )
      if (current !== TARGET_DISPLAY_NAME) {
        if (DRY_RUN) {
          console.log(`  (dry-run) would set to "${TARGET_DISPLAY_NAME}"`)
        } else {
          await auth.updateUser(user.uid, {
            displayName: TARGET_DISPLAY_NAME
          })
          console.log(`  -> set to "${TARGET_DISPLAY_NAME}"`)
          updated++
        }
      } else {
        skipped++
      }
    }
    nextPageToken = list.pageToken
  } while (nextPageToken)

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
