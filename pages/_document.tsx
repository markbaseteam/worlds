import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html className="h-full bg-neutral-800">
      <Head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon-512x512.png" />
      </Head>
      <body className="h-full text-white scrollbar-thin scrollbar-thumb-neutral-900 scrollbar-track-neutral-800">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
