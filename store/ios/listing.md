# App Store listing (iOS)

Fields as App Store Connect asks for them; limits in brackets. Shared text comes from `store/listing.md` (Play).

**Name** [30]: Mental Math Secrets - Mastery (home-screen name stays "Mental Math Trainer"; that store name is taken)
**Subtitle** [30]: Learn and drill mental math
**Bundle ID:** dev.hbq.mentalmath · **SKU:** mentalmath · **Apple ID:** 6821235222 · **Price:** Free
**Primary category:** Education · **Secondary:** Reference
**Age rating:** 4+ (every questionnaire answer None/No; no web browsing, no user content, no purchases)
**Copyright:** 2026 HBQDEV
**Support URL:** https://mentalmath.hbqnexus.win/
**Privacy Policy URL:** https://mentalmath.hbqnexus.win/privacy-policy.html
**App Privacy:** Data Not Collected (no tracking; `ios/App/App/PrivacyInfo.xcprivacy` declares the same)
**Export compliance:** no non-exempt encryption (`ITSAppUsesNonExemptEncryption` = NO in Info.plist)

## Promotional text [170]

Learn the tricks from Secrets of Mental Math, then drill them: timed sprints, a shot clock and a Due today list that brings each technique back on the right day.

## Keywords [100, comma-separated]

mental math,arithmetic,multiplication,calculation,speed math,tricks,squares,brain,drills,practice

## Description [4000]

Mental Math Trainer is an interactive edition of Secrets of Mental Math by Arthur Benjamin and Michael Shermer. Read the book chapter by chapter, then practice every technique it teaches, from left-to-right addition to five-digit squares and the day-of-the-week calendar trick.

READ
• Every chapter, typeset for iPhone and iPad, one section per page
• Worked examples redrawn as crisp figures that follow your text size and theme
• Four reading fonts, a text-size slider, paper, bright and dark themes

PRACTICE
• The book's own exercise pages with the authors' answers and step-by-step methods
• Endless generated problems that follow each chapter's method, in three difficulties
• A distraction-free drill screen with an on-screen keypad and instant feedback
• Worksheet mode: a whole page of problems, answered in any order
• Timed drills: 1, 2 or 5 minute sprints and a per-problem shot clock, with personal bests

PROGRESS
• Streaks, accuracy, time practised and per-chapter reading progress
• Spaced review: a Due today list brings each technique back on the right day
• Collects nothing: no account, no tracking, no ads; your place and scores stay on your device; works offline
• Back up and restore your progress as a file

Not affiliated with the authors or publisher of Secrets of Mental Math.

## What's New (first release)

First release on iPhone and iPad: the full book, every exercise set, generated and timed drills, spaced review and progress, all offline.

## Review notes

No account or sign-in. Everything works offline; nothing is sent to a server. To see a drill: Practice tab → any technique → Generate. Settings → Save a backup opens the share sheet with a JSON file of the learner's own progress.

## Screenshots

Captured from the simulators with `e2e-ios/store-shots.mjs` (status bar 9:41, seeded progress); files in `store/ios/` (not in git, regenerate with `scripts/mentalmath.sh ios:store-shots`).

| Display | Size | Folder |
|---|---|---|
| iPhone 6.9" (required) | 1320 × 2868 | store/ios/iphone/ |
| iPad 13" (required for iPad) | 2064 × 2752 | store/ios/ipad/ |

Order: home, reader, drill, feedback with steps, practice hub, timed drill sheet, progress, dark drill.
