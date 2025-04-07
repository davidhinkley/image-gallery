import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="A beautiful image gallery built with Next.js"
        />
      </Head>
      <body className="bg-black antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}