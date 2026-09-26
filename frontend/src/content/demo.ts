// Text for the built-in demo model: settings card + the "limit reached" panel.

export const demoCard = {
  title: "Free demo model",
  body: "Included so you can try Redline right away. Each account gets a few free requests a day (a review, a chat question or an insight counts as one).",
  privacy:
    "Demo requests go to Google Gemini's free tier, which may use them to improve Google's products. Don't upload private code with the demo.",
  inUse: "In use: you haven't added your own model yet.",
  notInUse: "Not in use: your own model is used instead, with no demo limit.",
};

export const demoLimitPanel = {
  userTitle: "Today's free demo requests are used up",
  siteTitle: "The free demo is used up for today",
  siteBody: "All accounts share a daily demo budget, and it's gone for today.",
  busyTitle: "The free demo model is busy right now",
  busyBody:
    "Too many requests at the same time. Try again in a minute, or use your own model.",
  stepsIntro:
    "To keep going now, add your own model. It takes about 2 minutes:",
  steps: [
    {
      text: "Get a free API key from Google AI Studio.",
      link: {
        href: "https://aistudio.google.com/apikey",
        label: "Open Google AI Studio",
      },
    },
    {
      text: "Open Settings → Add provider → pick the Gemini preset and paste the key.",
    },
    {
      text: "Click Test connection, then Save. From then on your own model is used, with no demo limit.",
    },
  ],
  local:
    "Prefer free and private? Run Redline on your computer with Ollama (see the README).",
  cta: "Add your own model →",
};
