import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UX 감사 코파일럿",
  description: "제품 URL을 UX QA 리포트로 바꿔주는 MVP입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
