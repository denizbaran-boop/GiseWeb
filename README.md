# Gişe Web

Event ticketing and AI-assisted discovery platform — SOFT3111 Internet and Web Programming, Group 13 (Işık University).

**Team:** Deniz Baran (23COMP1010) · Alper Erol (23COMP1043) · Emre Kendirci (23COMP1008)

- **Project proposal:** [ProjectProposal.docx](ProjectProposal.docx)
- **Interactive prototype:** https://denizbaran-boop.github.io/GiseWeb/ (GitHub Pages)

## Prototype

A static, multi-page clickable prototype of the planned web application (HTML, CSS and vanilla JavaScript; no backend yet). State such as login, tickets and bans is kept in the browser's `localStorage`.

| Page | File |
| --- | --- |
| Discover (event grid) | `index.html` |
| Sign in / Sign up | `giris.html`, `kayit.html` |
| Event detail + checkout | `etkinlik.html` |
| Ticket confirmation (QR pass) | `bilet.html` |
| Profile & my tickets | `profil.html` |
| Account settings | `ayarlar.html` |
| Create event (organizer) | `olustur.html` |
| User management (admin) | `yonetim.html` |

Use the role switch under the sign-in form to enter as Attendee, Organizer or Admin. The **Asistan** button opens the event assistant demo, which understands Turkish and English; in the prototype its answers are rule-based and come only from the app's event data — the final project will use an LLM API. Use "Demo verisini sıfırla" in the footer to reset the demo.
