# Webflow Variables CSV Generator

A no-install, no-build, framework-free GUI for generating a Webflow Variables CSV file.

## Run locally

1. Open `index.html` directly in your browser (double-click works).
2. Fill in the token inputs.
3. Click **Generate**.
4. Click **Download CSV** to download `webflow-variables.csv`.

## Notes

- Built with pure HTML, CSS, and vanilla JavaScript.
- Primary and secondary color inputs include both color pickers and hex fields kept in sync.
- CSV format is exactly: `Name,Type,Unit,Value,Linked Variable`.
- Download button stays disabled until a successful generation.
