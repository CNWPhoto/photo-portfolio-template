import seo from './seo'
import seoSettings from './seoSettings'
import navSettings from './navSettings'
import testimonial from './testimonial'
import portfolio from './portfolio'
import blogPost from './blogPost'
import siteSettings from './siteSettings'
import homepagePage from './homepagePage'
import welcomeSection from './sections/welcomeSection'
import heroSection from './sections/heroSection'
import featuredSection from './sections/featuredSection'
import processSection from './sections/processSection'
import whyChooseSection from './sections/whyChooseSection'
import homepageFaqs from './sections/homepageFaqs'
import testimonialsSection from './sections/testimonialsSection'
import codeSettings from './codeSettings'
import footerSettings from './footerSettings'
import socialSettings from './socialSettings'
import aboutPage from './aboutPage'
import experiencePage from './experiencePage'
import experienceHero from './sections/experienceHero'
import experienceIntro from './sections/experienceIntro'
import experienceSessions from './sections/experienceSessions'
import experienceArtwork from './sections/experienceArtwork'
import experienceNextSteps from './sections/experienceNextSteps'
import experienceFaqs from './sections/experienceFaqs'
import aboutIntroSection from './sections/aboutIntroSection'
import aboutWhatToExpectSection from './sections/aboutWhatToExpectSection'
import aboutPersonalSection from './sections/aboutPersonalSection'
import aboutQuoteSection from './sections/aboutQuoteSection'
import aboutCtaSection from './sections/aboutCtaSection'
import contactPage from './contactPage'
import blogPage from './blogPage'
import notFoundPage from './notFoundPage'
import palette from './_shared/palette'
import ctaLink from './_shared/ctaLink'
import page from './page'
import blogCategory from './blogCategory'
import portfolioCategory from './portfolioCategory'
import htmlEmbedSection from './htmlEmbedSection'
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
import faqSection from './sections/faqSection'
import featuredPortfolioSection from './sections/featuredPortfolioSection'
import blogTeaserSection from './sections/blogTeaserSection'

export const schemaTypes = [
  palette,
  ctaLink,
  seo, seoSettings,
  navSettings,
  siteSettings, homepagePage,
  page,
  aboutPage,
  experiencePage,
  experienceHero, experienceIntro, experienceSessions, experienceArtwork, experienceNextSteps, experienceFaqs,
  aboutIntroSection, aboutWhatToExpectSection, aboutPersonalSection, aboutQuoteSection, aboutCtaSection,
  contactPage, blogPage, notFoundPage,
  codeSettings, footerSettings, socialSettings,

  // Unified section catalog (page builder rewrite §2)
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

  // Legacy section types — kept until Phase 12 cleanup so existing
  // aboutPage / experiencePage / contactPage docs continue to validate.
  welcomeSection, featuredSection, processSection, whyChooseSection, homepageFaqs,

  testimonial, portfolio, blogPost,
  blogCategory, portfolioCategory,
  htmlEmbedSection,
]
