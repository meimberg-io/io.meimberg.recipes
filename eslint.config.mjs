import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

// eslint-config-next ships CJS flat-config arrays; unwrap the default interop.
const coreWebVitals = nextCoreWebVitals.default ?? nextCoreWebVitals

const config = [
  ...coreWebVitals,
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'],
  },
]

export default config
