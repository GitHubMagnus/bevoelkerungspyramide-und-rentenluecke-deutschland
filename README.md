# Bevölkerungspyramide und Rentenlücke Deutschland

Interaktive Visualisierung der Bevölkerungsentwicklung Deutschlands auf Basis der
**16. koordinierten Bevölkerungsvorausberechnung** des Statistischen Bundesamts,
erweitert um eine **Modellrechnung zur Rentenlücke** und zum Verhältnis
**Beitragszahler je Rentner** für jedes Jahr und jedes Szenario.

**Live ansehen:** https://githubmagnus.github.io/bevoelkerungspyramide-und-rentenluecke-deutschland/

**Als Excel:** [bevoelkerungspyramide.xlsx herunterladen](https://github.com/GitHubMagnus/bevoelkerungspyramide-und-rentenluecke-deutschland/raw/main/bevoelkerungspyramide.xlsx) – dasselbe Dashboard als interaktive Arbeitsmappe, siehe [Excel-Version](#excel-version).

## Funktionen

- **Bevölkerungspyramide** (Alter 0-99, Männer/Frauen) für jedes Jahr von 1950 bis 2070,
  mit Animation, Tooltip je Altersjahr und Umriss eines frei wählbaren Vergleichsjahres
- **30 amtliche Szenarien**: Ist-Daten bis 2024, ab 2025 die Varianten 1-27 und
  Modellrechnungen 1-2 der 16. kBVB (Kombinationen aus Geburtenrate G,
  Lebenserwartung L und Wanderungssaldo W)
- **Verschiebbare Altersgrenzen** (Erwerbseintritt / Renteneintritt) direkt in der
  Grafik. Sie steuern zugleich das Rentenmodell ("Was wäre bei Rente mit 70?")
- **Rentenlücke je Jahr und Szenario**: historische Ist-Werte 1960-2024 und
  demografische Projektion bis 2070, inklusive rechnerisch nötigem Beitragssatz
- **Beitragszahler je Rentner**: historische DRV-Reihe ab 1957, Projektion bis
  2070, Piktogramm-Darstellung und Vergleich mit der offiziellen DRV-Schätzung bis 2045
- Zustand in der URL teilbar, z. B. `#!y=2051&a=20,67&v=28`
  (kompatibel zum Format der [Destatis-Pyramide](https://service.destatis.de/bevoelkerungspyramide/))

## Excel-Version

[`bevoelkerungspyramide.xlsx`](bevoelkerungspyramide.xlsx) enthält das komplette Dashboard
als eigenständige Excel-Arbeitsmappe – gleiche Daten, gleiches Rentenmodell, offline nutzbar
und ohne Makros (reine Formeln plus Formularsteuerelemente).

- **Blatt "Dashboard":** Jahr per Schieberegler oder Direkteingabe, Szenario-Dropdown,
  Altersgrenzen als Eingabefelder, Vergleichsjahr mit An/Aus-Checkbox. Die Pyramide zeigt
  Erwerbs- und Renteneintritt als Linien im Chart, dazu KPI-Kacheln (Bevölkerung,
  Beitragszahler je Rentner, Rentenlücke, nötiger Beitragssatz), eine
  Piktogramm-Darstellung "Wer trägt die Rente?" und beide Zeitreihen-Charts
- **Blatt "Methodik":** Kurzfassung des Modells inklusive Quellen
- **Blätter "Daten_Bevoelkerung", "Daten_Renten", "Varianten", "Berechnung":** alle
  Rohdaten und sämtliche Formeln offen einsehbar – das Modell lässt sich Zelle für
  Zelle nachvollziehen

Gegenüber der Web-Version fehlen nur die Abspiel-Animation und die Tooltips je Altersjahr.
Erstellt aus denselben Quelldaten (`data/population.json`, `data/renten.json`).

## Berechnung der Rentenlücke

**Definition:** Rentenlücke = Gesamtausgaben minus Beitragseinnahmen der allgemeinen
Rentenversicherung. Diese Finanzierungslücke wird in der Realität überwiegend durch
Bundeszuschüsse aus Steuermitteln gedeckt (2024: 87,8 Mrd. Euro Zuschüsse bei
92,0 Mrd. Euro Lücke).

**Vergangenheit (1960-2024):** amtliche Ist-Werte aus den Rechnungsergebnissen der
Deutschen Rentenversicherung (nominal; bis 1990 alte Bundesländer, 1960-1990
fünfjährlich, ab 1991 jährlich).

**Zukunft (2025-2070):** reines Demografie-Modell in Preisen von 2024, kalibriert am
Ist-Jahr 2024:

| Größe | Wert 2024 | Quelle |
|---|---|---|
| Standardbeitragszahler | 34,86 Mio. | DRV Zeitreihen 2025, S. 254 |
| Standardrentner | 16,58 Mio. | DRV Zeitreihen 2025, S. 254 |
| Beitragseinnahmen | 305,3 Mrd. Euro | DRV Zeitreihen 2025, S. 244 |
| Gesamtausgaben | 397,4 Mrd. Euro | DRV Zeitreihen 2025, S. 245 |

Daraus: Beitragszahlerquote β ≈ 0,68 (Anteil der 20- bis 66-Jährigen, der effektiv
Beiträge zahlt), Rentnerquote ρ ≈ 0,99 (Standardrentner je Person ab 67),
Beitrag je Zahler ≈ 8 760 Euro/Jahr, Ausgabe je Rentner ≈ 23 970 Euro/Jahr.

```
Beitragszahler(t) = β · Bevölkerung[Erwerbseintritt bis Renteneintritt-1](t)
Rentner(t)        = ρ · Bevölkerung[ab Renteneintritt](t)
Lücke(t)          = Rentner(t) · 23 970 € - Beitragszahler(t) · 8 760 €
Nötiger Satz(t)   = 18,6 % · Ausgaben(t) / Beiträge(t)
```

Löhne, Beitragssatz (18,6 %) und Rentenniveau bleiben konstant. Das Modell isoliert
damit den **reinen Effekt des Altersaufbaus** des gewählten Szenarios. Nicht abgebildet
sind Renten- und Lohnanpassungen, Änderungen der Erwerbsquoten, die Knappschaft sowie
Beamte und Selbstständige. Zum Realitätsvergleich zeigt der untere Chart die offizielle
DRV-Schätzung des Rentnerquotienten bis 2045 (Rauten).

## Datenquellen

| Datensatz | Quelle |
|---|---|
| Bevölkerung 1950-2070 (Alter 0-99, m/w, 30 Varianten) | Statistisches Bundesamt (Destatis): [16. koordinierte Bevölkerungsvorausberechnung, Annahmen und Ergebnisse](https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsvorausberechnung/annahmen_ergebnisse_16te_kBv.html); Datendownload direkt von der [interaktiven Bevölkerungspyramide](https://service.destatis.de/bevoelkerungspyramide/), Originaldatei [16_bevoelkerungsvorausberechnung_daten_2025-11-26.csv](https://service.destatis.de/bevoelkerungspyramide/data/16_bevoelkerungsvorausberechnung_daten_2025-11-26.csv) (Stand 26.11.2025) |
| Beitragseinnahmen, Ausgaben, Bundeszuschüsse 1960-2024 | [DRV Bund (2025): Rentenversicherung in Zeitreihen](https://www.deutsche-rentenversicherung.de/SharedDocs/Downloads/DE/Statistiken-und-Berichte/statistikpublikationen/rv_in_zeitreihen.pdf), S. 243-245 |
| Beitragszahler je Rentner 1957-2024 ("vereinfachter Rentnerquotient") | ebd., S. 254 |
| Anteil der Bundeszuschüsse an den RV-Ausgaben 2024, zur Einordnung (nicht direkt in die Modellrechnung eingeflossen) | Sozialpolitik-aktuell.de (IAQ, Universität Duisburg-Essen): [Abb. VIII.35, Bundesmittel an die GRV 2024](https://www.sozialpolitik-aktuell.de/files/sozialpolitik-aktuell/_Politikfelder/Alter-Rente/Datensammlung/PDF-Dateien/abbVIII35.pdf) und [Abb. VIII.34, Anteil der Bundeszuschüsse 1960-2024](https://www.sozialpolitik-aktuell.de/files/sozialpolitik-aktuell/_Politikfelder/Alter-Rente/Datensammlung/PDF-Dateien/abbVIII34.pdf) |
| Deutsche Bezeichnungen und Beschreibungen der Szenarien 1-29 (Dropdown "Szenario ab 2025") | wörtlich übernommen aus dem Quellcode der [interaktiven Bevölkerungspyramide](https://service.destatis.de/bevoelkerungspyramide/) (Destatis), Datei `js/16te_main_2026-03-11.js` |

`data/population.json` wurde aus der Original-Exceldatei
[`data/quelle/16_bevoelkerungsvorausberechnung_daten.xlsx`](data/quelle/16_bevoelkerungsvorausberechnung_daten.xlsx)
konvertiert. Diese Datei liegt unverändert in diesem Repository und wurde vom
Nutzer aus dem oben verlinkten Destatis-Datendownload bezogen (inhaltsgleich mit
der offiziellen CSV-Datei, nur im Excel-Format). Spalten: `Variante`
(0 = Ist-Daten, 1-29 = Szenarien), `Simulationsjahr`, `mw`, `Bev_0_1` bis
`Bev_99_100` (Werte in Tsd.).

## Lokal starten

Beliebigen statischen Server im Projektordner starten, z. B.:

```bash
npx http-server . -p 8123
```

(Direktes Öffnen der `index.html` per Doppelklick funktioniert nicht, da die
Daten per `fetch` geladen werden.)

## Lizenz / Nachnutzung

Eigener Code: MIT. Datengrundlagen: © Statistisches Bundesamt (Destatis) und
Deutsche Rentenversicherung Bund, Nachnutzung gemäß
[Datenlizenz Deutschland - Namensnennung - 2.0](https://www.govdata.de/dl-de/by-2-0).
Die Rentenlücken-Projektion ab 2025 ist eine **eigene, vereinfachte Modellrechnung**
und keine amtliche Statistik.
