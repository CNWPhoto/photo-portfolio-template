import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'

// Testimonials section. Pulls from testimonial documents.
// See docs/page-builder-spec.md §2 (testimonialsSection).

export default {
  name: 'testimonialsSection',
  icon: sectionIcon('testimonialsSection'),
  title: 'Testimonials',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'Testimonials', subtitle: heading || ''}
    },
  },
  fields: [
    // `layout` (slider / grid / single-featured) was removed because only
    // `slider` was ever implemented in the component; picking grid or
    // single-featured silently fell back to slider. Tracked in
    // docs/deferred-features.md.
    ...sectionBaseFields(),
    {
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'What Clients Are Saying',
    },
    {
      name: 'maxCount',
      title: 'Max Count',
      type: 'number',
      description: 'Optional. Limits how many testimonials to show. Leave blank to show all.',
    },
  ],
}
