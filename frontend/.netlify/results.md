The SmoothScar homepage and cart gained the conversion features that were requested, built on the site's existing alabaster, oat, sage, terracotta and plum theme.

- **Hero badge:** a sage-bordered "Clinical research" badge now sits over the product image and links to the Science page.
- **Before & after slider:** the existing interactive slider can now show custom labels and uses sage arrow handles. The homepage section for it stays hidden until approved photos are added to a setting at the top of `app/index.tsx`.
- **Save-your-place modal:** this pop-up appears when a desktop visitor moves to leave the page, or after 45 seconds of inactivity on a phone. It shows at most once a week. It asks for an email address and a consent checkbox, and it saves the email as a new `save-cart` Netlify Forms submission, so administrators can see these entries alongside the provider inquiries.
- **Cart add-on tray:** the cart now has a "Complete your postpartum care" tray. It suggests one real BioRNA product the shopper doesn't already have, such as a gift pack, and offers a one-tap toggle to add it or remove it again.

Some of the requested content was not published because it isn't true or can't be backed up yet:

- **Unverified claims:** the 4.9/5 rating from 12,000+ mothers, HSA/FSA eligibility, ISO 10993 certification and "breastfeeding safe" have no source.
- **Products and prices:** the 6-patch, 18-patch and subscription products and their $48, $115 and $40.80 prices don't exist in the manufacturer's catalog. The gel and compression-wrap add-on doesn't exist either. The site shows the real packs, which read "Price coming soon" until USD prices are set in `src/catalog.ts`.
- **Discounts and texting:** the 10% save-cart discount and the SMS option weren't added, because no discount system or texting service exists. The modal only collects an email address.
- **Guarantee and payment icons:** the 30-day refund guarantee and the payment-card icons are still out, because no refund policy or payment provider exists.
- **Before/after photos:** the photos in the repository come from the confidential clinician deck, so they weren't used.
- **Medical claims:** "heal it," "flatline tissue" and "cellular" healing claims weren't used.

Still to do: no email is sent to people who use the save-your-place modal. Netlify only stores their addresses, so a follow-up email has to be set up separately. The new files pass type checks and lint, but nothing has been viewed in a browser or test-submitted yet.
