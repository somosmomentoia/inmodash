import { PublicNavbar, Hero, Features, InteractiveDemo, Testimonials, CTA, Footer } from '@/components/landing'
import styles from '@/components/landing/landing.module.css'

export default function Home() {
  return (
    <div className={styles.landingPage}>
      <PublicNavbar />
      <Hero />
      <Features />
      <InteractiveDemo />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}
