// Agency top bar shown above the default Studio navigation (wired via
// studio.components.navbar) in BOTH the embedded /studio and the hosted Studio.
// Left: a "Singletrack Sites" tag. Right: a one-click "Get help" link to the
// shared Heartbeat support space. Additive — props.renderDefault(props) still
// renders the full Studio navbar underneath, so nothing is removed.

import {Badge, Box, Button, Card, Flex} from '@sanity/ui'

// Shared support space — the SAME Heartbeat channel for every client's Studio.
// TODO(Connor): replace with the real Heartbeat channel URL.
const HELP_URL = 'https://app.heartbeat.chat/REPLACE_ME'

export default function StudioTopBar(props) {
  return (
    <Box>
      <Card paddingX={3} paddingY={2} tone="primary" borderBottom shadow={1}>
        <Flex align="center" justify="space-between" gap={3}>
          <Badge tone="primary" mode="outline" fontSize={1}>
            Singletrack Sites
          </Badge>
          <Button
            as="a"
            href={HELP_URL}
            target="_blank"
            rel="noopener noreferrer"
            text="Get help"
            tone="primary"
            mode="ghost"
            fontSize={1}
            padding={2}
          />
        </Flex>
      </Card>
      {props.renderDefault(props)}
    </Box>
  )
}
