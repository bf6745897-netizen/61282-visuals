# Webflow Variables Generator

Single-page app (HTML/CSS/vanilla JS) for generating a Webflow Variables Utility CSV.

## Usage

1. Open `index.html` in a browser.
2. Enter 2–5 labeled hex colors, 2–3 fonts, and a base text size.
3. Click **Generate & Download CSV**.
4. Import `webflow-variables.csv` into Webflow Variables Utility.

## Output format

CSV columns are fixed and emitted in this order:

`Name,Type,Value,Unit,Linked Variable`

`Linked Variable` is always `false`.
