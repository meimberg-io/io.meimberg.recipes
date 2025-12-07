'use client'

import { useState } from 'react'

interface TestResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
  data?: any
}

export default function TestPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [summary, setSummary] = useState<any>(null)

  const runTest = async () => {
    setLoading(true)
    setResults([])
    setSummary(null)

    try {
      const response = await fetch('/api/test-notion')
      const data = await response.json()

      setResults(data.results || [])
      setSummary(data.summary || null)
    } catch (error) {
      console.error('Test error:', error)
      setResults([
        {
          step: 'Request',
          status: 'error',
          message: 'Failed to run test',
          data: { error: String(error) },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'warning':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-400/10 border-green-400/20'
      case 'error':
        return 'bg-red-400/10 border-red-400/20'
      case 'warning':
        return 'bg-yellow-400/10 border-yellow-400/20'
      default:
        return 'bg-gray-400/10 border-gray-400/20'
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Notion Connection Test</h1>
        <p className="text-gray-400 mb-8">
          This page helps you verify your Notion API connection and database setup.
        </p>

        <button
          onClick={runTest}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {loading ? 'Testing...' : 'Run Test'}
        </button>

        {summary && (
          <div
            className={`mt-8 p-6 rounded-lg border ${
              summary.allPassed
                ? 'bg-green-400/10 border-green-400/20'
                : summary.hasErrors
                ? 'bg-red-400/10 border-red-400/20'
                : 'bg-yellow-400/10 border-yellow-400/20'
            }`}
          >
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <div className="space-y-1">
              <p>
                All tests passed:{' '}
                <span className={summary.allPassed ? 'text-green-400' : 'text-red-400'}>
                  {summary.allPassed ? 'Yes' : 'No'}
                </span>
              </p>
              {summary.hasErrors && (
                <p className="text-red-400">Some errors were found</p>
              )}
              {summary.hasWarnings && (
                <p className="text-yellow-400">Some warnings were found</p>
              )}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusBg(result.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{result.step}</h3>
                  <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-300 mb-2">{result.message}</p>
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                      Show details
                    </summary>
                    <pre className="mt-2 p-3 bg-black/20 rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How to get your credentials:</h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-2">1. Notion Integration Token</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Go to{' '}
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    https://www.notion.so/my-integrations
                  </a>
                </li>
                <li>Click &quot;+ New integration&quot;</li>
                <li>Name it (e.g., &quot;Recipe Menu App&quot;)</li>
                <li>Select &quot;Read content&quot; capability</li>
                <li>Click &quot;Submit&quot;</li>
                <li>Copy the token (starts with <code className="bg-gray-700 px-1 rounded">secret_</code> or <code className="bg-gray-700 px-1 rounded">ntn_</code>)</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">2. Database ID</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Open your Notion recipe database</li>
                <li>Look at the URL in your browser</li>
                <li>It looks like: <code className="bg-gray-700 px-1 rounded">https://www.notion.so/workspace/DATABASE_ID?v=...</code></li>
                <li>The Database ID is the long string between the last <code className="bg-gray-700 px-1 rounded">/</code> and <code className="bg-gray-700 px-1 rounded">?</code></li>
                <li>Copy that ID (usually 32 characters)</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">3. Share Database with Integration</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>In your Notion database, click the &quot;...&quot; menu (top right)</li>
                <li>Select &quot;Connections&quot; or &quot;Add connections&quot;</li>
                <li>Find and select your integration</li>
                <li>Click &quot;Confirm&quot;</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">4. Add to .env.local</h3>
              <p className="ml-4">
                Create <code className="bg-gray-700 px-1 rounded">.env.local</code> in the project root:
              </p>
              <pre className="mt-2 ml-4 p-3 bg-black/20 rounded text-xs">
{`NOTION_TOKEN=secret_xxxxx
NOTION_DATABASE_ID=your-database-id
REVALIDATE_SECRET=your-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

