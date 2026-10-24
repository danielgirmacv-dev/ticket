#!/usr/bin/env python3
"""
Customizes Pandoc's reference.docx for EEC eSupport technical documentation.
Applies Arial typography and a restrained corporate dark navy and blue palette.
"""

import io
import shutil
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DOCX_PATH = ROOT / "reference.docx"

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

ET.register_namespace("w", W)
ET.register_namespace("a", A)
ET.register_namespace("r", R)

def qn(tag: str) -> str:
    return f"{{{W}}}{tag}"

def update_font_table(xml_bytes: bytes) -> bytes:
    root = ET.fromstring(xml_bytes)
    # Check if Arial already exists
    has_arial = False
    for font in root.findall(f".//{qn('font')}"):
        if font.attrib.get(qn("name")) == "Arial":
            has_arial = True
            break

    if not has_arial:
        new_font = ET.SubElement(root, qn("font"))
        new_font.set(qn("name"), "Arial")
        panose = ET.SubElement(new_font, qn("panose1"))
        panose.set(qn("val"), "020B0604020202020204")
        charset = ET.SubElement(new_font, qn("charset"))
        charset.set(qn("val"), "00")
        family = ET.SubElement(new_font, qn("family"))
        family.set(qn("val"), "swiss")
        pitch = ET.SubElement(new_font, qn("pitch"))
        pitch.set(qn("val"), "variable")

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)

def update_theme(xml_bytes: bytes) -> bytes:
    root = ET.fromstring(xml_bytes)
    
    # 1. Update fontScheme to Arial
    for scheme in root.iter(f"{{{A}}}fontScheme"):
        for major in scheme.findall(f"{{{A}}}majorFont"):
            for latin in major.findall(f"{{{A}}}latin"):
                latin.set("typeface", "Arial")
        for minor in scheme.findall(f"{{{A}}}minorFont"):
            for latin in minor.findall(f"{{{A}}}latin"):
                latin.set("typeface", "Arial")

    # 2. Update clrScheme to Corporate Navy / Blue
    palette = {
        "dk2": "0F2C59",      # Deep Navy
        "accent1": "0F2C59",  # Corporate Navy
        "accent2": "1E3A8A",  # Dark Blue
        "accent3": "2563EB",  # Steel / Accent Blue
        "accent4": "334155",  # Slate
        "accent5": "475569",  # Muted Dark Slate
        "accent6": "64748B",  # Slate Gray
        "hlink": "1D4ED8",    # Hyperlink Blue
    }
    for scheme in root.iter(f"{{{A}}}clrScheme"):
        for name, hex_val in palette.items():
            elem = scheme.find(f"{{{A}}}{name}")
            if elem is not None:
                srgb = elem.find(f"{{{A}}}srgbClr")
                if srgb is not None:
                    srgb.set("val", hex_val)

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)

def set_r_fonts(r_pr: ET.Element, font_name: str = "Arial"):
    rf = r_pr.find(qn("rFonts"))
    if rf is None:
        rf = ET.SubElement(r_pr, qn("rFonts"))
    rf.set(qn("ascii"), font_name)
    rf.set(qn("hAnsi"), font_name)
    rf.set(qn("cs"), font_name)

def set_color(r_pr: ET.Element, hex_color: str):
    c = r_pr.find(qn("color"))
    if c is None:
        c = ET.SubElement(r_pr, qn("color"))
    c.set(qn("val"), hex_color)
    # Remove themeColor attribute if present to avoid overriding
    for attr in [qn("themeColor"), qn("themeTint"), qn("themeShade")]:
        if attr in c.attrib:
            del c.attrib[attr]

def set_sz(r_pr: ET.Element, half_pts: int):
    sz = r_pr.find(qn("sz"))
    if sz is None:
        sz = ET.SubElement(r_pr, qn("sz"))
    sz.set(qn("val"), str(half_pts))
    sz_cs = r_pr.find(qn("szCs"))
    if sz_cs is None:
        sz_cs = ET.SubElement(r_pr, qn("szCs"))
    sz_cs.set(qn("val"), str(half_pts))

def set_spacing(p_pr: ET.Element, before: int = 0, after: int = 120, line: int = 276, rule: str = "auto"):
    sp = p_pr.find(qn("spacing"))
    if sp is None:
        sp = ET.SubElement(p_pr, qn("spacing"))
    sp.set(qn("before"), str(before))
    sp.set(qn("after"), str(after))
    if line:
        sp.set(qn("line"), str(line))
        sp.set(qn("lineRule"), rule)

def set_bold(r_pr: ET.Element, enabled: bool = True):
    b = r_pr.find(qn("b"))
    b_cs = r_pr.find(qn("bCs"))
    if enabled:
        if b is None:
            ET.SubElement(r_pr, qn("b"))
        if b_cs is None:
            ET.SubElement(r_pr, qn("bCs"))
    else:
        if b is not None:
            r_pr.remove(b)
        if b_cs is not None:
            r_pr.remove(b_cs)

def set_italic(r_pr: ET.Element, enabled: bool = True):
    i = r_pr.find(qn("i"))
    i_cs = r_pr.find(qn("iCs"))
    if enabled:
        if i is None:
            ET.SubElement(r_pr, qn("i"))
        if i_cs is None:
            ET.SubElement(r_pr, qn("iCs"))
    else:
        if i is not None:
            r_pr.remove(i)
        if i_cs is not None:
            r_pr.remove(i_cs)

def ensure_element(parent: ET.Element, tag_name: str) -> ET.Element:
    el = parent.find(qn(tag_name))
    if el is None:
        el = ET.SubElement(parent, qn(tag_name))
    return el

def update_styles(xml_bytes: bytes) -> bytes:
    root = ET.fromstring(xml_bytes)

    # 1. Update docDefaults
    defaults = root.find(qn("docDefaults"))
    if defaults is not None:
        r_pr_def = defaults.find(f".//{qn('rPrDefault')}/{qn('rPr')}")
        if r_pr_def is not None:
            set_r_fonts(r_pr_def, "Arial")
            set_sz(r_pr_def, 21) # 10.5pt
            set_color(r_pr_def, "1E293B")
        p_pr_def = defaults.find(f".//{qn('pPrDefault')}/{qn('pPr')}")
        if p_pr_def is not None:
            set_spacing(p_pr_def, before=0, after=120, line=276, rule="auto")

    # Map styles by styleId
    styles_by_id = {}
    for st in root.findall(qn("style")):
        sid = st.attrib.get(qn("styleId"))
        if sid:
            styles_by_id[sid] = st

    # --- Title ---
    if "Title" in styles_by_id:
        st = styles_by_id["Title"]
        p_pr = ensure_element(st, "pPr")
        set_spacing(p_pr, before=240, after=140, line=600)
        ensure_element(p_pr, "keepNext")
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_bold(r_pr, True)
        set_color(r_pr, "0F2C59") # Dark Navy
        set_sz(r_pr, 56) # 28pt

    if "TitleChar" in styles_by_id:
        st = styles_by_id["TitleChar"]
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_bold(r_pr, True)
        set_color(r_pr, "0F2C59")
        set_sz(r_pr, 56)

    # --- Subtitle ---
    if "Subtitle" in styles_by_id:
        st = styles_by_id["Subtitle"]
        p_pr = ensure_element(st, "pPr")
        set_spacing(p_pr, before=0, after=240, line=320)
        ensure_element(p_pr, "keepNext")
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_color(r_pr, "475569")
        set_sz(r_pr, 28) # 14pt

    if "SubtitleChar" in styles_by_id:
        st = styles_by_id["SubtitleChar"]
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_color(r_pr, "475569")
        set_sz(r_pr, 28)

    # --- Author ---
    if "Author" in styles_by_id:
        st = styles_by_id["Author"]
        p_pr = ensure_element(st, "pPr")
        set_spacing(p_pr, before=60, after=40)
        ensure_element(p_pr, "keepNext")
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_bold(r_pr, True)
        set_color(r_pr, "1E3A8A")
        set_sz(r_pr, 22) # 11pt

    # --- Date ---
    if "Date" in styles_by_id:
        st = styles_by_id["Date"]
        p_pr = ensure_element(st, "pPr")
        set_spacing(p_pr, before=0, after=320)
        ensure_element(p_pr, "keepNext")
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_color(r_pr, "64748B")
        set_sz(r_pr, 20) # 10pt

    # --- Abstract & Abstract Title ---
    if "AbstractTitle" in styles_by_id:
        st = styles_by_id["AbstractTitle"]
        p_pr = ensure_element(st, "pPr")
        set_spacing(p_pr, before=240, after=80)
        ensure_element(p_pr, "keepNext")
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_bold(r_pr, True)
        set_color(r_pr, "0F2C59")
        set_sz(r_pr, 24) # 12pt

    if "Abstract" in styles_by_id:
        st = styles_by_id["Abstract"]
        p_pr = ensure_element(st, "pPr")
        set_spacing(p_pr, before=0, after=160, line=276)
        ind = ensure_element(p_pr, "ind")
        ind.set(qn("left"), "400")
        ind.set(qn("right"), "400")
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_italic(r_pr, True)
        set_color(r_pr, "334155")
        set_sz(r_pr, 20) # 10pt

    # --- Headings 1 through 6 ---
    heading_specs = [
        # (id, charId, sz, color, before, after, underline_bdr)
        ("Heading1", "Heading1Char", 38, "0F2C59", 360, 120, True),   # 19pt, Deep Navy
        ("Heading2", "Heading2Char", 30, "1E3A8A", 280, 80, False),  # 15pt, Corporate Navy
        ("Heading3", "Heading3Char", 25, "2563EB", 200, 60, False),  # 12.5pt, Steel Blue
        ("Heading4", "Heading4Char", 22, "1E293B", 160, 40, False),  # 11pt, Dark Slate
        ("Heading5", "Heading5Char", 21, "334155", 120, 40, False),  # 10.5pt, Slate
        ("Heading6", "Heading6Char", 20, "475569", 100, 40, False),  # 10pt, Muted Slate
    ]

    for sid, cid, sz, color, before, after, underline in heading_specs:
        if sid in styles_by_id:
            st = styles_by_id[sid]
            p_pr = ensure_element(st, "pPr")
            set_spacing(p_pr, before=before, after=after)
            ensure_element(p_pr, "keepNext")
            if underline:
                pbdr = ensure_element(p_pr, "pBdr")
                bbdr = ensure_element(pbdr, "bottom")
                bbdr.set(qn("val"), "single")
                bbdr.set(qn("sz"), "12") # 1.5pt
                bbdr.set(qn("space"), "6")
                bbdr.set(qn("color"), "0F2C59")
            r_pr = ensure_element(st, "rPr")
            set_r_fonts(r_pr, "Arial")
            set_bold(r_pr, True)
            if sid == "Heading5":
                set_italic(r_pr, True)
            set_color(r_pr, color)
            set_sz(r_pr, sz)

        if cid in styles_by_id:
            st = styles_by_id[cid]
            r_pr = ensure_element(st, "rPr")
            set_r_fonts(r_pr, "Arial")
            set_bold(r_pr, True)
            if sid == "Heading5":
                set_italic(r_pr, True)
            set_color(r_pr, color)
            set_sz(r_pr, sz)

    # --- TOCHeading ---
    if "TOCHeading" in styles_by_id:
        st = styles_by_id["TOCHeading"]
        p_pr = ensure_element(st, "pPr")
        set_spacing(p_pr, before=280, after=120)
        ensure_element(p_pr, "keepNext")
        pbdr = ensure_element(p_pr, "pBdr")
        bbdr = ensure_element(pbdr, "bottom")
        bbdr.set(qn("val"), "single")
        bbdr.set(qn("sz"), "12")
        bbdr.set(qn("space"), "6")
        bbdr.set(qn("color"), "0F2C59")
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_bold(r_pr, True)
        set_color(r_pr, "0F2C59")
        set_sz(r_pr, 38)

    # --- BodyText & FirstParagraph & Normal ---
    for sid in ["Normal", "BodyText", "FirstParagraph"]:
        if sid in styles_by_id:
            st = styles_by_id[sid]
            p_pr = ensure_element(st, "pPr")
            set_spacing(p_pr, before=0, after=120, line=276, rule="auto")
            r_pr = ensure_element(st, "rPr")
            set_r_fonts(r_pr, "Arial")
            set_color(r_pr, "1E293B")
            set_sz(r_pr, 21)

    if "BodyTextChar" in styles_by_id:
        st = styles_by_id["BodyTextChar"]
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_color(r_pr, "1E293B")
        set_sz(r_pr, 21)

    # --- Compact ---
    if "Compact" in styles_by_id:
        st = styles_by_id["Compact"]
        p_pr = ensure_element(st, "pPr")
        set_spacing(p_pr, before=0, after=40, line=240, rule="auto")
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_color(r_pr, "1E293B")
        set_sz(r_pr, 21)

    # --- BlockText (Blockquote) ---
    if "BlockText" in styles_by_id:
        st = styles_by_id["BlockText"]
        p_pr = ensure_element(st, "pPr")
        set_spacing(p_pr, before=120, after=140, line=260)
        ind = ensure_element(p_pr, "ind")
        ind.set(qn("left"), "360")
        ind.set(qn("right"), "180")
        pbdr = ensure_element(p_pr, "pBdr")
        lbdr = ensure_element(pbdr, "left")
        lbdr.set(qn("val"), "single")
        lbdr.set(qn("sz"), "24") # 3pt
        lbdr.set(qn("space"), "12")
        lbdr.set(qn("color"), "1E3A8A") # Navy accent border
        shd = ensure_element(p_pr, "shd")
        shd.set(qn("val"), "clear")
        shd.set(qn("color"), "auto")
        shd.set(qn("fill"), "F8FAFC") # Soft subtle tint
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_italic(r_pr, True)
        set_color(r_pr, "334155")
        set_sz(r_pr, 20)

    # --- Captions (Caption, ImageCaption, TableCaption) ---
    for sid in ["Caption", "ImageCaption", "TableCaption"]:
        if sid in styles_by_id:
            st = styles_by_id[sid]
            p_pr = ensure_element(st, "pPr")
            set_spacing(p_pr, before=80, after=160)
            jc = ensure_element(p_pr, "jc")
            jc.set(qn("val"), "left")
            r_pr = ensure_element(st, "rPr")
            set_r_fonts(r_pr, "Arial")
            set_italic(r_pr, True)
            set_bold(r_pr, True)
            set_color(r_pr, "475569") # Muted Dark Slate
            set_sz(r_pr, 19) # 9.5pt

    # --- Figure & CaptionedFigure ---
    for sid in ["Figure", "CaptionedFigure"]:
        if sid in styles_by_id:
            st = styles_by_id[sid]
            p_pr = ensure_element(st, "pPr")
            set_spacing(p_pr, before=120, after=60)
            jc = ensure_element(p_pr, "jc")
            jc.set(qn("val"), "center")

    # --- Hyperlink ---
    if "Hyperlink" in styles_by_id:
        st = styles_by_id["Hyperlink"]
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_color(r_pr, "1D4ED8") # Corporate Ocean Blue
        u = ensure_element(r_pr, "u")
        u.set(qn("val"), "single")

    # --- Footnotes ---
    for sid in ["FootnoteText", "FootnoteBlockText"]:
        if sid in styles_by_id:
            st = styles_by_id[sid]
            p_pr = ensure_element(st, "pPr")
            set_spacing(p_pr, before=0, after=60)
            r_pr = ensure_element(st, "rPr")
            set_r_fonts(r_pr, "Arial")
            set_color(r_pr, "475569")
            set_sz(r_pr, 18) # 9pt

    if "FootnoteReference" in styles_by_id:
        st = styles_by_id["FootnoteReference"]
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        va = ensure_element(r_pr, "vertAlign")
        va.set(qn("val"), "superscript")

    # --- Definition Term & Definition ---
    if "DefinitionTerm" in styles_by_id:
        st = styles_by_id["DefinitionTerm"]
        p_pr = ensure_element(st, "pPr")
        set_spacing(p_pr, before=140, after=40)
        ensure_element(p_pr, "keepNext")
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_bold(r_pr, True)
        set_color(r_pr, "0F2C59")
        set_sz(r_pr, 21)

    if "Definition" in styles_by_id:
        st = styles_by_id["Definition"]
        p_pr = ensure_element(st, "pPr")
        ind = ensure_element(p_pr, "ind")
        ind.set(qn("left"), "360")
        set_spacing(p_pr, before=0, after=100)
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_color(r_pr, "1E293B")
        set_sz(r_pr, 21)

    # --- VerbatimChar (Code snippet) ---
    if "VerbatimChar" in styles_by_id:
        st = styles_by_id["VerbatimChar"]
        r_pr = ensure_element(st, "rPr")
        rf = ensure_element(r_pr, "rFonts")
        rf.set(qn("ascii"), "Consolas")
        rf.set(qn("hAnsi"), "Consolas")
        set_sz(r_pr, 19) # 9.5pt
        set_color(r_pr, "0F2C59")

    # --- Table Style ---
    if "Table" in styles_by_id:
        st = styles_by_id["Table"]
        tbl_pr = ensure_element(st, "tblPr")
        
        # Indent and margins
        ind = ensure_element(tbl_pr, "tblInd")
        ind.set(qn("w"), "0")
        ind.set(qn("type"), "dxa")
        
        cell_mar = ensure_element(tbl_pr, "tblCellMar")
        top_m = ensure_element(cell_mar, "top")
        top_m.set(qn("w"), "120") # 6pt
        top_m.set(qn("type"), "dxa")
        bot_m = ensure_element(cell_mar, "bottom")
        bot_m.set(qn("w"), "120") # 6pt
        bot_m.set(qn("type"), "dxa")
        left_m = ensure_element(cell_mar, "left")
        left_m.set(qn("w"), "160") # 8pt
        left_m.set(qn("type"), "dxa")
        right_m = ensure_element(cell_mar, "right")
        right_m.set(qn("w"), "160") # 8pt
        right_m.set(qn("type"), "dxa")

        # Table borders: Navy top/bottom, subtle horizontal dividers, no vertical borders
        tbl_borders = ensure_element(tbl_pr, "tblBorders")
        t_bdr = ensure_element(tbl_borders, "top")
        t_bdr.set(qn("val"), "single")
        t_bdr.set(qn("sz"), "12") # 1.5pt
        t_bdr.set(qn("space"), "0")
        t_bdr.set(qn("color"), "0F2C59") # Dark Navy

        b_bdr = ensure_element(tbl_borders, "bottom")
        b_bdr.set(qn("val"), "single")
        b_bdr.set(qn("sz"), "12")
        b_bdr.set(qn("space"), "0")
        b_bdr.set(qn("color"), "0F2C59")

        ih_bdr = ensure_element(tbl_borders, "insideH")
        ih_bdr.set(qn("val"), "single")
        ih_bdr.set(qn("sz"), "4") # 0.5pt
        ih_bdr.set(qn("space"), "0")
        ih_bdr.set(qn("color"), "CBD5E1") # Light Slate divider

        for side in ["left", "right", "insideV"]:
            side_bdr = ensure_element(tbl_borders, side)
            side_bdr.set(qn("val"), "none")

        # General table text style
        r_pr = ensure_element(st, "rPr")
        set_r_fonts(r_pr, "Arial")
        set_color(r_pr, "1E293B")
        set_sz(r_pr, 20) # 10pt

        # Conditional formatting: firstRow (Header)
        first_row_pr = None
        for tsp in st.findall(qn("tblStylePr")):
            if tsp.attrib.get(qn("type")) == "firstRow":
                first_row_pr = tsp
                break
        if first_row_pr is None:
            first_row_pr = ET.SubElement(st, qn("tblStylePr"))
            first_row_pr.set(qn("type"), "firstRow")

        tc_pr = ensure_element(first_row_pr, "tcPr")
        shd = ensure_element(tc_pr, "shd")
        shd.set(qn("val"), "clear")
        shd.set(qn("color"), "auto")
        shd.set(qn("fill"), "0F2C59") # Corporate Navy Header Background

        tc_borders = ensure_element(tc_pr, "tcBorders")
        bot_tc = ensure_element(tc_borders, "bottom")
        bot_tc.set(qn("val"), "single")
        bot_tc.set(qn("sz"), "16") # 2pt
        bot_tc.set(qn("space"), "0")
        bot_tc.set(qn("color"), "0F2C59")

        fr_rpr = ensure_element(first_row_pr, "rPr")
        set_r_fonts(fr_rpr, "Arial")
        set_bold(fr_rpr, True)
        set_color(fr_rpr, "FFFFFF") # Crisp white text on dark navy
        set_sz(fr_rpr, 20)

        # Conditional formatting: band1Horz (Zebra rows)
        band_pr = None
        for tsp in st.findall(qn("tblStylePr")):
            if tsp.attrib.get(qn("type")) == "band1Horz":
                band_pr = tsp
                break
        if band_pr is None:
            band_pr = ET.SubElement(st, qn("tblStylePr"))
            band_pr.set(qn("type"), "band1Horz")

        tc_pr_band = ensure_element(band_pr, "tcPr")
        shd_band = ensure_element(tc_pr_band, "shd")
        shd_band.set(qn("val"), "clear")
        shd_band.set(qn("color"), "auto")
        shd_band.set(qn("fill"), "F8FAFC") # Soft light background for alternating rows

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)

def main():
    if not DOCX_PATH.exists():
        raise FileNotFoundError(f"Reference docx not found at {DOCX_PATH}")

    # Read original zip into memory
    with open(DOCX_PATH, "rb") as f:
        in_buf = io.BytesIO(f.read())

    out_buf = io.BytesIO()
    with zipfile.ZipFile(in_buf, "r") as zin, zipfile.ZipFile(out_buf, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            content = zin.read(item.filename)
            if item.filename == "word/styles.xml":
                content = update_styles(content)
            elif item.filename == "word/theme/theme1.xml":
                content = update_theme(content)
            elif item.filename == "word/fontTable.xml":
                content = update_font_table(content)
            zout.writestr(item, content)

    # Overwrite reference.docx
    with open(DOCX_PATH, "wb") as f:
        f.write(out_buf.getvalue())

    print(f"Successfully updated {DOCX_PATH} ({DOCX_PATH.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
