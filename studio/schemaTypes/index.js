import seo from './seo'
import seoSettings from './seoSettings'
import navSettings from './navSettings'
import testimonial from './testimonial'
import portfolio from './portfolio'
import blogPost from './blogPost'
import siteSettings from './siteSettings'
import homepagePage from './homepagePage'
import codeSettings from './codeSettings'
import footerSettings from './footerSettings'
import socialSettings from './socialSettings'
import blogPage from './blogPage'
import notFoundPage from './notFoundPage'
import termsAndConditionsPage from './termsAndConditionsPage'
import privacyPolicyPage from './privacyPolicyPage'
import palette from './_shared/palette'
import ctaLink from './_shared/ctaLink'
import page from './page'
import blogCategory from './blogCategory'
import portfolioCategory from './portfolioCategory'
import htmlEmbedSection from './htmlEmbedSection'
import htmlEmbedRef from './_shared/htmlEmbedRef'

// Unified section catalog (page builder rewrite §2)
import heroSection from './sections/heroSection'
import splitSection from './sections/splitSection'
import fullBleedImageSection from './sections/fullBleedImageSection'
import richTextSection from './sections/richTextSection'
import pullQuoteSection from './sections/pullQuoteSection'
import threeColumnSection from './sections/threeColumnSection'
import stepsSection from './sections/stepsSection'
import galleryGridSection from './sections/galleryGridSection'
import dividerSection from './sections/dividerSection'
import ctaBandSection from './sections/ctaBandSection'
import contactFormSection from './sections/contactFormSection'
import contactInfoSection from './sections/contactInfoSection'
import testimonialsSection from './sections/testimonialsSection'
import faqSection from './sections/faqSection'
import featuredPortfolioSection from './sections/featuredPortfolioSection'
import blogTeaserSection from './sections/blogTeaserSection'

export const schemaTypes = [
  // Shared object types
  palette,
  ctaLink,
  seo,
  htmlEmbedRef,

  // Settings singletons
  siteSettings,
  navSettings,
  footerSettings,
  socialSettings,
  seoSettings,
  codeSettings,

  // Page singletons + the unified page doc
  homepagePage,
  notFoundPage,
  blogPage,
  termsAndConditionsPage,
  privacyPolicyPage,
  page,

  // Section catalog
  heroSection,
  splitSection,
  fullBleedImageSection,
  richTextSection,
  pullQuoteSection,
  threeColumnSection,
  stepsSection,
  galleryGridSection,
  dividerSection,
  ctaBandSection,
  contactFormSection,
  contactInfoSection,
  testimonialsSection,
  faqSection,
  featuredPortfolioSection,
  blogTeaserSection,

  // Collections
  testimonial,
  portfolio,
  blogPost,
  blogCategory,
  portfolioCategory,
  htmlEmbedSection,
]
