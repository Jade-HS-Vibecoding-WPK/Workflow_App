#!/usr/bin/env python3
# ============================================================
# Erzeugt das Poster "Workflow" als SVG im Format der Vorlage
# (Poster-Vorlage A0, Variante 1): A0 hochkant 841 x 1189 mm,
# 1 SVG-Einheit = 1 mm. Positionen, Schriftgrößen, Farben und Schriften
# (Times New Roman Bold, Myriad Pro, Arial Bold/Italic) sind aus der
# Vorlage übernommen. Die SVG-Datei öffnet sich direkt in Illustrator,
# Texte bleiben bearbeitbar.
#   python3 erzeuge_poster.py  →  Workflow-Poster-A0.svg
# ============================================================
import base64, html, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "Workflow-Poster-A0.svg")

# ---------- Farben aus der Vorlage ----------
DARK = "#43454B"      # Text
RED = "#9D1A1B"       # Dunkelrot (Kopfzeile, Hervorhebungen)
CORAL = "#FF4D3E"     # Akzent (Nummern, Linien)
GREY = "#909195"      # Fußzeile
PANEL = "#F3F3F5"     # Hintergrund der Bildflächen

# ---------- Schriften aus der Vorlage ----------
TIMES = "'Times New Roman', TimesNewRomanPS-BoldMT, Times, serif"
MYRIAD = "'Myriad Pro', MyriadPro-Regular, Arial, sans-serif"
ARIAL = "Arial, ArialMT, Helvetica, sans-serif"

# ---------- Textbreite schätzen (Arial-Laufweiten, pro 1000 Einheiten) ----------
W = {" ": 278, "a": 556, "b": 556, "c": 500, "d": 556, "e": 556, "f": 278, "g": 556, "h": 556, "i": 222, "j": 222, "k": 500,
     "l": 222, "m": 833, "n": 556, "o": 556, "p": 556, "q": 556, "r": 333, "s": 500, "t": 278, "u": 556, "v": 500, "w": 722,
     "x": 500, "y": 500, "z": 500, "A": 667, "B": 667, "C": 722, "D": 722, "E": 667, "F": 611, "G": 778, "H": 722, "I": 278,
     "J": 500, "K": 667, "L": 556, "M": 833, "N": 722, "O": 778, "P": 667, "Q": 778, "R": 722, "S": 667, "T": 611, "U": 722,
     "V": 667, "W": 944, "X": 667, "Y": 667, "Z": 611, ".": 278, ",": 278, ":": 278, ";": 278, "-": 333, "–": 556, "—": 1000,
     "(": 333, ")": 333, "/": 278, "„": 333, "“": 333, '"': 355, "'": 191, "!": 278, "?": 556, "%": 889, "&": 667, "+": 584,
     "=": 584, "→": 1000, "·": 278, "✓": 750, "ä": 556, "ö": 556, "ü": 556, "ß": 611, "Ä": 667, "Ö": 778, "Ü": 722, "°": 400,
     "Ø": 778, "≥": 584, "[": 278, "]": 278, "×": 584}
for d in "0123456789":
    W[d] = 556


def width(text, size, factor=1.0):
    return sum(W.get(ch, 556) for ch in text) / 1000 * size * factor


FACT = {"myriad": 1.0, "myriad-b": 1.06, "arial": 1.0, "arial-b": 1.06, "times-b": 0.98}
FONTS = {"myriad": (MYRIAD, "normal", "normal"), "myriad-b": (MYRIAD, "bold", "normal"), "arial": (ARIAL, "normal", "normal"),
         "arial-b": (ARIAL, "bold", "normal"), "arial-i": (ARIAL, "normal", "italic"), "times-b": (TIMES, "bold", "normal")}

esc = html.escape
parts = []


def text(x, y, segs, size, anchor="start"):
    """Eine Zeile aus Abschnitten [(text, font, farbe, extra)]"""
    spans = []
    for s in segs:
        t, f, col = s[0], s[1], s[2]
        extra = s[3] if len(s) > 3 else ""
        fam, wt, st = FONTS[f]
        spans.append(f'<tspan font-family="{fam}" font-weight="{wt}" font-style="{st}" fill="{col}"{extra}>{esc(t)}</tspan>')
    parts.append(f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size}" text-anchor="{anchor}" xml:space="preserve">{"".join(spans)}</text>')


def wrap(segs, size, maxw):
    """Abschnitte wortweise auf Zeilen verteilen (Breite in mm)."""
    words = []
    for s in segs:
        t, f, col = s[0], s[1], s[2]
        extra = s[3] if len(s) > 3 else ""
        for i, w in enumerate(t.split(" ")):
            words.append((w, f, col, extra, i > 0 or (words and t.startswith(" "))))
    lines, cur, curw = [], [], 0.0
    for w, f, col, extra, _ in words:
        if w == "":
            continue
        ww = width(w, size, FACT.get(f, 1.0))
        sp = width(" ", size, FACT.get(f, 1.0)) if cur else 0
        if cur and curw + sp + ww > maxw:
            lines.append(cur)
            cur, curw = [], 0.0
            sp = 0
        cur.append((("" if not cur else " ") + w, f, col, extra))
        curw += sp + ww
    if cur:
        lines.append(cur)
    # gleiche Stile zusammenfassen
    out = []
    for ln in lines:
        merged = []
        for t, f, col, extra in ln:
            if merged and merged[-1][1] == f and merged[-1][2] == col and merged[-1][3] == extra:
                merged[-1] = (merged[-1][0] + t, f, col, extra)
            else:
                merged.append((t, f, col, extra))
        out.append(merged)
    return out


def paragraphs(x, y, paras, size, maxw, line=13.1, para=15.2):
    """Mehrere Absätze untereinander; liefert die letzte Grundlinie."""
    for k, segs in enumerate(paras):
        for j, ln in enumerate(wrap(segs, size, maxw)):
            text(x, y, ln, size)
            y += line
        y += para - line
    return y - para


def rect(x, y, w, h, fill="none", stroke="none", sw=0, rx=0, extra=""):
    parts.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{extra}/>')


def image(path, x, y, w, h, rx=0, border=True, cid=None):
    with open(path, "rb") as fh:
        data = base64.b64encode(fh.read()).decode()
    mime = "image/png" if path.endswith(".png") else "image/jpeg"
    clip = ""
    if rx and cid:
        parts.append(f'<clipPath id="{cid}"><rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" rx="{rx}"/></clipPath>')
        clip = f' clip-path="url(#{cid})"'
    parts.append(f'<image x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" preserveAspectRatio="xMidYMid slice"{clip} xlink:href="data:{mime};base64,{data}"/>')
    if border:
        rect(x, y, w, h, stroke="#C9CAD0", sw=0.5, rx=rx)


R = lambda t: (t, "myriad", DARK)           # normaler Text
B = lambda t: (t, "myriad-b", DARK)         # fett
H = lambda t: (t, "myriad", RED)            # Hervorhebung dunkelrot

# ============================================================
# Kopf (Positionen wie Vorlage)
# ============================================================
rect(0, 0, 841, 1189, fill="#FFFFFF")
text(40, 47.1, [("Vibecoding KI-Werkstatt · Jade Hochschule Fachbereich Architektur · Blockwoche 16.–20.11.2026", "arial-b", RED)], 9.9)
text(40, 113.4, [("Workflow", "times-b", DARK)], 70.6)
sub = [("Ein Tool, das ", "arial-b", DARK), ("Zeit plant", "arial-b", RED), (" für ", "arial-b", DARK), ("Uni & Baustelle", "arial-b", RED),
       (", weil ", "arial-b", DARK), ("Fristen zählen", "arial-b", RED), (".", "arial-b", DARK)]
sw = sum(width(s[0], 21.2, FACT["arial-b"]) for s in sub)
print(f"Unterzeile: {sw:.0f} mm von 761 mm")
text(40, 161.2, sub, 21.2)
text(40, 178.8, [("Von Niklas Bromund, ", "myriad", DARK), ("[Matrikelnummer]", "myriad", RED)], 11.3)
image(os.path.join(HERE, "bilder", "logo-vorlage.png"), 630.2, 40.0, 175.0, 87.2, border=False)

# ============================================================
# Hauptbild: fünf Handy-Ansichten
# ============================================================
rect(40.5, 207.5, 761.5, 262.5, fill=PANEL)
shots = [("1-heute.jpg", "Heute – Vorschläge in freier Zeit"), ("2-woche.jpg", "Woche – Stundenplan"),
         ("3-ziel.jpg", "Ziel – Einschätzung (CPM)"), ("4-din-kaestchen.jpg", "Vorgang nach DIN 69900"),
         ("5-baustelle.jpg", "Baustelle – Netzplan & Werkzeuge")]
ih = 226.0
iw = ih * 750 / 1624
gap = (761.5 - 5 * iw) / 6
for i, (f, cap) in enumerate(shots):
    x = 40.5 + gap + i * (iw + gap)
    image(os.path.join(HERE, "bilder", f), x, 216.0, iw, ih, rx=7, cid=f"clip{i}")
    text(x + iw / 2, 455.5, [(cap, "myriad", DARK)], 8.5, anchor="middle")

# ============================================================
# Freie Fläche für Darstellungen: So plant Workflow
# ============================================================
rect(40.5, 484.5, 567.5, 129.5, fill=PANEL)
text(52, 501, [("So plant Workflow", "times-b", DARK)], 15.5)
steps = [("Termine", "Uni, Job, Schlafen, Sperrzeiten: diese Zeit ist belegt."),
         ("Freie Zeit", "Arbeitsfenster minus Termine, Puffer und Feiertage."),
         ("Kritischer Pfad", "Rechnung ab der Deadline. Ab 80 % Auslastung: kritisch."),
         ("Vorschläge", "Gestrichelt in freie Lücken, mit Pausen, gleichmäßig verteilt."),
         ("Abarbeiten", "Übernehmen, abhaken – die App plant automatisch neu.")]
cw, chh, cy, cx0, cgap = 100, 78, 512, 52, 12
for i, (t, d) in enumerate(steps):
    x = cx0 + i * (cw + cgap)
    rect(x, cy, cw, chh, fill="#FFFFFF", stroke=CORAL, sw=0.7, rx=3)
    parts.append(f'<circle cx="{x + 11:.2f}" cy="{cy + 12:.2f}" r="6" fill="{CORAL}"/>')
    text(x + 11, cy + 15.2, [(str(i + 1), "arial-b", "#FFFFFF")], 8.5, anchor="middle")
    text(x + 21, cy + 15, [(t, "arial-b", DARK)], 8.5)
    last = paragraphs(x + 6, cy + 30, [[R(d)]], 8.2, cw - 12, line=10.2, para=10.2)
    if last > cy + chh - 4: print(f"Schritt {i + 1}: ⚠ ZU LANG")
    if i < len(steps) - 1:
        ax = x + cw + 2.5
        parts.append(f'<path d="M{ax:.2f},{cy + chh / 2 - 4:.2f} L{ax + 7:.2f},{cy + chh / 2:.2f} L{ax:.2f},{cy + chh / 2 + 4:.2f} Z" fill="{CORAL}"/>')
text(52, 605, [("Baustelle: ", "myriad-b", DARK), ("dieselbe Logik nach DIN 69900 – Dauern in Arbeitstagen, Wartezeiten (z. B. Estrich trocknen) in Kalendertagen.", "myriad", DARK)], 8.5)

# ============================================================
# Freie Fläche: Vorgangsknoten nach DIN 69900
# ============================================================
rect(622.5, 484.5, 179.5, 129.5, fill=PANEL)
text(634, 501, [("Vorgangsknoten", "times-b", DARK)], 15.5)
bx, by, bw = 634, 509, 156
c3 = bw / 3
rect(bx, by, bw, 70, fill="#FFFFFF", stroke=CORAL, sw=1.0, rx=2)
for yy in (by + 21, by + 49):
    parts.append(f'<line x1="{bx}" y1="{yy}" x2="{bx + bw}" y2="{yy}" stroke="{CORAL}" stroke-width="0.6"/>')
for k in (1, 2):
    for (y1, y2) in ((by, by + 21), (by + 49, by + 70)):
        parts.append(f'<line x1="{bx + k * c3:.2f}" y1="{y1}" x2="{bx + k * c3:.2f}" y2="{y2}" stroke="{CORAL}" stroke-width="0.6"/>')
rect(bx + 0.5, by + 21.3, bw - 1, 27.4, fill="#FFE9E6")
cells_top = [("FAZ", "Do 4.3."), ("Dauer", "3 AT"), ("FEZ", "Mo 8.3.")]
cells_bot = [("SAZ", "Do 29.4."), ("GP", "38 AT"), ("SEZ", "Mo 3.5.")]
for k, (lab, val) in enumerate(cells_top):
    cx = bx + c3 * k + c3 / 2
    text(cx, by + 7.5, [(lab, "arial", GREY)], 5.5, anchor="middle")
    text(cx, by + 16.5, [(val, "arial-b", DARK)], 7.5, anchor="middle")
for k, (lab, val) in enumerate(cells_bot):
    cx = bx + c3 * k + c3 / 2
    text(cx, by + 56.5, [(lab, "arial", GREY)], 5.5, anchor="middle")
    text(cx, by + 65.5, [(val, "arial-b", DARK)], 7.5, anchor="middle")
text(bx + bw / 2, by + 29.5, [("Nr. 19 · Estricharbeiten (DIN 18353)", "arial", GREY)], 5.5, anchor="middle")
text(bx + bw / 2, by + 39, [("Estrich", "arial-b", DARK)], 9, anchor="middle")
text(bx + bw / 2, by + 46.5, [("kritischer Weg", "arial-b", CORAL)], 6.5, anchor="middle")
paragraphs(634, 588, [[R("Kritischer Weg = kleinste Gesamtpufferzeit (GP). Puffer in Arbeitstagen (AT).")]], 8.2, 158, line=10.2, para=10.2)

# ============================================================
# Trennlinie und Kästen 01–08 (Raster wie Vorlage)
# ============================================================
rect(40, 642, 760.5, 5.5, fill=CORAL)
COLS = [40, 234, 428, 622]
BOXW = 178.5


def box(i, row, num, title, paras, checks=None):
    x = COLS[i]
    top = 664 if row == 0 else 784
    rect(x, top, BOXW, 1.0, fill=CORAL)
    ty = 678.8 if row == 0 else 798.8
    text(x, ty, [(num + " ", "times-b", CORAL), (title, "times-b", DARK)], 15.5)
    last = paragraphs(x, 699.5 if row == 0 else 819.5, paras, 10.6, BOXW - (14 if checks else 2))
    limit = 774 if row == 0 else 890
    print(f"Kasten {num}: letzte Zeile {last:.0f} (Grenze {limit})" + ("  ⚠ ZU LANG" if last > limit else ""))
    if checks:
        y = 699.5
        for done in checks:
            rect(x + BOXW - 6.5, y - 5.2, 5.2, 5.2, fill="#FFFFFF", stroke=CORAL, sw=0.6)
            if done:
                parts.append(f'<path d="M{x + BOXW - 5.4:.2f},{y - 2.6:.2f} l1.6,1.7 l3,-3.6" fill="none" stroke="{CORAL}" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>')
            y += 15.2


box(0, 0, "01", "Das Problem", [
    [B("Wer?"), R(" Studierende und Bauleitende.")],
    [B("Was nervt?"), R(" Aufgaben gehen zwischen Terminen unter.")],
    [B("Bisher:"), R(" Kalender, Zettel, Excel – ohne Blick auf die freie Zeit.")]])
box(1, 0, "02", "Unsere Lösung", [
    [R("Plant Aufgaben als "), B("Vorschläge"), R(" in freie Lücken, nach kritischem Pfad.")],
    [B("Nutzen:"), R(" früh sehen, ob die Zeit reicht.")],
    [B("Besonders:"), R(" Baustelle nach DIN 69900.")]])
box(2, 0, "03", "So geht’s", [
    [R("1. Termine eintragen.")],
    [R("2. Aufgaben und Ziele anlegen.")],
    [R("3. Vorschläge übernehmen – fertig.")],
    [B("Läuft als"), R(" Web-App (PWA), offline.")]])
box(3, 0, "04", "Unser MVP", [
    [B("Must:"), R(" Termine, Aufgaben, Ziele")],
    [B("Should:"), R(" Vorschläge, Feiertage")],
    [B("Could:"), R(" Netzplan, Baustelle")],
    [B("Später:"), R(" "), ("Login & Abgleich", "myriad", DARK, ' text-decoration="line-through"')]], checks=[True, True, True, False])
box(0, 1, "05", "Daten & APIs", [
    [B("Feiertage:"), R(" Nager.Date (frei)")],
    [B("Wetter:"), R(" Open-Meteo (CC BY 4.0) für Frost-Warnungen")],
    [B("API-Key?"), R(" Nein – Daten bleiben auf dem Gerät.")]])
box(1, 1, "06", "Gestaltung", [
    [B("Entscheidung:"), R(" klare Listen und Raster wie im Handy-Kalender.")],
    [B("Gestrichelt"), R(" = Vorschlag, "), B("fest"), R(" = geplant.")],
    [R("Stil-Prompt: "), H("„Handy zuerst, ruhig“")]])
box(2, 1, "07", "Hindernisse", [
    [R("Die KI hing fest bei "), B("Arbeits- vs. Kalendertagen"), R(" im kritischen Weg.")],
    [R("Raus durch "), B("Handrechnung"), R(" nach DIN 69900 und Git-Sicherungspunkte.")]])
box(3, 1, "08", "Bester Prompt", [
    [H("„Teste nochmal: Was nervt, was geht besser, was wäre nützlich?“")],
    [B("Warum gut:"), R(" Die KI testet wie eine Nutzerin – ich entscheide.")]])

# ============================================================
# Reflexion (Feld der Vorlage)
# ============================================================
rect(40, 904, 4.5, 147.5, fill=CORAL)
text(56, 915.6, [("Welchen Teil machen wir und was übernimmt die KI?", "times-b", DARK)], 19)
text(56, 929.7, [("Was passiert dabei mit uns als Planenden?", "arial-i", RED)], 11.3)
_r = paragraphs(56, 950, [
    [B("Ich entscheide:"), R(" was die App können soll, welche Regeln gelten, wann etwas gut genug ist – und ich teste auf dem Handy. "),
     B("Die KI"), R(" schreibt den Code, rechnet nach, testet und erklärt jeden Schritt.")],
    [B("Für uns als Planende"), R(" heißt das: weniger selbst zeichnen und tippen, mehr genau beschreiben, entscheiden und prüfen. "
      "Das Fachwissen bleibt bei uns – ob ein Netzplan nach DIN 69900 stimmt, muss ich selbst nachrechnen können.")]],
    12, 735, line=14.5, para=19)
print("Reflexion endet bei", round(_r), "(Grenze 1046)")

# ============================================================
# Fußbereich: QR-Code, Ausprobieren, Quellen
# ============================================================
QR = ["111111100110111100110111001111111", "100000100011011111001011101000001", "101110100101110011110001001011101",
      "101110100001011110011010001011101", "101110100110101001100101001011101", "100000101011001111111100001000001",
      "111111101010101010101010101111111", "000000000010001111100110000000000", "100101101010010000000101110100000",
      "011010001100110010001110011100001", "001000100010111011010110010110101", "000101001011010010110100101011001",
      "111001100010001010100100011001000", "001101000111101101011110101010011", "010011111100010111001111011001110",
      "011111001010110011010110101010010", "111100100111110111011101101010010", "011100001011011011000001110101010",
      "010111110111101001001000110000111", "010111010111000100010111111100011", "001101110110000101000101100000010",
      "010000000001001100011000111101111", "111100111110001010110010010010101", "011111011011110100100111110101010",
      "100001100101010011011100111111011", "000000001001110011011001100011001", "111111100010101001101100101011110",
      "100000101100001011110110100010011", "101110100100011000100110111111000", "101110101110000111110111001011000",
      "101110100100110111000100100011101", "100000100001111001011110011000000", "111111101100100110000100111011010"]
qx, qy, qs = 40, 1069.5, 68
rect(qx, qy, qs, qs, fill="#FFFFFF")
m = (qs - 6) / len(QR)
d = []
for r, row in enumerate(QR):
    for c, v in enumerate(row):
        if v == "1":
            d.append(f"M{qx + 3 + c * m:.3f},{qy + 3 + r * m:.3f}h{m:.3f}v{m:.3f}h-{m:.3f}z")
parts.append(f'<path d="{"".join(d)}" fill="#000000"/>')

text(124, 1077.1, [("Ausprobieren", "arial-b", RED)], 9.9)
for k, line in enumerate(["jade-hs-vibecoding-wpk.github.io/Workflow_App",
                          "Code: github.com/Jade-HS-Vibecoding-WPK/Workflow_App",
                          "Tipp: Menü „Beispiel ansehen“ zeigt erfundene Demo-Daten.",
                          "Läuft im Browser, auf dem Handy installierbar (PWA)."]):
    text(124, 1089.8 + k * 11.65, [(line, "myriad", DARK)], 9.2)
text(428, 1077.1, [("Quellen & KI-Nutzung", "arial-b", RED)], 9.9)
for k, line in enumerate(["Daten: Nager.Date (Feiertage) · Open-Meteo (Wetter, CC BY 4.0)",
                          "Bilder: eigene Screenshots der App, Beispieldaten erfunden",
                          "KI: Claude Code (Anthropic), Claude Opus 5.5 – Code, Tests, Erklärungen, 16.–20.11.2026",
                          "Normen: DIN 69900 (Netzplantechnik), VOB/C – als Orientierung"]):
    text(428, 1089.8 + k * 11.65, [(line, "myriad", DARK)], 9.2)

text(40, 1152.1, [("WPK Vibecoding KI-Werkstatt · Jade Hochschule · ", "myriad", GREY), ("Dozierende:", "arial-b", GREY),
                  (" Yara Hirsekorn, Nik Ansre, Gregor Grunwald, Radostina Radulova-Stahmer", "myriad", GREY)], 8.5)

svg = ('<?xml version="1.0" encoding="UTF-8"?>\n'
       '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
       'width="841mm" height="1189mm" viewBox="0 0 841 1189">\n'
       '<title>Workflow – Poster A0</title>\n' + "\n".join(parts) + "\n</svg>\n")
with open(OUT, "w", encoding="utf-8") as fh:
    fh.write(svg)
print("geschrieben:", OUT, f"({len(svg) / 1e6:.1f} MB)")
