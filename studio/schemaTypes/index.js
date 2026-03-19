import seo from './seo'
import navSettings from './navSettings'
import testimonial from './testimonial'
import portfolio from './portfolio'
import blogPost from './blogPost'
import faq from './faq'
import pageSection from './pageSection'
import siteSettings from './siteSettings'
import homepageSettings from './homepageSettings'
import homepagePage from './homepagePage'
import welcomeSection from './sections/welcomeSection'
import heroSlider from './sections/heroSlider'
import heroCaption from './sections/heroCaption'
import featuredSection from './sections/featuredSection'
import processSection from './sections/processSection'
import soloHeroImage from './sections/soloHeroImage'
import whyChooseSection from './sections/whyChooseSection'
import homepageFaqs from './sections/homepageFaqs'
import codeSettings from './codeSettings'
import footerSettings from './footerSettings'
import socialSettings from './socialSettings'
import aboutPage from './aboutPage'
import aboutIntroSection from './sections/aboutIntroSection'
import aboutWhatToExpectSection from './sections/aboutWhatToExpectSection'
import aboutPersonalSection from './sections/aboutPersonalSection'
import aboutQuoteSection from './sections/aboutQuoteSection'
import aboutCtaSection from './sections/aboutCtaSection'

export const schemaTypes = [
  seo,
  navSettings,
  siteSettings, homepageSettings, homepagePage,
  aboutPage,
  aboutIntroSection, aboutWhatToExpectSection, aboutPersonalSection, aboutQuoteSection, aboutCtaSection,
  codeSettings, footerSettings, socialSettings,
  heroSlider, heroCaption, welcomeSection, featuredSection, processSection, soloHeroImage, whyChooseSection, homepageFaqs,
  testimonial, portfolio, blogPost, faq, pageSection,
]
