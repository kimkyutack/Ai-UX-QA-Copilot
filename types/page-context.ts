export type PageContext = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  buttons: string[];
  links: string[];
  textSnippet: string;
  textLength: number;
  signalScore: number;
  warnings: string[];
  source: "fetch" | "playwright";
  screenshotDataUrl?: string;
};
