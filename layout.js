import './globals.css';

export const metadata = {
  title: 'Pitchd | 3-minute daily interview prep',
  description:
    'One 3-minute set of interview questions a day for every business major. Streaks, review of missed questions, and a weekly news card.',
  appleWebApp: { capable: true, title: 'Pitchd', statusBarStyle: 'default' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b7bf0',
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
