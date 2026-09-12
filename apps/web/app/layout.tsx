import './globals.css';
import './nav-overrides.css';
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html><body>{children}</body></html>
}
