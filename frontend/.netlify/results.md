The whole SmoothScar site now uses a single warm color scheme and shared template. The theme was remapped so every page draws from one set of colors: alabaster (#FDFBF7) backgrounds, oat (#F3ECE3) section panels, terracotta rose (#C3816F) buttons with alabaster text, muted sage (#8A9A86) for trust icons, dividers and step markers, and deep plum (#3D2E3A) for body text with relaxed line spacing. That covers the storefront, product pages, cart, the BioRNA-C collection, the Science page, the provider portal, the brochure library, the inquiry forms and the privacy page. Hardcoded blue and silver colors were removed. Small accent text uses a deeper terracotta (#9A5A48) so it stays readable, and filled badges use plum or sage. Shared buttons now have rounded-md corners, larger text and a soft shadow, and can show an icon.

The homepage was rebuilt on the requested conversion layout:

- **Hero:** two columns. The left has the headline, two buttons ("Shop Recovery Patches" and "Gift This to a New Mom" with a gift icon) and supporting copy. The right shows the BioRNA-C gift box with the standard box as an inset.
- **Proof strip:** four highlights on an oat band.
- **Purchase grid:** three "choose your path" cards (Starter Pack, Gift Pack with a sage "Gift for a New Mom" ribbon, and Standard Pack), followed by a link to all five products.
- **How it works:** three steps.
- **Closing bar:** a checkout and reassurance bar.

Some of the requested copy and offers were replaced with accurate versions, because publishing them would mean making up claims or products:

- **Proof claims left out:** the 4.9/5 rating from 12,000+ mothers, "breastfeeding safe," ISO 10993 certification, and HSA/FSA eligibility. None of these have been verified.
- **Medical claims left out:** "heal it," "flatline tissue" and "root cellular level," which are unsubstantiated.
- **Products and prices:** the 6-patch, 18-patch and subscription products, and their $48, $115 and $40.80 prices, don't exist in the manufacturer's catalog. The cards show the real packs instead, which display "Price coming soon" until USD prices are set in `src/catalog.ts`.
- **Guarantee and payment icons:** the 30-day refund guarantee and the payment-card icons weren't added. No refund policy or payment provider exists yet, so the closing bar explains that checkout is not open.

Type checks and lint passed for the changed files. The site has not been viewed in a browser yet.
