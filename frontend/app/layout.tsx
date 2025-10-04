import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>ChainBond - Secure Rating Platform</title>
        <meta name="description" content="A secure blockchain-based rating platform using FHEVM" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}


