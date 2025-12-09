export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-4">
      <div className="max-w-7xl mx-auto px-8 text-center">
        <p className="text-gray-500 text-sm">
          Erstellt von{' '}
          <a
            href="https://meimberg.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors underline"
          >
            meimberg.io
          </a>
        </p>
      </div>
    </footer>
  )
}
