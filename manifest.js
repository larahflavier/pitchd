export default function manifest() {
  return {
    name: 'Pitchd',
    short_name: 'Pitchd',
    description: '3-minute daily interview prep for business students',
    start_url: '/',
    display: 'standalone',
    background_color: '#3b7bf0',
    theme_color: '#3b7bf0',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
