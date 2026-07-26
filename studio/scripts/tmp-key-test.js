import {getCliClient} from 'sanity/cli'
const v = process.argv.includes('--revert') ? '' : 'demo-placeholder-key'
const client = getCliClient().withConfig({projectId: 'hx5xgigp', dataset: 'production', apiVersion: '2024-10-01', useCdn: false})
async function main() {
  await client.patch('siteSettings').set({web3formsKey: v}).commit({visibility: 'sync'})
  console.log('key =', JSON.stringify(v))
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1) })
