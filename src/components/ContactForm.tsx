import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'

// Aplikacja nie ma backendu, więc wiadomość idzie jedną z dwóch dróg:
//   1. `contact.postUrl` w `ui.json` pusty  -> otwiera się program pocztowy (mailto),
//   2. adres ustawiony -> wysyłamy prosto z przeglądarki. Adres z `/formResponse`
//      (Google Forms) przyjmujemy w tle, każdy inny dostaje POST z polami formularza.
// Wzorzec adresu ma miejsca `{wiadomosc}`, `{imie}` i `{email}`.
const CONTACT_EMAIL = 'marek.micyk@adwent.pl'

export function ContactForm() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [human, setHuman] = useState(false)
  const [hp, setHp] = useState('') // honeypot - boty wypełniają, ludzie nie
  const [stan, setStan] = useState<'idle' | 'busy' | 'sent' | 'failed'>('idle')

  const ready = human && msg.trim().length > 0 && hp === ''
  const field =
    'w-full rounded-md border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-light focus:outline-none'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!ready || stan === 'busy') return
    const subject = t('contact.subject', 'Contact - One Voice 27')
    const post = t('contact.postUrl', '')

    if (!post) {
      const body = [
        msg.trim(),
        '',
        name.trim() ? `${t('contact.name', 'Name')}: ${name.trim()}` : '',
        email.trim() ? `${t('contact.emailLabel', 'Email')}: ${email.trim()}` : '',
      ].filter(Boolean).join('\n')
      window.location.href = `mailto:${t('contact.address', CONTACT_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      return
    }

    setStan('busy')
    try {
      if (post.includes('/formResponse')) {
        const adres = post
          .replace('{wiadomosc}', encodeURIComponent(msg.trim()))
          .replace('{imie}', encodeURIComponent(name.trim()))
          .replace('{email}', encodeURIComponent(email.trim()))
        // odpowiedzi nie da sie odczytac (no-cors), ale zgloszenie dochodzi
        await fetch(adres, { method: 'POST', mode: 'no-cors' })
        setStan('sent')
      } else {
        const dane = new FormData()
        dane.append('message', msg.trim())
        dane.append('name', name.trim())
        dane.append('email', email.trim())
        dane.append('_subject', subject)
        const res = await fetch(post, { method: 'POST', body: dane, headers: { Accept: 'application/json' } })
        setStan(res.ok ? 'sent' : 'failed')
      }
    } catch {
      setStan('failed')
    }
  }

  return (
    <section className="gradient-panel no-print mt-10 rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-lg font-semibold text-slate-100">{t('contact.title', 'Contact')}</span>
        <span className="text-xl leading-none text-slate-400" aria-hidden>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-slate-400">{t('contact.intro', 'Have a question or want to talk? Write to us.')}</p>
          {stan === 'sent' ? (
            <p className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {t('contact.sent', 'Thank you, your message has been sent.')}
            </p>
          ) : (
          <form onSubmit={onSubmit} className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('contact.name', 'Name')}
                className={field}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('contact.email', 'Your email (so we can reply)')}
                className={field}
              />
            </div>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder={t('contact.message', 'Your message')}
              rows={4}
              required
              className={field}
            />
            {/* honeypot (ukryte przed ludźmi) */}
            <input
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={human}
                onChange={(e) => setHuman(e.target.checked)}
                className="h-4 w-4 accent-sky-500"
              />
              {t('contact.human', 'I’m not a robot')}
            </label>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={!ready || stan === 'busy'}
                className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-light disabled:opacity-50"
              >
                {stan === 'busy' ? t('contact.sending', 'Sending…') : t('contact.send', 'Send message')}
              </button>
              <span className="text-xs text-slate-500">
                {t('contact.postUrl', '')
                  ? t('contact.hintDirect', 'Your message will be sent directly to us.')
                  : t('contact.hint', 'Your message will open in your email app.')}
              </span>
            </div>
            {stan === 'failed' && (
              <p className="text-sm text-rose-300">
                {t('contact.failed', 'Your message could not be sent. Please try again or use your email app.')}
              </p>
            )}
          </form>
          )}
        </div>
      )}
    </section>
  )
}
