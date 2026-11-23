# US-04 – Language switch (ES / EN / PT)  · *added by the human (candidate), not in the brief*
> Origin: request from the human operator at session start ("additionally, a translation feature between Spanish, English and Portuguese"). Recorded as a story so it goes through the same flow.

**Story** — As a person getting a quote, I want to switch the interface and the insurance content between Spanish, English and Portuguese, so that I can understand the offer even if Spanish is not my first language.

**Business rules**
- Available languages: Spanish (default), English, Portuguese.
- Language is independent of country: a person in Chile may read in Portuguese and still pay in CLP.
- Business copy (labels, errors, plans, terms) is translated by the business team in Strapi; missing translations fall back to Spanish.
- Switching language must not lose entered data or the selected plan.

```gherkin
Scenario: Switch language mid-wizard
  Given I filled step 1 in Spanish
  When I switch to English
  Then labels, buttons and plan texts are shown in English
  And my entered data is still there
```
