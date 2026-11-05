# Ogarnij — zadania i projekty

Prosty menedżer zadań w stylu Nozbe, działający w przeglądarce (komputer) i na telefonie
(jako instalowalna aplikacja PWA, także offline). Bez serwera i bez kroku budowania — czysty HTML, CSS i JS.

## Funkcje

- **Pulpit** – podsumowanie dnia: liczba zadań na dziś i zaległych, ukończone w tym tygodniu (vs poprzedni),
  seria dni z ukończonym zadaniem, wykres obciążenia na 14 dni, „Następne kroki”, struktura zadań wg macierzy
  Eisenhowera, mapa aktywności (ostatnie pół roku) i postęp projektów. Każdy wykres ma podgląd wartości
  po najechaniu i widok tabeli.
- **Skrzynka** – wszystko, co nie ma jeszcze projektu.
- **Priorytet** – zadania oznaczone gwiazdką; kolejność ustawiasz przeciągając.
- **Na dziś** (z zaległymi) i **Nadchodzące** – zadania z terminem, pogrupowane po dniach.
- **Projekty** i **etykiety** z kolorami; licznik otwartych zadań i pasek postępu. Projekt można usunąć prosto
  z widoku Projekty – z przeniesieniem zadań do Skrzynki albo razem z nimi (z możliwością cofnięcia).
- Wygląd w stylu **japandi**: papier ryżowy, len, jasne drewno i tusz, stonowane kolory, szeryfowe nagłówki;
  jasny i ciemny motyw.
- Szczegóły zadania: termin, powtarzanie (codziennie, w dni robocze, co tydzień/miesiąc/rok),
  etykiety, notatka, lista kontrolna, komentarze z datą (linki są klikalne).
- Szybkie dodawanie: `Zadzwonić do Ani #Praca @telefon !`
  (`#` – projekt, `@` – etykieta, nieistniejąca zostanie utworzona, `!` – priorytet).
- **Macierz Eisenhowera** – każde zadanie można oznaczyć jako ważne/nieważne i pilne/niepilne;
  widok *Macierz* pokazuje cztery ćwiartki (Zrób teraz, Zaplanuj, Deleguj, Odpuść) i zadania bez oceny.
  Na każdym zadaniu widać mini-macierz 2×2 z podświetloną ćwiartką i kolorowy pasek z boku.
- **Mapa priorytetów** (Macierz → *Mapa*) – zadania jako bańki na planszy ważne/pilne: im bliżej termin,
  tym bańka bardziej w stronę „pilne”; wielkość = liczba punktów do zrobienia, pierścień = postęp listy
  kontrolnej, pulsowanie = po terminie, gwiazdka = priorytet, kropka = kolor projektu. Bańki można
  przeciągać (mysz lub palec), żeby zmienić ocenę, a z listy „Bez oceny” wrzucać je na mapę.
- Przeciąganie zadania (komputer) na projekt / etykietę / Priorytet / Na dziś w pasku bocznym albo na ćwiartkę macierzy.
- **Przeciąganie palcem na telefonie** – przytrzymaj zadanie ok. pół sekundy i przesuń, żeby zmienić kolejność
  albo przenieść je do innej ćwiartki macierzy (lista sama się przewija przy krawędzi ekranu).
- Cofanie ukończenia i usunięcia, wyszukiwarka, motyw jasny/ciemny, eksport i import kopii (JSON).
- **Synchronizacja między laptopem a telefonem** przez bazę danych Supabase (opis niżej).
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

## Synchronizacja laptop ↔ telefon (baza danych Supabase)

Aplikacja zawsze działa na danych lokalnych (także offline), a po zalogowaniu w tle synchronizuje je
z bazą Postgres w [Supabase](https://supabase.com) (darmowy plan wystarczy). Zmiany z drugiego urządzenia
pojawiają się na żywo. Przy konflikcie na tym samym zadaniu wygrywa nowsza zmiana.

### Jednorazowa konfiguracja (ok. 5 minut)

1. Załóż konto na https://supabase.com i utwórz nowy projekt (region np. *Central EU (Frankfurt)*).
2. W projekcie otwórz **SQL Editor → New query**, wklej zawartość pliku [`supabase/schema.sql`](supabase/schema.sql)
   i kliknij **Run**. To tworzy tabelę `items` z zabezpieczeniem — każdy użytkownik widzi tylko swoje dane.
3. (Zalecane) **Authentication → Sign In / Providers → Email**: wyłącz *Confirm email*,
   żeby po założeniu konta nie trzeba było klikać w link z maila.
4. **Project Settings → API**: skopiuj *Project URL* i klucz *anon* / *publishable*.
5. Wpisz je w jeden z dwóch sposobów:
   - **w pliku `config.js`** (najwygodniej — po opublikowaniu każde urządzenie od razu je zna), albo
   - w aplikacji: **Ustawienia → Synchronizacja** (trzeba to zrobić na każdym urządzeniu).
   
   Klucz *anon* jest publiczny z założenia — dane chroni logowanie i reguły RLS w bazie.
   Nigdy nie wpisuj tu klucza *service_role* / *secret*.

### Używanie

1. Na laptopie: **Ustawienia → Synchronizacja → Załóż konto** (e-mail + hasło). Dane z laptopa trafią do chmury.
2. Na telefonie: otwórz aplikację, **Ustawienia → Zaloguj** tym samym kontem. Aplikacja zapyta,
   czy zastąpić dane na telefonie danymi z chmury — wybierz **OK**.
3. Gotowe. Stan synchronizacji widać na dole paska bocznego (zielona kropka = zsynchronizowano).

Bez internetu wszystko działa normalnie; zmiany wyślą się po odzyskaniu połączenia.

### Jak to działa

- Każde zadanie, projekt i etykieta to jeden wiersz w tabeli `items` (`data` w JSONB).
- Usunięcie zostawia „nagrobek” (`deleted = true`), żeby inne urządzenia też usunęły rekord.
- `updated_at` to czas zmiany na urządzeniu — wyzwalacz w bazie nie pozwala starszej zmianie nadpisać nowszej.
- `server_ts` to czas zapisu na serwerze — urządzenie pobiera tylko to, co zmieniło się od ostatniej synchronizacji.
- Powiadomienia na żywo: Supabase Realtime.

Bez skonfigurowanego Supabase dane zostają tylko w przeglądarce (`localStorage`); można je wtedy przenosić
przez *Ustawienia → Eksportuj / Importuj*.

## Pliki

- `index.html`, `styles.css`, `app.js` — aplikacja
- `sync.js` — synchronizacja z Supabase
- `config.js` — adres i klucz projektu Supabase
- `supabase/schema.sql` — schemat bazy danych
- `sw.js`, `manifest.webmanifest`, `icons/` — instalacja na telefonie i praca offline
- `vendor/supabase.js` — biblioteka @supabase/supabase-js 2.118.0 (licencja MIT), dołączona, żeby nie zależeć od CDN
