// Shared "Heading Size" control.
//
// Every section sets its own heading clamp — Hero runs to 4.25rem, Contact Info
// to 2.25rem — because a hero heading and a contact heading are not the same
// thing. So this is a SCALE, not a size: it shifts a section's own curve up or
// down and leaves the relationships between sections intact. The clamp keeps
// doing the responsive work; only its multiplier changes.
//
// VALUE NAMES ARE DELIBERATELY NOT THE LABELS. `large` / `standard` already
// ship on heroSection and splitSection and exist in live data across twelve
// client sites, so renaming them would mean a migration for a cosmetic win.
// Editors see Small / Medium / Large; the stored values stay as they were.
//
// Three steps, not four: the default is already an editorial display size, and
// anything larger overflows exactly the long headings this control exists to
// rescue. Adding an XL later is one line here plus one in palette.css.
export const headingSizeField = () => ({
  name: 'headingSize',
  title: 'Heading Size',
  type: 'string',
  description:
    'Scales this section’s heading. Large is the default editorial size — pick Medium or Small for longer headings or a more restrained look. All three still resize with the screen.',
  options: {
    list: [
      {title: 'Large (default)', value: 'large'},
      {title: 'Medium', value: 'standard'},
      {title: 'Small', value: 'small'},
    ],
    layout: 'radio',
    direction: 'horizontal',
  },
  initialValue: 'large',
})
