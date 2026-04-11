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

export const schemaTypes = [
  palette,
  seo, seoSettings,
  navSettings,
  siteSettings, homepagePage,
  aboutPage,
  experiencePage,
  experienceHero, experienceIntro, experienceSessions, experienceArtwork, experienceNextSteps, experienceFaqs,
  aboutIntroSection, aboutWhatToExpectSection, aboutPersonalSection, aboutQuoteSection, aboutCtaSection,
  contactPage, blogPage, notFoundPage,
  codeSettings, footerSettings, socialSettings,
  heroSection, welcomeSection, featuredSection, processSection, whyChooseSection, homepageFaqs, testimonialsSection,
  testimonial, portfolio, blogPost,
]
