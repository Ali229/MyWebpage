from pathlib import Path

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src" / "assets" / "resume.pdf"


def build_styles():
    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="ResumeName",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=28,
            alignment=1,
            textColor=colors.black,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ResumeContact",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=11,
            alignment=1,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ResumeSection",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=11,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ResumeCompany",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.8,
            leading=11.2,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ResumeDate",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.6,
            leading=11,
            alignment=2,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ResumeRole",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9.6,
            leading=11,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ResumeSchool",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9.6,
            leading=11,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ResumeBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=11,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ResumeBullet",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=11,
            textColor=colors.black,
            leftIndent=11,
            firstLineIndent=-9,
        )
    )
    return styles


def section_header(title, width, styles):
    table = Table([[Paragraph(title, styles["ResumeSection"]), ""]], colWidths=[1.85 * inch, width - (1.85 * inch)])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LINEBELOW", (0, 0), (-1, -1), 0.9, colors.black),
            ]
        )
    )
    return table


def two_col(left, right, left_style, right_style, width):
    table = Table([[Paragraph(left, left_style), Paragraph(right, right_style)]], colWidths=[width * 0.72, width * 0.28])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return table


def add_bullets(story, bullets, styles):
    for bullet in bullets:
        story.append(Paragraph(f"&bull; {bullet}", styles["ResumeBullet"]))


def build_resume():
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.52 * inch,
        bottomMargin=0.5 * inch,
        title="Muhammad Ali Resume",
        author="Muhammad Ali",
    )

    story = [
        Paragraph("Muhammad Ali", styles["ResumeName"]),
        Paragraph(
            '<link href="mailto:alinaeem229@gmail.com" color="black">alinaeem229@gmail.com</link> | '
            '678-763-4277 | '
            '<link href="https://alinaeem.com" color="black">https://alinaeem.com</link> | '
            '<link href="https://github.com/Ali229" color="black">github.com/Ali229</link>',
            styles["ResumeContact"],
        ),
        Spacer(1, 12),
        section_header("SUMMARY", doc.width, styles),
        Spacer(1, 4),
        Paragraph(
            "Software Development Engineer with 6+ years building Angular and TypeScript applications for affordable housing, compliance, and business operations. "
            "Experienced delivering workflow-heavy product features, document and integration systems, and polished user-facing tools across full-stack teams.",
            styles["ResumeBody"],
        ),
        Spacer(1, 12),
        section_header("WORK EXPERIENCE", doc.width, styles),
        Spacer(1, 4),
        two_col("Yardi", "May 2019 - Present", styles["ResumeCompany"], styles["ResumeDate"], doc.width),
        Spacer(1, 2),
        two_col("Software Development Engineer III", "Oct 2023 - Present", styles["ResumeRole"], styles["ResumeDate"], doc.width),
    ]

    add_bullets(
        story,
        [
            "Led delivery of the Affordable Waiting List feature in Compliance Manager, including RentCafe integration, audit logging, and invitation-to-move-in workflows.",
            "Built member and ID verification plus roommate application management features for HUD 50059 certifications and resident portal flows.",
        ],
        styles,
    )

    story.extend(
        [
            Spacer(1, 6),
            two_col("Software Development Engineer II", "Oct 2020 - Dec 2023", styles["ResumeRole"], styles["ResumeDate"], doc.width),
        ]
    )

    add_bullets(
        story,
        [
            "Architected Verification Letters and Verification Services capabilities spanning document generation, file handling, e-signature workflows, and third-party review.",
            "Developed Prospect Applications and refactored shared file infrastructure into a multi-tenant library that improved certification and dashboard accuracy.",
        ],
        styles,
    )

    story.extend(
        [
            Spacer(1, 6),
            two_col("Software Development Engineer I", "May 2019 - Oct 2020", styles["ResumeRole"], styles["ResumeDate"], doc.width),
        ]
    )

    add_bullets(
        story,
        [
            "Designed and built Schedule Unit Transfer in Yardi Breeze, an end-to-end workflow for affordable housing property managers.",
            "Delivered migration tooling and product features across Other Housing Agency, Portability, Admin Fee, and Landlord Overpayment.",
        ],
        styles,
    )

    story.extend(
        [
            Spacer(1, 10),
            two_col("Kennesaw State University", "Jan 2017 - May 2019", styles["ResumeCompany"], styles["ResumeDate"], doc.width),
            Paragraph("Computer Programming Tutor and Teaching Assistant", styles["ResumeRole"]),
        ]
    )

    add_bullets(
        story,
        [
            "Tutored Java, C#, C++, Python, and JavaScript while helping students strengthen debugging, programming fundamentals, and project work.",
        ],
        styles,
    )

    story.extend(
        [
            Spacer(1, 10),
            two_col("SwordsAxe", "Dec 2012 - Jan 2017", styles["ResumeCompany"], styles["ResumeDate"], doc.width),
            Paragraph("Web Developer", styles["ResumeRole"]),
        ]
    )

    add_bullets(
        story,
        [
            "Built website components and maintained product catalog content across regular site updates.",
        ],
        styles,
    )

    story.extend(
        [
            Spacer(1, 12),
            section_header("TECHNICAL SKILLS", doc.width, styles),
            Spacer(1, 4),
        ]
    )

    add_bullets(
        story,
        [
            "<b>Languages & Frameworks:</b> Angular, TypeScript, JavaScript, C#, Java, SQL, HTML, SCSS, Bootstrap",
            "<b>Product & Platform:</b> REST API integration, document workflows, e-signature flows, multi-step business applications",
            "<b>Tools:</b> Git, Jenkins, Google Cloud Platform, Azure, Android development",
        ],
        styles,
    )

    story.extend(
        [
            Spacer(1, 12),
            section_header("EDUCATION", doc.width, styles),
            Spacer(1, 4),
            two_col(
                "Bachelor of Science in <b>Software Engineering</b>",
                "Jan 2016 - May 2019",
                styles["ResumeBody"],
                styles["ResumeDate"],
                doc.width,
            ),
            Paragraph("Kennesaw State University", styles["ResumeSchool"]),
            Paragraph("GPA: <b>3.91</b>", styles["ResumeBody"]),
            Spacer(1, 10),
            two_col(
                "Associate of Applied Science in <b>Computer Programming</b>",
                "Dec 2012 - Dec 2015",
                styles["ResumeBody"],
                styles["ResumeDate"],
                doc.width,
            ),
            Paragraph("Chattahoochee Technical College", styles["ResumeSchool"]),
            Paragraph("GPA: <b>3.75</b>", styles["ResumeBody"]),
            Spacer(1, 12),
            section_header("PROJECTS", doc.width, styles),
            Spacer(1, 4),
            Paragraph(
                "<b>Postit</b> (Angular, TypeScript, SCSS, HTML5): Built a platform for tax and accounting workflows including journalizing, posting, adjusting entries, and income statements.",
                styles["ResumeBody"],
            ),
            Spacer(1, 3),
            Paragraph(
                "<b>WeTile</b> (Android, C#): Built a weather app with GPS-based forecasts and widget support for Android and Windows devices.",
                styles["ResumeBody"],
            ),
            Spacer(1, 3),
            Paragraph(
                "<b>ChatWare</b> (Java): Built a socket-based desktop chat application using JavaFX.",
                styles["ResumeBody"],
            ),
            Spacer(1, 3),
            Paragraph(
                "<b>ABDebatePro</b> (Java): Built an automated round-robin debate scheduler for event planning and assignment flow.",
                styles["ResumeBody"],
            ),
        ]
    )

    doc.build(story)

    pages = len(PdfReader(str(OUTPUT)).pages)
    if pages != 1:
        raise SystemExit(f"Expected a single-page resume, but generated {pages} pages.")


if __name__ == "__main__":
    build_resume()
