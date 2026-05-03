from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "product-spec.md"
OUTPUT = ROOT / "AIDanceFlow-product-spec.pdf"


def register_font():
    candidates = [
        Path("C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/simhei.ttf"),
        Path("C:/Windows/Fonts/simsun.ttc"),
    ]
    for path in candidates:
        if path.exists():
            pdfmetrics.registerFont(TTFont("CNFont", str(path)))
            return "CNFont"
    return "Helvetica"


def flush_list(story, items, style):
    if not items:
        return
    story.append(
        ListFlowable(
            [ListItem(Paragraph(item, style), leftIndent=0) for item in items],
            bulletType="bullet",
            start="circle",
            leftIndent=14,
            bulletFontName=style.fontName,
        )
    )
    story.append(Spacer(1, 4 * mm))


def build_pdf():
    font = register_font()
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "TitleCN",
        parent=styles["Title"],
        fontName=font,
        fontSize=22,
        leading=30,
        textColor=colors.HexColor("#111111"),
        spaceAfter=8 * mm,
    )
    heading = ParagraphStyle(
        "HeadingCN",
        parent=styles["Heading2"],
        fontName=font,
        fontSize=14,
        leading=20,
        textColor=colors.HexColor("#f97316"),
        spaceBefore=5 * mm,
        spaceAfter=2 * mm,
    )
    body = ParagraphStyle(
        "BodyCN",
        parent=styles["BodyText"],
        fontName=font,
        fontSize=9.6,
        leading=16,
        textColor=colors.HexColor("#222222"),
        spaceAfter=2.5 * mm,
    )

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="AIDanceFlow 产品说明文档",
    )

    story = []
    list_items = []
    for raw_line in SOURCE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            flush_list(story, list_items, body)
            list_items = []
            story.append(Spacer(1, 1 * mm))
            continue
        if line.startswith("# "):
            flush_list(story, list_items, body)
            list_items = []
            story.append(Paragraph(line[2:], title))
            continue
        if line.startswith("## ") or line.startswith("### "):
            flush_list(story, list_items, body)
            list_items = []
            story.append(Paragraph(line.lstrip("# "), heading))
            continue
        if line.startswith("- "):
            list_items.append(line[2:])
            continue
        if len(line) > 2 and line[0].isdigit() and line[1] == ".":
            list_items.append(line[2:].strip())
            continue
        flush_list(story, list_items, body)
        list_items = []
        story.append(Paragraph(line, body))

    flush_list(story, list_items, body)
    doc.build(story)


if __name__ == "__main__":
    build_pdf()
