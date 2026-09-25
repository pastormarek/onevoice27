import { ContactForm } from '../components/ContactForm'
import { useI18n } from '../i18n'
import { PageHeading } from '../components/PageHeading'

export function Contact() {
  const { t } = useI18n()
  return <section className="mx-auto max-w-xl">
    <PageHeading icon="contact" title={t('contact.title', 'Contact')} />
    <p className="mt-2 text-slate-600 dark:text-slate-300">{t('contact.intro', 'Have a question or want to talk? Write to us.')}</p>
    <ContactForm />
  </section>
}
