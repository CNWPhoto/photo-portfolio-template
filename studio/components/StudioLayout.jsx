import {preloadModule} from 'react-dom'

// Sanity Dashboard bridge — connects the EMBEDDED Studio to Sanity's Dashboard
// (sanity.io) when it's discovered/iframed there, so the Dashboard opens this
// on-domain Studio instead of a stale hosted one. Required for embedded studios
// that aren't compiled with `sanity build` (per Sanity's "Set up and configure
// Dashboard" guide). Only wired into the embedded config (root
// sanity.config.ts); the hosted Studio gets this automatically via `sanity
// deploy`.
const BRIDGE = 'https://core.sanity-cdn.com/bridge.js'

export default function StudioLayout(props) {
  preloadModule(BRIDGE, {as: 'script'})
  return (
    <>
      <script src={BRIDGE} async type="module"></script>
      {props.renderDefault(props)}
    </>
  )
}
