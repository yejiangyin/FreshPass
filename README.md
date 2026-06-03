# FreshPass

A local-first, privacy-friendly Chrome password generator extension built with Manifest V3.

> Generate instantly · Auto-refresh by default · Fully customizable rules · Copy-only history · Local storage · No password uploads

## Features

- **Instant generation**: click the extension icon to generate a fresh strong password.
- **Auto refresh**: refreshes every 60 seconds by default, with presets for 15/30/60/120/300 seconds or a custom interval from 10 to 3600 seconds.
- **Regenerate or lock**: regenerate manually at any time, or lock the current password to pause refreshing.
- **Customizable password rules**:
  - Password length from 8 to 64 characters
  - Uppercase, lowercase, numbers, and special symbols
  - Symbol modes: common `!@#$%^&*`, full, or custom
  - Require at least one character from each selected type
  - Exclude ambiguous characters such as `O0Il1`
  - Custom excluded characters
  - Disallow repeated characters or sequential characters
  - Optional uppercase first character
- **Light and dark themes**: follow the system theme or choose manually.
- **Strength evaluation**: weak, medium, strong, and very strong levels with a progress bar.
- **Copy history**: records only passwords you explicitly copy, with masking, re-copy, delete, and clear-all actions.
- **History controls**: maximum entry limit, automatic cleanup period, and masked-by-default display.
- **Reset defaults**: restore password rules without deleting copy history.

## Installation

1. Open Chrome and visit `chrome://extensions/`.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select this project folder.
5. Click the FreshPass icon in the toolbar to use the extension.

## Privacy

- Passwords are generated locally in your browser using the Web Crypto API.
- Passwords are not uploaded, synced, or shared.
- The extension does not read webpage content or track browsing history.
- Copy history is saved to `chrome.storage.local` only when you click **Copy password**.
- Avoid enabling copy history on public or shared devices.

## Permissions

FreshPass requests only one permission:

| Permission | Purpose |
| --- | --- |
| `storage` | Store settings and copied-password history locally. |

## Project Structure

```text
FreshPass/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── utils/
│   ├── passwordGenerator.js
│   ├── strength.js
│   └── storage.js
├── assets/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla HTML, CSS, and JavaScript
- Web Crypto API
- Clipboard API
- `chrome.storage.local`

## License

MIT
