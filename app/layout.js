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
  themeColor: '#f4f5f9',
  viewportFit: 'cover',
};

// Development only (compiled out of production builds): open any page with ?reduce=1 and the app behaves as if
// the phone's "reduce motion" setting were on. It lets the team test reduced motion without changing OS settings.
const REDUCE_MOTION_PROBE = `try{if(location.search.indexOf('reduce=1')>-1){var o=window.matchMedia.bind(window);window.matchMedia=function(q){if(/prefers-reduced-motion/.test(q)){return{matches:true,media:q,onchange:null,addListener:function(){},removeListener:function(){},addEventListener:function(){},removeEventListener:function(){},dispatchEvent:function(){return false}}}return o(q)}}}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {process.env.NODE_ENV !== 'production' && <script dangerouslySetInnerHTML={{ __html: REDUCE_MOTION_PROBE }} />}
        {children}
      </body>
    </html>
  );
}
