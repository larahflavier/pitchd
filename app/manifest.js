export default function manifest() {
  return {
    name: 'Pitchd',
    short_name: 'Pitchd',
    description: '3-minute daily interview prep for business students',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f5f9',
    theme_color: '#f4f5f9',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
