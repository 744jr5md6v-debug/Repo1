# Rzeczny Rajd

Gra w stylu klasycznego *River Raid* z Atari 2600 — w jednym pliku `index.html`
(czysty JavaScript + Canvas, bez zależności). Otwórz `index.html` w przeglądarce i graj.

## Sterowanie

| Klawisz | Akcja |
| --- | --- |
| ← → / A D | skręt |
| ↑ / W | przyspieszenie |
| ↓ / S | zwolnienie |
| Spacja / X | strzał |
| P | pauza |
| M | dźwięk wł./wył. |

Na telefonie pod ekranem pojawiają się przyciski dotykowe (dotknięcie paska HUD = pauza).

## Zasady

- Leć w górę rzeki — dotknięcie brzegu, wyspy lub wroga to utrata samolotu.
- Paliwo stale ubywa. Przelatuj nad zbiornikami **FUEL**, żeby zatankować (albo zestrzel je za punkty).
- Zniszczenie mostu to punkt kontrolny — po utracie samolotu zaczynasz od ostatniego zniszczonego mostu.
- Każdy odcinek rzeki jest zawsze taki sam (generowany z ziarna), a kolejne są trudniejsze.
- Dodatkowy samolot co 10 000 punktów.

| Cel | Punkty |
| --- | --- |
| Statek | 30 |
| Helikopter | 60 |
| Zbiornik paliwa | 80 |
| Odrzutowiec | 100 |
| Most | 500 |
