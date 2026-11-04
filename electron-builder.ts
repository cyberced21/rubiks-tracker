import type { Configuration, MacConfiguration, WindowsConfiguration } from 'electron-builder'

// Windows signing via Azure Artifact Signing (formerly Trusted Signing).
// Enabled only when AZURE_SIGNING_ENDPOINT is set; credentials are read by the
// signing module from AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET.
function azureSignOptions(): WindowsConfiguration['azureSignOptions'] {
  const env = process.env
  if (!env.AZURE_SIGNING_ENDPOINT) return undefined

  const required = [
    'AZURE_SIGNING_ACCOUNT',
    'AZURE_SIGNING_CERT_PROFILE',
    'AZURE_SIGNING_PUBLISHER',
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET'
  ]
  const missing = required.filter((name) => !env[name])
  if (missing.length > 0) {
    throw new Error(`AZURE_SIGNING_ENDPOINT is set but these are missing: ${missing.join(', ')}`)
  }

  return {
    endpoint: env.AZURE_SIGNING_ENDPOINT,
    codeSigningAccountName: env.AZURE_SIGNING_ACCOUNT!,
    certificateProfileName: env.AZURE_SIGNING_CERT_PROFILE!,
    publisherName: env.AZURE_SIGNING_PUBLISHER!
  }
}

// macOS signing uses a Developer ID certificate from CSC_LINK / CSC_KEY_PASSWORD,
// and electron-builder notarizes when APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD and
// APPLE_TEAM_ID are set. Without a certificate the app is ad-hoc signed, which
// Apple Silicon requires for it to launch at all.
const hasMacCertificate = Boolean(process.env.CSC_LINK)

function macIdentity(): MacConfiguration['identity'] {
  return hasMacCertificate ? undefined : '-'
}

// better-sqlite3 ships prebuilt binaries for every platform; keep only the
// one matching the target, and drop the SQLite sources used for node-gyp builds
const sqlite = 'node_modules/better-sqlite3'
const onlyPrebuild = (target: string): string[] => [
  `!${sqlite}/prebuilds/!(${target}-\${arch}).node`
]

const config: Configuration = {
  appId: 'com.rubiks-tracker',
  productName: 'Rubiks Tracker',
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  // better-sqlite3 uses N-API prebuilds, so nothing needs rebuilding for Electron
  npmRebuild: false,
  electronFuses: {
    runAsNode: false,
    enableCookieEncryption: true,
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: false,
    onlyLoadAppFromAsar: true
  },
  directories: {
    output: 'dist'
  },
  files: ['out/**/*', `!${sqlite}/{deps,src}/**`, `!${sqlite}/binding.gyp`],
  win: {
    target: 'nsis',
    icon: 'resources/icon.ico',
    files: onlyPrebuild('win32'),
    azureSignOptions: azureSignOptions()
  },
  mac: {
    // One DMG per architecture rather than a universal build: the two SQLite
    // binaries differ, and a universal bundle would carry both
    target: [{ target: 'dmg', arch: ['arm64', 'x64'] }],
    icon: 'resources/icon.png',
    category: 'public.app-category.utilities',
    files: onlyPrebuild('darwin'),
    identity: macIdentity(),
    // Required for notarization; with ad-hoc signing its library validation
    // would refuse to load the SQLite native module
    hardenedRuntime: hasMacCertificate
  },
  linux: {
    target: 'AppImage',
    icon: 'resources/icon.png',
    category: 'Utility',
    files: onlyPrebuild('linux')
  }
}

export default config
