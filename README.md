# Ogarnij — zadania i projekty

Prosty menedżer zadań w stylu Nozbe, działający w przeglądarce (komputer) i na telefonie
(jako instalowalna aplikacja PWA, także offline). Bez serwera i bez kroku budowania — czysty HTML, CSS i JS.

## Funkcje

- **Skrzynka** – wszystko, co nie ma jeszcze projektu.
- **Priorytet** – zadania oznaczone gwiazdką; kolejność ustawiasz przeciągając.
- **Na dziś** (z zaległymi) i **Nadchodzące** – zadania z terminem, pogrupowane po dniach.
- **Projekty** i **etykiety** z kolorami; licznik otwartych zadań i pasek postępu.
- Szczegóły zadania: termin, powtarzanie (codziennie, w dni robocze, co tydzień/miesiąc/rok),
  etykiety, notatka, lista kontrolna, komentarze z datą (linki są klikalne).
- Szybkie dodawanie: `Zadzwonić do Ani #Praca @telefon !`
  (`#` – projekt, `@` – etykieta, nieistniejąca zostanie utworzona, `!` – priorytet).
- Przeciąganie zadania (komputer) na projekt / etykietę / Priorytet / Na dziś w pasku bocznym.
- Cofanie ukończenia i usunięcia, wyszukiwarka, motyw jasny/ciemny, eksport i import kopii (JSON).
- Skróty: `n` – nowe zadanie, `/` – szukaj, `Esc` – zamknij.

## Uruchomienie lokalnie

```bash
python3 -m http.server 8000
```

Następnie otwórz http://localhost:8000.

## Publikacja (żeby działało na telefonie)

Najprościej przez **GitHub Pages**: w repozytorium *Settings → Pages → Source: Deploy from a branch*,
wybierz gałąź i folder `/ (root)`. Po chwili aplikacja będzie pod adresem
`https://<użytkownik>.github.io/<repozytorium>/`. Działa też na Netlify, Vercel czy Cloudflare Pages
(wystarczy wgrać pliki).

Na telefonie otwórz ten adres i:
- **Android (Chrome):** menu ⋮ → *Zainstaluj aplikację* / *Dodaj do ekranu głównego*,
- **iPhone (Safari):** przycisk *Udostępnij* → *Do ekranu początkowego*.

## Dane

Dane są zapisywane w pamięci przeglądarki (`localStorage`) na danym urządzeniu.
Aby przenieść zadania między komputerem a telefonem, użyj *Ustawienia → Eksportuj / Importuj*.
Automatyczna synchronizacja między urządzeniami wymagałaby backendu (np. Supabase lub Firebase).
