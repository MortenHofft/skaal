# Margretheskål 🥣

En dansk udgave af festspillet *Celebrity / Time's Up / Fishbowl*: hver spiller fylder en virtuel skål med film og serier, derefter trækker man på skift sedler og skal forklare titlen til de andre uden at sige nogen af ordene fra titlen.

Lavet til en familie hvor en af spillerne ikke kan læse endnu — sedler er **billeder af filmplakater** i stedet for tekst, så små børn også kan være med.

## Sådan kommer I i gang

1. **Hent en gratis TMDb-nøgle** på <https://www.themoviedb.org/settings/api> (vælg "API Read Access" v3).
2. Åbn appen → tryk på *Indstillinger* → indsæt nøglen.
3. Tilføj spillere. For børn der ikke kan læse: slå *Kid mode* til på deres profil — så vises kortet kun som plakat (ingen tekst).
4. På hver spiller: søg film/serier og tap for at tilføje til din seddel-bunke.
5. Tryk *Ny runde* → vælg deltagere → start.

## Sådan spiller I

- Telefonen sendes på skift mellem spillerne (pass-and-play).
- Når det er din tur: tap *for at starte*, og forklar plakaten på skærmen til de andre uden at bruge nogen ord fra titlen. Mim hvis I vil! Tap *Gættet* når en anden gætter rigtigt, eller *Spring* hvis det er for svært.
- Sprungne sedler kommer tilbage i skålen senere i runden.
- Når skålen er tom → resultater og fejring 🏆

## Deploy (ingen build-step!)

Det er en helt statisk side — bare HTML, CSS og native ES-moduler. Ingen npm, ingen bundler.

### GitHub Pages
1. Push repoet til GitHub.
2. *Settings → Pages → Build from branch → main / `/` (root)*.
3. Færdig — appen serveres på `https://<bruger>.github.io/<repo>/`.

### Andre værter
Upload alle filer (`index.html`, `styles.css`, `src/`) til en hvilken som helst statisk host (Netlify drag-and-drop, Vercel, S3, Cloudflare Pages, …). Skal serveres over HTTP(S) — `file://` virker ikke pga. ES-moduler.

## Filer

```
index.html
styles.css
src/
  main.js          hash-router
  dom.js           el() helper + shuffle
  state.js         localStorage-wrapper
  api.js           TMDb-søg + plakat-URLs
  views/
    home.js        forside, spillerliste, indstillinger
    player.js      rediger spiller + søg sedler
    setup.js       vælg deltagere + timer
    play.js        spilleskærm med timer
    results.js     scoretavle + spil igen
```

Al data (spillere, sedler, indstillinger) gemmes i `localStorage` på den enhed I spiller på.

## Privacy

- Plakatbilleder hentes fra TMDb's CDN.
- Søgeforespørgsler sendes til TMDb's API.
- Alt andet bliver lokalt på din telefon.
