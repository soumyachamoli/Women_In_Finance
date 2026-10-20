# SheCodes Finance

A simple personal finance app for women with irregular income. Log money by speaking in Hindi or Hinglish, see how much is safe to spend this week, save towards goals, and keep a private PIN-locked vault.

Built for the Tech Geeks hackathon by team SheCodes.

## Try it

**Live link:** https://soumyachamoli.github.io/Women_In_Finance/

Nothing to install. Open the link in Chrome (phone or laptop) and click **Load sample data** on the home page to see it with six weeks of example entries.

You can also download this repo and double-click `index.html`. Everything works offline except voice input, which needs the live link.

## Features

- Voice or text entry in Hindi / Hinglish / English, e.g. "450 ka dhaaga liya aur 2000 silai ke mile". The app finds the amount, whether it is income or an expense, and a category. You check it before it is saved.
- Safe-to-spend amount for the week, based on your lower-income weeks instead of your average.
- Savings goals with progress and how much to save per month.
- SIP and EMI calculators that update as you type.
- Investment tracker (FD, SIP, gold, etc.) with total gain.
- Private vault with its own PIN, encrypted on the device.
- Short lessons (emergency fund, budgeting, SIP, EMI, fraud safety), suggested based on what you have done so far.
- Works offline and can be installed on a phone like an app.

## Privacy

All data stays in the browser on the user's own device (localStorage). Nothing is sent to a server. Vault items are encrypted with AES-GCM using a key derived from the PIN (PBKDF2, 310,000 rounds), so they can't be read without the PIN.

## How it works

- `js/parser.js` splits a sentence on "aur" / commas, finds the amount (digits, "2k", or words like "dedh hazaar", "dhai sau"), decides income vs expense from words like "mila", "aaye" or "liya", "diya", and picks a category from keywords. If no keyword matches, a small Naive Bayes classifier trained on example phrases guesses the category.
- `js/budget.js` adds up income per week and uses the 20th percentile of past weeks as the safe weekly amount (average × 0.8 if there are fewer than 3 weeks).
- `js/calc.js` has the SIP and EMI formulas.
- `js/vault.js` does the encryption with the browser's Web Crypto API.
- `js/app.js` is the interface.

## Tests

If you have Node.js: `node tests/test.js`

## Not done yet

- Accounts and sync across devices (data is per device for now)
- Speech-to-text that works without Chrome
- Hindi interface for every screen
- Better income forecasting once there is more data

## Team

Soumya Chamoli, Komal Negi, Akansha Badola, Tarunika Goswami, Gauri Negi
