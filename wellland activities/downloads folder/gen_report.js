const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  UnderlineType
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const hdrBorder = { style: BorderStyle.SINGLE, size: 1, color: "1B3A6B" };
const hdrBorders = { top: hdrBorder, bottom: hdrBorder, left: hdrBorder, right: hdrBorder };

const cm = (margins) => ({ top: 80, bottom: 80, left: 120, right: 120, ...margins });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "1B3A6B" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: "2E5FA3" })]
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 180, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: "1B3A6B" })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, font: "Arial", ...opts })]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 20, font: "Arial" })]
  });
}

function numBullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 20, font: "Arial" })]
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E5FA3", space: 1 } },
    children: []
  });
}

function space(n = 1) {
  return new Paragraph({ spacing: { before: 60 * n, after: 0 }, children: [] });
}

function cell(text, w, shading, bold = false, fontSize = 18) {
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
    margins: cm(),
    children: [new Paragraph({
      children: [new TextRun({ text, bold, size: fontSize, font: "Arial" })]
    })]
  });
}

function hdrCell(text, w) {
  return new TableCell({
    borders: hdrBorders,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: "1B3A6B", type: ShadingType.CLEAR },
    margins: cm(),
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 18, font: "Arial", color: "FFFFFF" })]
    })]
  });
}

function tRow(cells) { return new TableRow({ children: cells }); }

// ========================================================
// REPORT DATA
// ========================================================

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "-", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 900, hanging: 360 } } } }
        ]
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 360 } } } }
        ]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1B3A6B" },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E5FA3" },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: "1B3A6B" },
        paragraph: { spacing: { before: 180, after: 60 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          spacing: { before: 0, after: 60 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "1B3A6B", space: 1 } },
          children: [
            new TextRun({ text: "WELL LAND INVESTMENT PVT. LTD.  |  THILAFUSHI SITE VISIT REPORT", size: 16, font: "Arial", color: "1B3A6B", bold: true }),
            new TextRun({ text: "  |  25 APRIL 2026  |  CONFIDENTIAL", size: 16, font: "Arial", color: "888888" })
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          spacing: { before: 60, after: 0 },
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 1 } },
          children: [
            new TextRun({ text: "Well Land Investment Pte. Ltd.  |  Antrac Holding Group  |  Thilafushi Site Visit — 25 Apr 2026  |  Page ", size: 16, font: "Arial", color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "888888" })
          ]
        })]
      })
    },
    children: [

      // =============================================
      // COVER / TITLE
      // =============================================
      new Paragraph({
        spacing: { before: 480, after: 120 },
        children: [new TextRun({ text: "ANTRAC HOLDING GROUP", size: 22, font: "Arial", color: "888888", bold: true })]
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: "Well Land Investment Pte. Ltd.", size: 36, bold: true, font: "Arial", color: "1B3A6B" })]
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: "THILAFUSHI BASE — UNANNOUNCED SITE VISIT REPORT", size: 28, bold: true, font: "Arial", color: "2E5FA3" })]
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: "Date of Visit: 25 April 2026 (Saturday)  |  Prepared By: Ali Mushthaq Ibrahim, GM Well Land", size: 20, font: "Arial", color: "444444" })]
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: "Classification: Internal — Management Restricted", size: 20, font: "Arial", color: "C00000", bold: true })]
      }),
      divider(),
      space(),

      // =============================================
      // SECTION 1: EXECUTIVE SUMMARY
      // =============================================
      h1("1. EXECUTIVE SUMMARY"),
      para("This report documents findings from an unannounced site visit conducted on 25 April 2026 to the Well Land Investment heavy machinery base at Thilafushi. The visit involved a comprehensive walk-around of the full facility: outdoor asset yard, drydock area, workshops, office, staff accommodation, and waterfront. A total of 81 photo pages (approximately 160 images) were captured as evidence."),
      space(),
      para("The core mandate of Well Land Investment as a heavy machinery and vessel rental company is effectively stalled. Against a registered fleet of 31 assets (including pending deliveries), only 1 vehicle is currently confirmed operable and 1 operator is available — who is also routinely deployed on electrical works, creating further bottlenecks. The original business model — Thilafushi-based fleet for client rental — has been displaced entirely by project-site deployment and accumulating unresolved repair backlogs.", { bold: false }),
      space(),
      h3("Critical Headline Findings"),
      bullet("31 staff on HR portal; 30 confirmed at Thilafushi. Only 1 machine genuinely ready for rental operations."),
      bullet("The drydocked blue vessel (PLK/WL vessel) has propeller and shaft removed — major overhaul underway with active crew."),
      bullet("Workshop and storage conditions are severely substandard — fire hazard (open electrical panels, LPG tanks, open wiring), no part labelling, no bin system, no segregation of tools vs. consumables vs. scrap."),
      bullet("Staff welfare space doubles as sleeping quarters inside the operational workspace — unacceptable."),
      bullet("Multiple unregistered assets observed at site — not captured in the WL Ops Command Center register."),
      bullet("No dedicated R&M Supervisor. Senior Supervisor (Janaka Prasath) is the sole point of management on site and is ageing; this is a single point of failure."),
      bullet("No formal maintenance schedule exists for any asset. All interventions are reactive. Rapid action required to protect the value of the new articulated dump trucks and excavators."),
      bullet("Sales / rental pipeline: zero. No customer engagements logged. Business model not yet activated."),
      space(),

      // =============================================
      // SECTION 2: PHOTO EVIDENCE — ASSET IDENTIFICATION
      // =============================================
      h1("2. PHOTO EVIDENCE — ASSET IDENTIFICATION & STATUS"),
      para("The following table maps all assets visually confirmed during the site visit against the WL Ops Command Center register. Where registration numbers or serial plates were visible, these are noted. Where assets are NOT in the current register, these are flagged as 'UNREGISTERED — ACTION REQUIRED'."),
      space(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1000, 1500, 1200, 1000, 900, 1200, 2560],
        rows: [
          tRow([
            hdrCell("Fleet ID", 1000), hdrCell("Brand / Model", 1500), hdrCell("Type", 1200),
            hdrCell("Reg / Serial Seen", 1000), hdrCell("Location Today", 900),
            hdrCell("Condition (Visual)", 1200), hdrCell("Notes / Clarifications Required", 2560)
          ]),
          // Confirmed registered assets
          tRow([cell("WL-HV-0013",1000,"EBF5FB"), cell("NISSAN 50 Forklift",1500,"EBF5FB"), cell("Forklift 5T",1200,"EBF5FB"), cell("—",1000,"EBF5FB"), cell("Thilafushi",900,"EBF5FB"), cell("Fair",1200,"EBF5FB"), cell("Parked outdoors, minor rust visible. Operational. No operator assigned on-site today.",2560,"EBF5FB")]),
          tRow([cell("WL-HV-0010",1000), cell("TADANO TR300EX",1500), cell("Mobile Crane",1200), cell("C V1A C2210",1000), cell("Thilafushi",900), cell("Operational",1200,"E2EFDA"), cell("Blue crane body. Operator: Walapita Godellage (WL-EMP-0007). Reg plate confirmed on photo. Boom tarped.",2560)]),
          tRow([cell("WL-HV-0014",1000,"EBF5FB"), cell("BOBCAT S450",1500,"EBF5FB"), cell("Skid Steer",1200,"EBF5FB"), cell("C V1A C2393",1000,"EBF5FB"), cell("Thilafushi",900,"EBF5FB"), cell("Operational",1200,"E2EFDA","EBF5FB"), cell("2015 model confirmed on chassis plate. Czech Republic. Product ID: B1E612997. Operational.",2560,"EBF5FB")]),
          tRow([cell("WL-HV-0017",1000), cell("XCMG XE60WG",1500), cell("Wheel Excavator",1200), cell("XUGD060FCRKA00001",1000), cell("Thilafushi",900), cell("Operational",1200,"E2EFDA"), cell("2024 model. 36.8kW. Engine: XCUCEMPBJA00658. Plates confirmed. New condition. Clarify current operator assignment.",2560)]),
          tRow([cell("WL-HV-0018",1000,"EBF5FB"), cell("KOMATSU PC70-8",1500,"EBF5FB"), cell("Mini Excavator",1200,"EBF5FB"), cell("KMTPC238P38C02085",1000,"EBF5FB"), cell("Thilafushi",900,"EBF5FB"), cell("Issue",1200,"FFE699","EBF5FB"), cell("Track line issue (Teflon fabrication ongoing per register). Confirm PR WL-PR-0011 status with Janaka.",2560,"EBF5FB")]),
          tRow([cell("WL-HV-0019",1000), cell("CAT 323D3",1500), cell("Tracked Excavator",1200), cell("CAT0323DKFEY00469",1000), cell("Thilafushi",900), cell("Operational",1200,"E2EFDA"), cell("Spec sheet confirmed: 2019, EX#418, 4,539 hrs, India, Rolman World. No bucket issue noted. Clarify operator.",2560)]),
          tRow([cell("WL-HV-0020",1000,"EBF5FB"), cell("SUMITOMO SH220LC6",1500,"EBF5FB"), cell("Tracked Excavator",1200,"EBF5FB"), cell("SMT220U6P00BH1182",1000,"EBF5FB"), cell("Thilafushi",900,"EBF5FB"), cell("Operational",1200,"E2EFDA","EBF5FB"), cell("Spec sheet confirmed: 2021 UNUSED, EX#577, 12 hrs, Japan. Critical asset — protect with scheduled PM immediately.",2560,"EBF5FB")]),
          tRow([cell("WL-HV-0021",1000), cell("CAT 336DL",1500), cell("Tracked Excavator",1200), cell("CAT0336DAWRK00437",1000), cell("Thilafushi",900), cell("GROUNDED",1200,"FFB3B3"), cell("Spec sheet: 2012, EX#1169, 16,105 hrs, Japan. No bucket present. HIGH hours — bucket must be procured before deployment.",2560)]),
          tRow([cell("WL-HV-0022",1000,"EBF5FB"), cell("CAT 336DL",1500,"EBF5FB"), cell("Tracked Excavator",1200,"EBF5FB"), cell("CAT0336DPPGW00178",1000,"EBF5FB"), cell("Thilafushi?",900,"EBF5FB"), cell("GROUNDED",1200,"FFB3B3","EBF5FB"), cell("Second 336DL — not clearly separated in photos from HV-0021. Confirm physical separation and serial confirmation on site.",2560,"EBF5FB")]),
          tRow([cell("WL-HV-0024",1000), cell("CAT 745C",1500), cell("Artic. Dump Truck",1200), cell("CAT0745CTTFK00218",1000), cell("Thilafushi",900), cell("Operational",1200,"E2EFDA"), cell("One of two 745C ADTs visible near fuel storage tanks. Switch assembly issue resolved per register. Confirm C18 engine serial.",2560)]),
          tRow([cell("WL-HV-0001",1000,"EBF5FB"), cell("VOLVO A40G",1500,"EBF5FB"), cell("Artic. Dump Truck",1200,"EBF5FB"), cell("VC60A40GC00340948",1000,"EBF5FB"), cell("Thilafushi / Bodu?",900,"EBF5FB"), cell("Unknown",1200,"FFE699","EBF5FB"), cell("Spec sheet photo shows 2017 A40G, S/N VC60A40GC00340948, 10,307 hrs. Clarify: is this HV-0001 (Bodufinolhu) or HV-0002 (Thilafushi)? Register shows HV-0002 at Thilafushi with SCR procedure done.",2560,"EBF5FB")]),
          tRow([cell("WL-HV-0023",1000), cell("CAT 745C",1500), cell("Artic. Dump Truck",1200), cell("CAT0745CETFK00507",1000), cell("Register: Bodu",900), cell("Unconfirmed",1200,"FFE699"), cell("Spec sheet EX#963 seen in photos (2015, 10,365 hrs, UK). Register shows this at Bodufinolhu GROUNDED (power issue). Confirm physical location.",2560)]),
          // Unregistered assets
          tRow([cell("UNREGISTERED",1000,"FFDDC1"), cell("ISUZU CXZ 81K",1500,"FFDDC1"), cell("Heavy Dump Truck",1200,"FFDDC1"), cell("Plate unread",1000,"FFDDC1"), cell("Thilafushi",900,"FFDDC1"), cell("GROUNDED",1200,"FFB3B3","FFDDC1"), cell("GROUNDED — bumper damage, dump body raised/stuck. Not in register. Is this WL-HV-0003 (Isuzu 14T)? Obtain chassis plate. Log in register immediately.",2560,"FFDDC1")]),
          tRow([cell("UNREGISTERED",1000,"FFDDC1"), cell("DFAC Small Dump",1500,"FFDDC1"), cell("Small Dump Truck",1200,"FFDDC1"), cell("C C0A C1726",1000,"FFDDC1"), cell("Thilafushi",900,"FFDDC1"), cell("Operational?",1200,"FFE699","FFDDC1"), cell("NOT in register. White cab, green tipper. Reg C1726 confirmed. Add to WL register immediately — obtain chassis, engine, ownership.",2560,"FFDDC1")]),
          tRow([cell("UNREGISTERED",1000,"FFDDC1"), cell("Large Flatbed (Red)",1500,"FFDDC1"), cell("Flatbed Truck",1200,"FFDDC1"), cell("C C1A C3185",1000,"FFDDC1"), cell("Thilafushi",900,"FFDDC1"), cell("Indeterminate",1200,"FFE699","FFDDC1"), cell("Large red/blue/white flatbed with water tanks loaded. Reg C3185 visible. May be WL-HV-0015 'AF 6T Pickup'? Confirm asset identity.",2560,"FFDDC1")]),
          tRow([cell("UNREGISTERED",1000,"FFDDC1"), cell("Conveyor Belt",1500,"FFDDC1"), cell("Equipment",1200,"FFDDC1"), cell("—",1000,"FFDDC1"), cell("Thilafushi Yard",900,"FFDDC1"), cell("Static",1200,"FFE699","FFDDC1"), cell("Approx. 6-8m belt conveyor, idle on yard. Not in any register. Determine ownership, assign asset ID, or flag for disposal.",2560,"FFDDC1")]),
          tRow([cell("PLK ASSET",1000,"F4CCCC"), cell("Fuel Tanker",1500,"F4CCCC"), cell("Tanker Truck",1200,"F4CCCC"), cell("7782201",1000,"F4CCCC"), cell("Thilafushi",900,"F4CCCC"), cell("Operational",1200,"E2EFDA","F4CCCC"), cell("Maldives Petroleum branded tanker. PLK (Petroleum Link) asset. Mushthaq also manages PLK — confirm this is in PLK register. Not a WL asset.",2560,"F4CCCC")]),
          tRow([cell("WL-MV (TBC)",1000,"EBF5FB"), cell("Blue Vessel (Drydock)",1500,"EBF5FB"), cell("Tug/Supply",1200,"EBF5FB"), cell("—",1000,"EBF5FB"), cell("Drydock, Thilafushi",900,"EBF5FB"), cell("Drydock — Major",1200,"FFE699","EBF5FB"), cell("Propeller and shaft removed. Active hull work and welding. Scaffolding in place. Active crew visible. Confirm vessel name/reg, ownership (WL or PLK), and expected return-to-service date.",2560,"EBF5FB")]),
          tRow([cell("WL-MV-0001?",1000), cell("White Supply Vessel",1500), cell("Supply/Ferry",1200), cell("'SAFETY FIRST'",1000), cell("Drydock Wharf",900), cell("Drydock — Minor",1200,"FFE699"), cell("Separate from blue vessel. Workers aboard. 'SAFETY FIRST' text on hull. Confirm identity — is this LCT-1 or Dhoni-1? Welding work ongoing on deck.",2560)]),
          tRow([cell("WL-MV (TBC)",1000,"EBF5FB"), cell("Pontoon/Barge",1500,"EBF5FB"), cell("Barge",1200,"EBF5FB"), cell("—",1000,"EBF5FB"), cell("Waterfront",900,"EBF5FB"), cell("Active",1200,"E2EFDA","EBF5FB"), cell("Flat pontoon barge with two mooring poles. In register as 'Well Land Heavy Barge'. Confirm dimensions, load capacity, and permit status.",2560,"EBF5FB")]),
          tRow([cell("WL-MV-0003?",1000), cell("Speed Boat (White)",1500), cell("Speed Boat",1200), cell("—",1000), cell("Waterfront",900), cell("Moored",1200,"E2EFDA"), cell("White fibreglass catamaran-hull speed boat. Confirm: is this Speed Boat 1 (WL-MV-0003) or Speed Boat 2 (currently listed drydocked, WL-MV-0004)?",2560)]),
          // Ancillary equipment
          tRow([cell("NO ID",1000,"FFDDC1"), cell("AIRMAN PDS185S",1500,"FFDDC1"), cell("Air Compressor",1200,"FFDDC1"), cell("—",1000,"FFDDC1"), cell("Thilafushi Yard",900,"FFDDC1"), cell("Idle — Stored",1200,"FFE699","FFDDC1"), cell("Trailer-mounted diesel compressor. Not in any register. Determine ownership, assign ID, assess condition. Used for sandblasting?",2560,"FFDDC1")]),
          tRow([cell("NO ID",1000,"FFDDC1"), cell("Blue Genset x2",1500,"FFDDC1"), cell("Generator",1200,"FFDDC1"), cell("Y02949 / 102949",1000,"FFDDC1"), cell("Thilafushi Yard",900,"FFDDC1"), cell("Operational?",1200,"FFE699","FFDDC1"), cell("Two large blue canopied diesel gensets. S/N visible on one: Y02949 / 102949. Not in register. Assign IDs. Confirm kVA rating, fuel condition, last service.",2560,"FFDDC1")]),
          tRow([cell("NO ID",1000,"FFDDC1"), cell("DENYO DCA25ESI",1500,"FFDDC1"), cell("Generator",1200,"FFDDC1"), cell("DCA25ESI",1000,"FFDDC1"), cell("Thilafushi",900,"FFDDC1"), cell("Needs Inspection",1200,"FFE699","FFDDC1"), cell("Yellow Denyo generator — 3-phase, 25kVA-class. Open panel visible in photos. Wiring inspection required. Assign ID.",2560,"FFDDC1")]),
          tRow([cell("NO ID",1000,"FFDDC1"), cell("Arc Welders x3",1500,"FFDDC1"), cell("Welding Machines",1200,"FFDDC1"), cell("—",1000,"FFDDC1"), cell("Thilafushi Yard",900,"FFDDC1"), cell("Idle — Covered",1200,"FFE699","FFDDC1"), cell("Three orange arc welding units stored outdoors under tarp. Not catalogued. Add to equipment register.",2560,"FFDDC1")]),
          tRow([cell("NO ID",1000,"FFDDC1"), cell("Salvage Engines",1500,"FFDDC1"), cell("Spare Parts",1200,"FFDDC1"), cell("—",1000,"FFDDC1"), cell("Engine Workshop",900,"FFDDC1"), cell("Mixed",1200,"FFE699","FFDDC1"), cell("Multiple disassembled Volvo (green) and CAT (yellow) engines/components in engine workshop. Catalogue each. Identify serviceable vs. scrap. Yellow CAT block on workshop floor undergoing overhaul.",2560,"FFDDC1")]),
          tRow([cell("NO ID",1000,"FFDDC1"), cell("SUZUKI Outboard",1500,"FFDDC1"), cell("Outboard Motor",1200,"FFDDC1"), cell("—",1000,"FFDDC1"), cell("Engine Workshop",900,"FFDDC1"), cell("Boxed",1200,"E2EFDA","FFDDC1"), cell("Suzuki outboard motor in original manufacturer box. New or refurbished? Assign to a vessel, log in marine register, secure storage.",2560,"FFDDC1")]),
          tRow([cell("NO ID",1000,"FFDDC1"), cell("U50-S Forklift",1500,"FFDDC1"), cell("Forklift",1200,"FFDDC1"), cell("ZEPX branded",1000,"FFDDC1"), cell("Thilafushi",900,"FFDDC1"), cell("Indeterminate",1200,"FFE699","FFDDC1"), cell("Yellow/blue forklift with 'U50-S ZEPX' branding. NOT the Nissan 50 (HV-0013). Appears to be a separate unit. Register immediately.",2560,"FFDDC1")]),
        ]
      }),
      space(),
      para("COLOUR KEY: Blue = Confirmed registered asset  |  Orange = Unregistered — action required  |  Red = PLK asset (separate register)  |  Green condition = Operational  |  Amber = Issue  |  Red condition = Grounded", { color: "444444", italics: true }),

      space(2),
      // =============================================
      // SECTION 3: FLEET REGISTER RECONCILIATION
      // =============================================
      h1("3. FLEET REGISTER RECONCILIATION & GAP ANALYSIS"),

      h2("3.1 Registered Assets NOT Visually Confirmed in Photos"),
      para("The following assets from the WL Ops Command Center are either at project sites or could not be confirmed from today's photo evidence. Verification actions are noted."),
      space(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1000, 1500, 1800, 1200, 3860],
        rows: [
          tRow([hdrCell("Fleet ID",1000), hdrCell("Asset",1500), hdrCell("Registered Location",1800), hdrCell("Register Status",1200), hdrCell("Action Required",3860)]),
          tRow([cell("WL-HV-0001",1000,"EBF5FB"), cell("VOLVO A40G",1500,"EBF5FB"), cell("Bodufinolhu",1800,"EBF5FB"), cell("Active — Site",1200,"EBF5FB"), cell("Confirm current status with Sampath. PR WL-PR-0001 (hydraulic hose) unresolved since 15 Mar — critical.",3860,"EBF5FB")]),
          tRow([cell("WL-HV-0002",1000), cell("VOLVO A40G",1500), cell("Thilafushi — Base",1800), cell("Active",1200), cell("SCR procedure done. Hydraulic valve/hose issue open. Confirm machine is physically on base and not dispatched.",3860)]),
          tRow([cell("WL-HV-0003",1000,"EBF5FB"), cell("ISUZU 14T",1500,"EBF5FB"), cell("Thilafushi — Base",1800,"EBF5FB"), cell("Active",1200,"EBF5FB"), cell("May be the grounded Isuzu CXZ observed in photos. Confirm chassis number to match.",3860,"EBF5FB")]),
          tRow([cell("WL-HV-0004",1000), cell("UD NISSAN 14T",1500), cell("Thilafushi — Base",1800), cell("Active",1200), cell("Not clearly visible in photos. Confirm location and operability today. Could be inside compound.",3860)]),
          tRow([cell("WL-HV-0005",1000,"EBF5FB"), cell("KOBELCO SK380",1500,"EBF5FB"), cell("Muthaafushi",1800,"EBF5FB"), cell("Operational (minor)",1200,"E2EFDA","EBF5FB"), cell("Air filter due. Confirm with Sampath. The teal/green Kobelco visible in Thilafushi photos may be this machine — if so, it has returned from Muthaafushi without notification. CLARIFY.",3860,"EBF5FB")]),
          tRow([cell("WL-HV-0006",1000), cell("KOMATSU PC350",1500), cell("Muthaafushi",1800), cell("GROUNDED",1200,"FFB3B3"), cell("Multiple failures. Parts dispatched 22 Apr. Confirm receipt and repair progress with Sampath/Janaka. CRITICAL.",3860)]),
          tRow([cell("WL-HV-0007",1000,"EBF5FB"), cell("KOMATSU PC350",1500,"EBF5FB"), cell("Bodufinolhu",1800,"EBF5FB"), cell("GROUNDED",1200,"FFB3B3","EBF5FB"), cell("Hydraulic pump failure. Decision on USD 6,000 recon pump pending Hameed. Engineer cost accruing MVR 800/day. ESCALATE.",3860,"EBF5FB")]),
          tRow([cell("WL-HV-0008",1000), cell("KOMATSU PC350",1500), cell("Bodufinolhu",1800), cell("Operational (minor)",1200,"E2EFDA"), cell("Seal kits dispatched 15 Apr. Confirm installation complete with Sampath.",3860)]),
          tRow([cell("WL-HV-0009",1000,"EBF5FB"), cell("KOMATSU PC350",1500,"EBF5FB"), cell("UNKNOWN",1800,"FFB3B3","EBF5FB"), cell("UNKNOWN",1200,"FFB3B3","EBF5FB"), cell("CRITICAL GAP. Not confirmed in any photo. Location and status completely unknown. Must be physically located before end of business Monday 27 Apr. Contact Sampath and Janaka simultaneously.",3860,"EBF5FB")]),
          tRow([cell("WL-HV-0011",1000), cell("KOBELCO SK235",1500), cell("Muthaafushi",1800), cell("Operational",1200,"E2EFDA"), cell("Confirm with Sampath. Get operator daily report.",3860)]),
          tRow([cell("WL-HV-0012",1000,"EBF5FB"), cell("KUBOTA 50",1500,"EBF5FB"), cell("Muthaafushi",1800,"EBF5FB"), cell("Operational",1200,"E2EFDA","EBF5FB"), cell("Confirm with Sampath. Get operator daily report.",3860,"EBF5FB")]),
          tRow([cell("WL-HV-0015",1000), cell("AF 6T Pickup",1500), cell("Thilafushi",1800), cell("Operational",1200,"E2EFDA"), cell("May be the large red flatbed (C3185) seen in photos. Confirm by checking registration.",3860)]),
          tRow([cell("WL-HV-0016",1000,"EBF5FB"), cell("CAT Loader",1500,"EBF5FB"), cell("Muthaafushi",1800,"EBF5FB"), cell("Operational",1200,"E2EFDA","EBF5FB"), cell("Confirm with Sampath.",3860,"EBF5FB")]),
          tRow([cell("WL-HV-0025~031",1000), cell("Al Dahr Units (7)",1500), cell("Pending Delivery",1800), cell("Ordered",1200,"FFE699"), cell("Not yet received. Follow up Al Dahr/Rolman for ETA of all pending units.",3860)]),
        ]
      }),

      space(2),
      h2("3.2 New Assets — Immediate Documentation Requirements"),
      para("The following new assets (WL-HV-0017 to 0024) arrived via Rolman World/Al Dahr and are at Thilafushi. Photo evidence confirms their presence. Spec sheets visible in photos contain partial data. The Document Vault in the register shows all documentation as MISSING for these units. The following must be obtained within 7 days:"),
      space(),
      bullet("Chassis registration with Transport Authority of Maldives"),
      bullet("Insurance policy (comprehensive/third party)"),
      bullet("Owner manuals (physical, filed in Thilafushi office)"),
      bullet("Engine serial numbers confirmed for each unit"),
      bullet("Initial inspection checklist signed off by Janaka"),
      bullet("Meter/hour reading recorded as baseline for maintenance scheduling"),

      space(2),
      // =============================================
      // SECTION 4: STAFF ACCOUNTABILITY
      // =============================================
      h1("4. STAFF ACCOUNTABILITY"),

      h2("4.1 Staff Summary — Thilafushi Base"),
      para("HR Portal: 30 staff confirmed at Thilafushi. WL Ops Register: 31 engaged total (includes GM in Malé). The following staff categories were observed active on site today:"),
      space(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 1800, 1200, 1200, 3160],
        rows: [
          tRow([hdrCell("Category",2000), hdrCell("Names / IDs from Register",1800), hdrCell("Count",1200), hdrCell("Evidence",1200), hdrCell("Notes",3160)]),
          tRow([cell("Senior Management on Site",2000), cell("Janaka Prasath (WL-EMP-0009)",1800), cell("1",1200,"E2EFDA"), cell("Confirmed",1200), cell("Senior Supervisor. Only management presence on site. Single point of failure — must be backed up with a deputy.",3160)]),
          tRow([cell("Crane Operator",2000,"EBF5FB"), cell("R L Walapita Godellage (WL-EMP-0007)",1800,"EBF5FB"), cell("1",1200,"E2EFDA","EBF5FB"), cell("Confirmed",1200,"EBF5FB"), cell("Assigned to TR300EX. Also frequently used for electrical works — creating bottleneck and safety risk (operating crane while also handling live electrical).",3160,"EBF5FB")]),
          tRow([cell("Excavator Operators (Confirmed on Payroll)",2000), cell("Eswararao (0020), Soundarraj (0021), Anish John (0026), Feroskhan (0029)",1800), cell("4",1200,"E2EFDA"), cell("Register only",1200), cell("Were these 4 operators present today? Confirm with Janaka. None appear to be assigned to specific machines on-site.",3160)]),
          tRow([cell("Drivers",2000,"EBF5FB"), cell("MD Moyna Mia (0019), Shahjalal (0004), Dulip (0031 — permit pending)",1800,"EBF5FB"), cell("3",1200,"FFE699","EBF5FB"), cell("Register",1200,"EBF5FB"), cell("Dulip Priyankara cannot operate until work permit confirmed. Shahjalal dual-roles as mechanic. Only 1 usable driver effectively.",3160,"EBF5FB")]),
          tRow([cell("Mechanics / Workshop",2000), cell("Jackson Nginga (0028), Ibrahim Mohamed (0013), Mohammad Nurul Amin (0008 — welder)",1800), cell("3",1200,"E2EFDA"), cell("Register",1200), cell("Workshop activity visible in photos — at least 2 workers performing metalwork. Confirm which mechanics were present today.",3160)]),
          tRow([cell("Marine Crew",2000,"EBF5FB"), cell("Ali Shameem (0001), Nasrulla Ali (0003), Anuar Hussain (0002), MD Robel Miah (0005), Jakir Hossain (0011), Ala Uddin (0012), Mokhles (0014), Yeasin Miah (0018), Sheikh Farid (0010), Easa Gasim (0027)",1800,"EBF5FB"), cell("10",1200,"E2EFDA","EBF5FB"), cell("Photos show active crew on vessel",1200,"EBF5FB"), cell("Active crew visible on drydocked vessel in photos. Confirm all 10 marine staff present and accounted for.",3160,"EBF5FB")]),
          tRow([cell("Terminal / Helpers",2000), cell("Mohammad Naim (0015), Asif Mia (0016), MD Kamrul Islam (0017), Abdul Haq (0022), MD Ramjan Mia (0023), MD Sayed Mia (0024 — carpenter), Uzzal Sutradhar (0025 — carpenter)",1800), cell("7",1200,"E2EFDA"), cell("Register",1200), cell("Confirm all present and assigned tasks today. Carpenters — what is current task?",3160)]),
          tRow([cell("TOTAL CONFIRMED / EXPECTED",2000,"1B3A6B"), cell("—",1800,"1B3A6B"), cell("30",1200,"1B3A6B"), cell("—",1200,"1B3A6B"), cell("1 GM (Mushthaq) based in Malé. All others at Thilafushi per HR portal.",3160,"1B3A6B")]),
        ]
      }),

      space(),
      h2("4.2 Critical Staffing Gaps"),
      bullet("No dedicated R&M Supervisor: The entire repair operation falls on Janaka Prasath who is approaching retirement age. Immediate action: recruit a qualified mechanical supervisor with heavy equipment experience (Sri Lankan or Indian national preferred given Maldivian market). Target salary: MVR 12,000–15,000/month."),
      bullet("No Sales/Rental Coordinator: Well Land's core business model requires a client-facing role to manage rental inquiries, quotations, and delivery scheduling. Currently zero."),
      bullet("Electrical specialist conflated with crane operator: Walapita Godellage (crane operator) is also handling electrical work. This is a safety and operational risk. Either hire a dedicated electrician or formally segregate duties."),
      bullet("Operator-to-machine ratio inadequate: 4 excavator operators for 10+ excavators on-site is insufficient for full rental operations."),
      bullet("Work permit gap: Dulip Priyankara (WL-EMP-0031) cannot operate any vehicle. Resolve work permit as priority."),

      space(2),
      // =============================================
      // SECTION 5: CONDITION ASSESSMENT & MAINTENANCE FRAMEWORK
      // =============================================
      h1("5. FLEET CONDITION ASSESSMENT & MINIMUM MAINTENANCE FRAMEWORK"),

      h2("5.1 Condition vs. Age Analysis"),
      para("The Well Land fleet spans a wide age range — from 2021 unused machines to 2012 units with 16,000+ hours. The table below assesses each asset category against age and presents the minimum maintenance cycle required:"),
      space(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1400, 1000, 800, 800, 2400, 2960],
        rows: [
          tRow([hdrCell("Asset Type",1400), hdrCell("Age / Hrs",1000), hdrCell("Visual Condition",800), hdrCell("Risk Level",800), hdrCell("Minimum Maintenance Cycle",2400), hdrCell("Immediate Action",2960)]),
          tRow([cell("XCMG XE60WG (0017)",1400), cell("2024 / ~New",1000), cell("Good",800,"E2EFDA"), cell("LOW",800,"E2EFDA"), cell("250-hr oil/filter. 500-hr full service. Annual inspection.",2400), cell("Record baseline meter. Procure first 250-hr kit. Assign operator.",2960)]),
          tRow([cell("Sumitomo SH220LC6 (0020)",1400,"EBF5FB"), cell("2021 / 12 hrs",1000,"EBF5FB"), cell("Excellent",800,"E2EFDA","EBF5FB"), cell("LOW",800,"E2EFDA","EBF5FB"), cell("First service at 50 hrs. Then 250/500 hr schedule. Protect from salt air.",2400,"EBF5FB"), cell("URGENT: This machine has sat at 12 hrs since 2021. Check seals, hydraulic fluid condition, battery, fuel. Run up immediately.",2960,"EBF5FB")]),
          tRow([cell("CAT 323D3 (0019)",1400), cell("2019 / 4,539 hrs",1000), cell("Good",800,"E2EFDA"), cell("MEDIUM",800,"FFE699"), cell("250-hr oil change. 500-hr full service. 1000-hr major check. Track tension monthly.",2400), cell("Check all fluid levels. Track tension inspection. Confirm last service date.",2960)]),
          tRow([cell("KOMATSU PC70-8 (0018)",1400,"EBF5FB"), cell("TBC / TBC hrs",1000,"EBF5FB"), cell("Issue",800,"FFE699","EBF5FB"), cell("MEDIUM",800,"FFE699","EBF5FB"), cell("As above for Komatsu PC series. Track repair critical now.",2400,"EBF5FB"), cell("Complete Teflon track fabrication (PR-0011). Get hours reading.",2960,"EBF5FB")]),
          tRow([cell("CAT 336DL x2 (0021/0022)",1400), cell("2012 / 16,105 hrs",1000), cell("High Hours",800,"FFE699"), cell("HIGH",800,"FFB3B3"), cell("250-hr oil. Full service every 500 hrs. Annual major overhaul. Bucket procurement urgent.",2400), cell("GROUNDED — no bucket. Procure bucket (quick-couple compatible). At 16,000+ hrs, these machines are near end of economic life. Conduct full mechanical assessment before rental commitment.",2960)]),
          tRow([cell("CAT 745C ADTs (0023/0024)",1400,"EBF5FB"), cell("2015 / ~10,000 hrs",1000,"EBF5FB"), cell("Good",800,"E2EFDA","EBF5FB"), cell("MEDIUM",800,"FFE699","EBF5FB"), cell("250-hr oil/filter. 500-hr full service. Tyre pressure weekly. Diff oil 2000 hrs.",2400,"EBF5FB"), cell("0023 (Bodufinolhu): electrical bypass — rectify properly. 0024 (Thilafushi): parts received, confirm operational.",2960,"EBF5FB")]),
          tRow([cell("VOLVO A40G x2 (0001/0002)",1400), cell("2017 / 10,307 hrs",1000), cell("Good",800,"E2EFDA"), cell("MEDIUM",800,"FFE699"), cell("250-hr oil. 500-hr service. Articulation joint inspection bi-monthly.",2400), cell("PR-0001 unresolved (hydraulic hose). Close this PR immediately.",2960)]),
          tRow([cell("KOMATSU PC350 x4 (0006~0009)",1400,"EBF5FB"), cell("Aged / High hrs",1000,"EBF5FB"), cell("Multiple failures",800,"FFB3B3","EBF5FB"), cell("CRITICAL",800,"FFB3B3","EBF5FB"), cell("250-hr oil minimum. These machines require intensive monitoring — daily checks by operator.",2400,"EBF5FB"), cell("0006 and 0007: Grounded, parts en route. 0008: Minor, seals being replaced. 0009: LOCATION UNKNOWN — find immediately.",2960,"EBF5FB")]),
          tRow([cell("TADANO TR300EX (0010)",1400), cell("Aged / TBC hrs",1000), cell("Operational",800,"E2EFDA"), cell("MEDIUM",800,"FFE699"), cell("Annual load test mandatory for cranes. 250-hr service. Boom inspection monthly.",2400), cell("Confirm last load test date. Obtain crane certification. Critical for rental.",2960)]),
          tRow([cell("BOBCAT S450 (0014)",1400,"EBF5FB"), cell("2015 / TBC hrs",1000,"EBF5FB"), cell("Good",800,"E2EFDA","EBF5FB"), cell("LOW",800,"E2EFDA","EBF5FB"), cell("250-hr oil/filter. Monthly hydraulic check. Chain tension check.",2400,"EBF5FB"), cell("Confirm hours. Start PM log.",2960,"EBF5FB")]),
          tRow([cell("NISSAN 50 Forklift (0013)",1400), cell("Aged / TBC hrs",1000), cell("Fair",800,"FFE699"), cell("MEDIUM",800,"FFE699"), cell("Monthly tyre check, mast lubrication, quarterly full service.",2400), cell("Inspect LPG or diesel system. Check mast chain condition. Minor rust concern.",2960)]),
          tRow([cell("Vessels (0001~0004 + Barge)",1400,"EBF5FB"), cell("Varies",1000,"EBF5FB"), cell("Mixed",800,"FFE699","EBF5FB"), cell("HIGH",800,"FFB3B3","EBF5FB"), cell("Monthly hull check. Annual MPA survey mandatory. Bilge pump weekly.",2400,"EBF5FB"), cell("Drydocked vessel: confirm return-to-service ETA. All survey certificates: obtain and log in Compliance sheet. Missing permits = operating illegally.",2960,"EBF5FB")]),
        ]
      }),

      space(2),
      h2("5.2 Maintenance Protocol — Minimum Standards"),
      para("The following maintenance protocols must be established immediately as standing operating procedures, enforced by the incoming R&M Supervisor:"),
      space(),
      h3("Daily Checks (by Operator — Every Morning Before Start)"),
      bullet("Engine oil level"),
      bullet("Hydraulic fluid level"),
      bullet("Coolant level"),
      bullet("Fuel level"),
      bullet("Tyre condition and pressure (wheeled machines)"),
      bullet("Track tension (tracked machines)"),
      bullet("Lights and horns functional"),
      bullet("Grease points (where applicable)"),
      bullet("Record hours/meter reading in daily log"),
      space(),
      h3("Weekly Checks (by Mechanic — Every Monday)"),
      bullet("Filter condition (air, oil, hydraulic)"),
      bullet("Belt tension and condition"),
      bullet("Battery terminals and voltage"),
      bullet("Undercarriage condition (tracks, rollers, idlers)"),
      bullet("Hydraulic cylinder seals — visual check for leaks"),
      bullet("Structural integrity — cracks, unusual wear"),
      space(),
      h3("250-Hour Service (Mechanic + PM Supervisor)"),
      bullet("Engine oil and filter replacement"),
      bullet("Hydraulic oil sample analysis"),
      bullet("Fuel filter replacement"),
      bullet("Grease all points"),
      bullet("Cabin air filter clean/replace"),
      bullet("Record in service logbook and update Ops Register"),
      space(),
      h3("500-Hour Full Service"),
      bullet("All 250-hr items plus:"),
      bullet("Hydraulic return filter replacement", 1),
      bullet("Hydraulic oil replacement (if analysis indicates)", 1),
      bullet("Coolant flush and fill", 1),
      bullet("Transmission fluid check", 1),
      bullet("Full undercarriage inspection and measurement", 1),
      bullet("Electrical systems check", 1),
      bullet("Calibration of all safety systems", 1),
      space(),
      h3("Report Sharing — Minimum Frequency"),
      bullet("Daily: Operator/Crew morning checklist → WhatsApp to Ops → logged by 18:00"),
      bullet("Weekly: Mechanic inspection summary → Janaka → Mushthaq (every Monday 09:00)"),
      bullet("Monthly: Full fleet status update → Mushthaq → Directors"),
      bullet("Quarterly: R&M cost report + upcoming service forecast → Management review"),

      space(2),
      // =============================================
      // SECTION 6: STORAGE & INFRASTRUCTURE
      // =============================================
      h1("6. STORAGE FACILITIES ASSESSMENT & UPGRADE PLAN"),

      h2("6.1 Current State — What Was Observed"),
      bullet("Outdoor asset yard: Heavily cluttered. Multiple assets parked on bare gravel/coral with no markings, no allocated bays, no wheel chocks. Scrap metal, old tyres, and worn mooring ropes mixed in with operational equipment."),
      bullet("Small workshop (concrete block, roll-up door): Extremely hazardous. Open electrical panel with exposed wiring visible. Red LPG cylinder inside. Tools, hoses, pipe fittings all unsegregated on floor. No shelving system. No labelling."),
      bullet("Large workshop/repair bay (green corrugated, two-bay): Better floor space but chaotic layout. Active metalwork happening on the floor without proper welding screens. Heavy engine components stacked informally on pallets and crates."),
      bullet("Engine/parts store: Completely disorganised. Salvage engines from multiple makes mixed with new parts in original boxes (e.g. Suzuki outboard). No bin system. No part labelling. Risk of losing serviceable parts to scrap and vice versa."),
      bullet("Office: Functional — CCTV monitor, printer, filing cabinet. However, documents scattered across desk. A bed is present in what appears to be a shared office/accommodation space — unacceptable and likely a MNDF/MPA compliance issue."),
      bullet("Staff welfare/accommodation: Clothes drying in what appears to be a storage room. No defined cooking area visible. Life ring stored inside staff area. Basic welfare standards not met."),
      bullet("Waterfront/Drydock area: Active work zone but highly cluttered. Mooring ropes in poor condition lying on ground. Old fuel drums scattered. Open oil spillage visible on ground near generators."),

      space(),
      h2("6.2 Upgrade Recommendations — Phased Approach"),
      space(),
      h3("Phase 1 — Immediate (Within 2 Weeks, Zero Capital Required)"),
      numBullet("Designate asset parking bays — paint/mark lines on ground using spraypaint. One bay per machine. Label each bay with Fleet ID."),
      numBullet("Create a SCRAP ZONE — clearly demarcate one corner for decommissioned/scrap items. Move all identified scrap there immediately."),
      numBullet("Remove bed from office. Staff accommodation must be separate from operational workspace."),
      numBullet("Close and lock the electrical panel in small workshop. Engage licensed electrician for inspection within 1 week."),
      numBullet("Move LPG cylinders to designated open-air, locked gas storage area."),
      numBullet("Sort tool storage: one wall = hand tools (labelled hooks), one shelf unit = power tools, one area = consumables."),
      numBullet("Introduce physical asset tags on every machine — WL Fleet ID, machine name, daily check card holder."),
      space(),
      h3("Phase 2 — Short-Term (1-3 Months, Moderate Investment: MVR 30,000–60,000)"),
      numBullet("Install lockable metal shelving racks in both workshops — label each shelf section by part category (filters, seals, hoses, electrical, hardware)."),
      numBullet("Acquire a basic parts bin system — 100-compartment wall-mounted bin for small parts (bolts, fittings, clips)."),
      numBullet("Install a dry-erase whiteboard (PM board) in main workshop showing each machine ID, last service, next service due — visible to all staff."),
      numBullet("Designate a clean store room for all boxed/new parts — locked, moisture-controlled."),
      numBullet("Portable oil/fuel containment drip trays under all stationary machines."),
      numBullet("Replace deteriorated mooring ropes. Label each rope with length and rated capacity."),
      space(),
      h3("Phase 3 — Medium-Term (3-6 Months, Significant Investment: MVR 100,000+)"),
      numBullet("Container conversion: Convert one 20ft shipping container into a proper parts store with full shelving, inventory system, and padlock."),
      numBullet("Separate staff welfare container: Dedicated rest area/canteen separate from operational areas — basic requirements."),
      numBullet("Paving/hardstanding: Replace gravel in main machine parking area with concrete pad to reduce ground contamination and machine access hazards."),
      numBullet("Proper drainage: Oil/water separator for workshop floor drainage."),

      space(2),
      // =============================================
      // SECTION 7: INVENTORY & CONSUMABLES
      // =============================================
      h1("7. INVENTORY DIGITISATION & FREQUENT CONSUMABLES"),

      h2("7.1 Priority Consumables — Establish Minimum Stock"),
      para("Once the physical inventory is catalogued (Phase 1/2 above), the following consumables should be held as minimum buffer stock at Thilafushi at all times, given the difficulty and lead time of Maldivian procurement:"),
      space(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 2000, 1500, 1500, 2360],
        rows: [
          tRow([hdrCell("Item",2000), hdrCell("Applicable Machines",2000), hdrCell("Min. Stock Level",1500), hdrCell("Reorder Point",1500), hdrCell("Preferred Supplier",2360)]),
          tRow([cell("Engine Oil (10W-40 / 15W-40) — 20L drums",2000), cell("All diesel engines",2000), cell("4 x 20L drums",1500), cell("2 drums remaining",1500), cell("Local marine supply / Al Dahr",2360)]),
          tRow([cell("Hydraulic Oil (ISO46 / ISO68) — 20L drums",2000,"EBF5FB"), cell("All excavators, crane, ADTs",2000,"EBF5FB"), cell("4 x 20L drums",1500,"EBF5FB"), cell("2 drums remaining",1500,"EBF5FB"), cell("Local marine supply",2360,"EBF5FB")]),
          tRow([cell("Engine Oil Filters (universal set per machine)",2000), cell("All machines",2000), cell("2x per machine type",1500), cell("1 remaining",1500), cell("IEPL / Al Dahr",2360)]),
          tRow([cell("Hydraulic Return Filters",2000,"EBF5FB"), cell("Excavators, ADTs",2000,"EBF5FB"), cell("2x per machine",1500,"EBF5FB"), cell("1 remaining",1500,"EBF5FB"), cell("IEPL / local",2360,"EBF5FB")]),
          tRow([cell("Fuel Filters",2000), cell("All diesel engines",2000), cell("2x per machine",1500), cell("1 remaining",1500), cell("Local / IEPL",2360)]),
          tRow([cell("Grease (multi-purpose, 500g cartridges)",2000,"EBF5FB"), cell("All machines",2000,"EBF5FB"), cell("24 cartridges",1500,"EBF5FB"), cell("12 remaining",1500,"EBF5FB"), cell("Any local supply",2360,"EBF5FB")]),
          tRow([cell("Coolant/Antifreeze",2000), cell("All engines",2000), cell("2 x 5L",1500), cell("1 x 5L",1500), cell("Local",2360)]),
          tRow([cell("Welding Rods (various) + MIG wire",2000,"EBF5FB"), cell("Workshop",2000,"EBF5FB"), cell("5kg per type",1500,"EBF5FB"), cell("2kg remaining",1500,"EBF5FB"), cell("Local hardware",2360,"EBF5FB")]),
          tRow([cell("Hydraulic Hose (bulk roll, 1/2\" and 3/4\")",2000), cell("All hydraulic machines",2000), cell("5m each size",1500), cell("2m remaining",1500), cell("Ex Ceylon Engineering / Malé",2360)]),
          tRow([cell("Hose Fittings (assorted BSP/JIC)",2000,"EBF5FB"), cell("All hydraulic machines",2000,"EBF5FB"), cell("Assorted set x2",1500,"EBF5FB"), cell("When any fitting used",1500,"EBF5FB"), cell("Ex Ceylon Engineering",2360,"EBF5FB")]),
          tRow([cell("Safety items (gloves, goggles, helmets x10 ea)",2000), cell("All staff",2000), cell("10 per item",1500), cell("5 remaining",1500), cell("Local hardware",2360)]),
        ]
      }),

      space(2),
      // =============================================
      // SECTION 8: SCM FRAMEWORK
      // =============================================
      h1("8. SUPPLY CHAIN MANAGEMENT FRAMEWORK"),

      h2("8.1 Current State Diagnosis"),
      bullet("All procurement currently flows through Mushthaq in Malé — no formal delegation to site."),
      bullet("Purchase requests arrive via WhatsApp, phone call, or verbal — no standard form consistently applied."),
      bullet("No differentiation between: (a) emergency repair parts, (b) routine maintenance consumables, (c) service requirements, (d) capital procurement."),
      bullet("No approved vendor list. Sourcing is ad hoc per requirement."),
      bullet("No formal goods receipt process — parts dispatched via ferry with no tracking confirmation."),
      bullet("Lead times for critical parts from overseas (India, UAE) are 2-8 weeks — with no buffer stock, every breakdown results in extended downtime."),

      space(),
      h2("8.2 Proposed SCM Framework — Three Tiers"),
      space(),
      h3("Tier 1 — Emergency Repair (CR: Critical, Same Day)"),
      para("Trigger: Machine fully grounded, work stopped. Any fault costing more than MVR 500 or requiring external procurement."),
      bullet("Operator/Mechanic identifies fault → calls Janaka immediately → Janaka calls Mushthaq within 30 minutes."),
      bullet("Janaka raises WL Emergency PR Form (WhatsApp photo of completed form acceptable) — must include: fault description, affected machine ID, estimated downtime."),
      bullet("Mushthaq validates and assigns vendor within 2 hours."),
      bullet("CFO (Nafiu) notified same day for any item exceeding MVR 5,000."),
      bullet("Parts dispatch tracked: Mushthaq confirms dispatch date, ferry booking, expected delivery date. Janaka confirms receipt."),
      space(),
      h3("Tier 2 — Scheduled Maintenance (RO: Routine, Within 7 Days)"),
      para("Trigger: Upcoming 250-hr or 500-hr service, or scheduled consumable replenishment."),
      bullet("Janaka reviews PM board every Monday. Raises Maintenance PR Form for any machine due service within 2 weeks."),
      bullet("Mushthaq batches Tier 2 PRs and places consolidated order weekly (every Tuesday)."),
      bullet("Parts received at Malé depot → dispatched to Thilafushi on LCT or ferry — 48-hr cycle."),
      bullet("Janaka signs goods receipt → scanned and filed in Document Vault."),
      space(),
      h3("Tier 3 — Capital / Major Procurement (CAPEX, Requires Director Approval)"),
      para("Trigger: Any single item or service > MVR 15,000 (approx. USD 1,000)."),
      bullet("Mushthaq prepares a one-page justification note with: problem description, options considered, recommended option, cost, lead time, revenue impact of non-procurement."),
      bullet("Submitted to CFO Nafiu and Director(s) Hameed/Hannan for decision."),
      bullet("Target decision turnaround: 48 hours for CRITICAL, 7 days for non-critical."),
      bullet("Current outstanding: USD 6,000 recon hydraulic pump (WL-HV-0007) — decision overdue by 12 days. Accruing MVR 800/day in engineer costs."),

      space(),
      h2("8.3 PR Differentiation — Three Categories"),
      space(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 2360, 2000, 3000],
        rows: [
          tRow([hdrCell("Category",2000), hdrCell("Examples",2360), hdrCell("Approval Level",2000), hdrCell("Target Turnaround",3000)]),
          tRow([cell("REPAIR PARTS (Emergency)",2000), cell("Hydraulic hose, pilot block, solenoid valve, pump, seals",2360), cell("Janaka flags, Mushthaq approves < MVR 15K; Director above",2000), cell("Same day sourcing, dispatch within 24 hrs",3000)]),
          tRow([cell("MAINTENANCE CONSUMABLES",2000,"EBF5FB"), cell("Engine oil, filters, grease, coolant, welding rods",2360,"EBF5FB"), cell("Janaka autonomy up to MVR 2,000; Mushthaq above",2000,"EBF5FB"), cell("Weekly consolidated order",3000,"EBF5FB")]),
          tRow([cell("SERVICE REQUIREMENTS",2000), cell("3rd party specialist service, engine overhaul, crane certification",2360), cell("Mushthaq + Director approval",2000), cell("Planned — minimum 2 weeks notice",3000)]),
        ]
      }),

      space(),
      h2("8.4 Approved Vendor List — Priority Vendors to Formalise"),
      bullet("Ex Ceylon Engineering (Malé) — hydraulic hose fabrication"),
      bullet("IEPL — Infra Engineers India (Mr. Hari Pilla / Mr. Venkata) — Komatsu PC350 specialist parts"),
      bullet("Al Dahr GT (Mr. Stephen / Ms. Nilusha) — marine engine parts (Yanmar)"),
      bullet("Midex / INGOT — TUG-01 PLK vessel parts"),
      bullet("ELM Engineering — PLK vessel engineering"),
      bullet("RKL Maldives — specialist materials (Teflon, etc.)"),
      bullet("Local hardware (identify top 2-3 suppliers in Thilafushi/Malé area)"),
      bullet("Rolman World / XCMG — new unit warranty and parts for WL-HV-0017"),

      space(2),
      // =============================================
      // SECTION 9: KEY ISSUES & CORRECTIVE ACTIONS
      // =============================================
      h1("9. KEY ISSUES & PRIORITISED CORRECTIVE ACTIONS"),
      space(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [400, 2000, 1200, 800, 2160, 2800],
        rows: [
          tRow([hdrCell("#",400), hdrCell("Issue",2000), hdrCell("Asset / Area",1200), hdrCell("Priority",800), hdrCell("Corrective Action",2160), hdrCell("Owner / Timeline",2800)]),
          tRow([cell("1",400,"FFB3B3"), cell("WL-HV-0009 location UNKNOWN",2000,"FFB3B3"), cell("KOMATSU PC350",1200,"FFB3B3"), cell("CRITICAL",800,"FFB3B3"), cell("Contact Sampath AND Janaka simultaneously. Physically locate machine by 27 Apr.",2160,"FFB3B3"), cell("Mushthaq — by 27 Apr 2026",2800,"FFB3B3")]),
          tRow([cell("2",400,"FFB3B3"), cell("Hydraulic pump decision (HV-0007) — USD 6,000 — 12 days overdue. MVR 800/day accruing.",2000,"FFB3B3"), cell("WL-HV-0007",1200,"FFB3B3"), cell("CRITICAL",800,"FFB3B3"), cell("Prepare 1-page decision brief. Re-escalate to Hameed with daily cost calculation. Force decision by 27 Apr.",2160,"FFB3B3"), cell("Mushthaq → Hameed — 27 Apr",2800,"FFB3B3")]),
          tRow([cell("3",400), cell("No R&M Supervisor. Single point of failure on Janaka.",2000), cell("Organisation",1200), cell("URGENT",800,"FFE699"), cell("Post job advertisement. Target: hire within 6-8 weeks. Brief Janaka on transition.",2160), cell("Mushthaq — job post by 1 May",2800)]),
          tRow([cell("4",400,"EBF5FB"), cell("Open electrical panel in small workshop — fire/electrocution hazard.",2000,"EBF5FB"), cell("Small Workshop",1200,"EBF5FB"), cell("URGENT",800,"FFE699","EBF5FB"), cell("Engage licensed electrician for same-week inspection. Close and lock panel temporarily.",2160,"EBF5FB"), cell("Janaka — immediate/this week",2800,"EBF5FB")]),
          tRow([cell("5",400), cell("CAT 336DL x2 have no buckets — grounded.",2000), cell("WL-HV-0021/0022",1200), cell("URGENT",800,"FFE699"), cell("Source compatible buckets (quick-coupler type). Get quotes from Al Dahr and local suppliers. Budget: USD 8,000-15,000 each.",2160), cell("Mushthaq — quotation by 30 Apr",2800)]),
          tRow([cell("6",400,"EBF5FB"), cell("Work permit for Dulip Priyankara not confirmed.",2000,"EBF5FB"), cell("WL-EMP-0031",1200,"EBF5FB"), cell("URGENT",800,"FFE699","EBF5FB"), cell("Check status with HR/immigration. Do not assign to any vehicle until permit active.",2160,"EBF5FB"), cell("Mushthaq — check by 27 Apr",2800,"EBF5FB")]),
          tRow([cell("7",400), cell("No maintenance schedules for any asset. All reactive.",2000), cell("All fleet",1200), cell("HIGH",800,"FFE699"), cell("Implement PM board in workshop this week. Record last service/meter for all confirmed assets.",2160), cell("Janaka (facilitated by Mushthaq) — 1 week",2800)]),
          tRow([cell("8",400,"EBF5FB"), cell("Sumitomo SH220LC6 — 12 hrs since 2021. Condition of fluids and seals unknown.",2000,"EBF5FB"), cell("WL-HV-0020",1200,"EBF5FB"), cell("HIGH",800,"FFE699","EBF5FB"), cell("Immediate: drain and replace all fluids, check all seals and hoses. Run and test at Thilafushi before any rental commitment.",2160,"EBF5FB"), cell("Jackson/Janaka — this week",2800,"EBF5FB")]),
          tRow([cell("9",400), cell("Multiple unregistered assets at site — conveyor, DFAC truck, U50-S forklift, generators, compressor.",2000), cell("Thilafushi Yard",1200), cell("HIGH",800,"FFE699"), cell("Physical tagging exercise: identify each, assign WL ID or confirm PLK ownership. Update register within 1 week.",2160), cell("Janaka + Mushthaq — 1 week",2800)]),
          tRow([cell("10",400,"EBF5FB"), cell("Staff sleeping in office workspace.",2000,"EBF5FB"), cell("Office Area",1200,"EBF5FB"), cell("HIGH",800,"FFE699","EBF5FB"), cell("Remove bed from office. Identify separate accommodation space. If no space, arrange off-site accommodation and factor into cost.",2160,"EBF5FB"), cell("Janaka — immediate",2800,"EBF5FB")]),
          tRow([cell("11",400), cell("Drydocked blue vessel — confirm identity, ownership, ETA back to service.",2000), cell("Drydock Area",1200), cell("HIGH",800,"FFE699"), cell("Get vessel name, reg number from Janaka today. Check PLK register for PLK TUG-01 — is this the same vessel? Confirm expected drydock end date.",2160), cell("Mushthaq — confirm today",2800)]),
          tRow([cell("12",400,"EBF5FB"), cell("Vessel survey/permit certificates — all vessels missing in compliance sheet.",2000,"EBF5FB"), cell("All 4 vessels",1200,"EBF5FB"), cell("HIGH",800,"FFE699","EBF5FB"), cell("Obtain physical copies of survey certs, MPA/MNDF permits, and insurance for all 4 vessels. Enter in compliance sheet.",2160,"EBF5FB"), cell("Mushthaq — by 1 May",2800,"EBF5FB")]),
          tRow([cell("13",400), cell("No sales/rental activity. Business model inactive.",2000), cell("Commercial",1200), cell("STRATEGIC",800,"D9D9D9"), cell("Activate rental operations: (a) identify 3-5 active prospects in Malé/Thilafushi market, (b) prepare rate card, (c) assign rental coordinator role.",2160), cell("Mushthaq + Directors — by 15 May",2800)]),
        ]
      }),

      space(2),
      // =============================================
      // SECTION 10: STRATEGIC REORIENTATION
      // =============================================
      h1("10. STRATEGIC REORIENTATION — WELL LAND'S ORIGINAL MANDATE"),
      para("Well Land Investment was established as a heavy machinery and vessel rental company. The current reality — where all functional assets are deployed to Antrac project sites, the Thilafushi base is unmanned in terms of sales capacity, and the only usable machine is tied to a single operator who also handles electrical work — represents a complete departure from the founding mandate."),
      space(),
      para("The following structural changes are required to restore Well Land as a revenue-generating rental operation:"),
      space(),
      h3("1. Establish the R&M Department First"),
      para("Without a functioning maintenance department, no machine can be confidently offered to a rental client. The R&M Supervisor hire is the single most important action. Target: Sri Lankan or Indian national, 10+ years heavy equipment maintenance, diesel/hydraulic background. Reporting to Mushthaq."),
      space(),
      h3("2. Quarantine Thilafushi Base Machines for Rental"),
      para("Designate WL-HV-0017 (XCMG XE60WG), WL-HV-0018 (PC70), WL-HV-0019 (CAT 323D3), WL-HV-0020 (Sumitomo — after recommissioning), and WL-HV-0024 (CAT 745C) as RENTAL-ELIGIBLE fleet. These must not be dispatched to project sites without formal rental agreement and/or Director approval."),
      space(),
      h3("3. Create a Rental Rate Card"),
      para("Prepare a one-page rate card for all Thilafushi-based machines: daily, weekly, and monthly rates. Include operator rates separately (with and without operator). Basis: comparable market rates in Maldives, factoring in depreciation and maintenance cost. Submit to Directors for approval by 15 May 2026."),
      space(),
      h3("4. Assign Sales Responsibility"),
      para("Mushthaq currently covers 40% firefighting, 25% expediting — leaving 5% for strategic/sales work. This is insufficient to grow the rental business. Either: (a) hire a part-time Sales Coordinator on commission basis, or (b) task Janaka with initial client outreach in Thilafushi industrial zone where potential rental customers are co-located."),
      space(),
      h3("5. Reduce Project-Site Downtime Losses"),
      para("Every day a machine is grounded at a project site without a rental agreement is pure revenue loss. The four Komatsu PC350s represent the most critical repair backlog. A disciplined repair-vs-replace decision framework must be applied — machines beyond economic repair should be stripped for parts and sold for scrap, freeing capital and reducing maintenance burden."),

      space(2),
      divider(),
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [new TextRun({ text: "END OF REPORT", bold: true, size: 20, font: "Arial", color: "1B3A6B" })]
      }),
      para("Prepared by: Ali Mushthaq Ibrahim, General Manager — Well Land Investment Pte. Ltd. (WL-EMP-0030)"),
      para("Date: 25 April 2026  |  Distribution: Internal Management Only  |  Classification: Restricted"),
      para("Next Review: 9 May 2026 (2 weeks from visit date)"),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/WL_Thilafushi_SiteVisit_25Apr2026.docx', buf);
  console.log('Done');
}).catch(e => { console.error(e); process.exit(1); });
