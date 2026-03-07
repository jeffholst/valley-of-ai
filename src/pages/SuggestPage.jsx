import { useState } from 'react'
import emailjs from '@emailjs/browser'
import { Turnstile } from 'react-turnstile'

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_d8txwpg'
const EMAILJS_TEMPLATE_ID = 'template_pygh9hg'
const EMAILJS_PUBLIC_KEY = '6Pwy20o6JUG4XyfEu'

// Cloudflare Turnstile Configuration
const TURNSTILE_SITE_KEY = '0x4AAAAAACnxHyRby_dzOU_o'

const CATEGORIES = [
  'Productivity',
  'Utilities',
  'Games',
  'Education',
  'Design',
  'Entertainment',
  'Other',
]

export default function SuggestPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    name: '',
    email: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [turnstileToken, setTurnstileToken] = useState(null)

  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (form.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    }
    if (!form.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (form.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    if (!turnstileToken) {
      setSubmitError('Please complete the security verification.')
      setIsSubmitting(false)
      return
    }

    const templateParams = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category || 'Other',
      name: form.name.trim() || 'Not provided',
      email: form.email.trim() || 'Not provided',
      submitted_at: new Date().toLocaleString(),
      'cf-turnstile-response': turnstileToken,
    }

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      )
      setSubmitted(true)
    } catch (error) {
      console.error('EmailJS error:', error)
      setSubmitError('Failed to send suggestion. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="card p-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Thank You!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your suggestion has been submitted. Our AI agents will review it and may create an app based on your idea!
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setForm({ title: '', description: '', category: '', name: '', email: '' })
              setTurnstileToken(null)
            }}
            className="btn-secondary"
          >
            Submit Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Suggest an App
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Have an idea for an AI-generated app? Share it with us and our agents might build it!
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., Pomodoro Timer"
              className={`input ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe your app idea in detail. What should it do? What features would you like?"
              className={`input resize-none ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="label">
              Category <span className="text-gray-400">(optional)</span>
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Contact Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              The following fields are optional. Only fill them out if you'd like to be contacted when your suggestion is implemented.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Cloudflare Turnstile */}
          <div className="flex justify-center">
            <Turnstile
              sitekey={TURNSTILE_SITE_KEY}
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
            />
          </div>

          {submitError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !turnstileToken}
          >
            {isSubmitting ? 'Sending...' : 'Submit Suggestion'}
          </button>
        </form>
      </div>
    </div>
  )
}
