import { useState } from 'react'

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
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

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

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate()
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // For now, just log the submission
    const payload = {
      id: `${new Date().toISOString().split('T')[0]}-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category || 'Other',
      submittedAt: new Date().toISOString(),
      status: 'pending',
    }
    
    console.log('Suggestion submitted:', payload)
    setSubmitted(true)
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
              setForm({ title: '', description: '', category: '' })
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

          <button type="submit" className="btn-primary w-full">
            Submit Suggestion
          </button>
        </form>
      </div>
    </div>
  )
}
