import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_document():
    doc = Document()

    # Page Margins: 1 inch everywhere
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    # Styles Setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(38, 38, 38) # Charcoal

    # Document Header Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_sub = title_p.add_run("TECHNICAL SPECIFICATION & VENDOR INTEGRATION BRIEF\n")
    run_sub.font.size = Pt(10)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(16, 83, 53) # Forest Green

    run_title = title_p.add_run("Smart Door Access Control Integration\nfor Elite Study Zone Web Platform")
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(15, 23, 42) # Slate 900

    # Meta Table (Date, Project, Version, Contact)
    table_meta = doc.add_table(rows=4, cols=2)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Client / Platform Name:", "Elite Study Zone (Self-Study Space & Focus Hub)"),
        ("Live Web Application:", "https://study-place.onrender.com (Production Next.js 15 Platform)"),
        ("Document Objective:", "Hardware & Cloud API Integration Specification for Smart Lock Setup Vendor"),
        ("Target Mechanism:", "Exterior Digital Keypad (PIN Entry) + Top 600lbs EM Lock + Interior Push-to-Exit Button")
    ]
    for row_idx, (k, v) in enumerate(meta_data):
        row = table_meta.rows[row_idx]
        row.cells[0].paragraphs[0].add_run(k).bold = True
        row.cells[0].paragraphs[0].runs[0].font.size = Pt(9.5)
        row.cells[0].paragraphs[0].runs[0].font.color.rgb = RGBColor(71, 85, 105)
        row.cells[0].width = Inches(2.2)
        set_cell_background(row.cells[0], "F1F5F9")
        set_cell_margins(row.cells[0], top=80, bottom=80, left=120, right=120)

        row.cells[1].paragraphs[0].add_run(v)
        row.cells[1].paragraphs[0].runs[0].font.size = Pt(9.5)
        row.cells[1].paragraphs[0].runs[0].font.color.rgb = RGBColor(15, 23, 42)
        row.cells[1].width = Inches(4.6)
        set_cell_background(row.cells[1], "FFFFFF")
        set_cell_margins(row.cells[1], top=80, bottom=80, left=120, right=120)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 1: Executive Overview
    h1 = doc.add_heading(level=1)
    r1 = h1.add_run("1. Executive Overview & System Objective")
    r1.font.color.rgb = RGBColor(16, 83, 53)
    r1.font.bold = True

    p = doc.add_paragraph()
    p.add_run("Elite Study Zone operates a modern, premium 24/7 self-study hub with dedicated workstations. Our web platform automates seat reservations, hourly flexi-pass bookings, and subscription memberships. ")
    p.add_run("We are eliminating all physical keys, manual staff gatekeeping, and fingerprint biometric enrollment. ").bold = True
    p.add_run("Instead, our requirement is a fully automated, contactless ")
    p.add_run("Digital Keypad Access Control System ").bold = True
    p.add_run("where the entrance door is unlocked exclusively by a unique, time-bound PIN code generated dynamically by our website for each registered student.")

    # Section 2: Core Hardware & Physical Flow
    h2 = doc.add_heading(level=1)
    r2 = h2.add_run("2. Physical Door Architecture & Operational Flow")
    r2.font.color.rgb = RGBColor(16, 83, 53)
    r2.font.bold = True

    p = doc.add_paragraph()
    p.add_run("The lock setup vendor must supply and install a standard, reliable 3-point access control kit:")

    # Hardware Components Table
    table_hw = doc.add_table(rows=5, cols=3)
    table_hw.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Hardware Item", "Physical Location", "Functional Behavior"]
    for i, h in enumerate(headers):
        cell = table_hw.rows[0].cells[i]
        cell.paragraphs[0].add_run(h).bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

    hw_rows = [
        ("Smart Digital Keypad (Touch Screen, Wi-Fi / Cloud Connected)", "Exterior Wall / Door Frame (Outside)", "Student enters their 6-digit PIN. Keypad checks validity window. If valid, sends 3-5 second momentary pulse to release the EM Lock."),
        ("Electromagnetic (EM) Lock (600 lbs / 280 kg, Fail-Safe)", "Top of Door Frame (Glass / Wood / Aluminum)", "Keeps door securely locked using 12V electromagnetic force. De-energizes momentarily when unlocked via Keypad PIN or Exit Button."),
        ("Push-to-Exit Button (Heavy-Duty Stainless Steel NO/COM)", "Interior Wall (Inside Study Hall)", "Allows anyone inside to exit freely at any time. Depressing the button breaks current to the EM lock for 5 seconds without requiring a code."),
        ("Access Control Power Supply Unit (12V 5A with Battery Backup)", "Secure Electrical Cabinet / Concealed Area", "Powers keypad, EM lock, and relays. Incorporates 12V 7Ah battery backup so the door remains functional during power failures.")
    ]

    for idx, (c1, c2, c3) in enumerate(hw_rows):
        row = table_hw.rows[idx + 1]
        col_widths = [Inches(2.2), Inches(1.8), Inches(2.8)]
        bg = "F8FAFC" if idx % 2 == 0 else "FFFFFF"
        for c_i, val in enumerate([c1, c2, c3]):
            cell = row.cells[c_i]
            cell.width = col_widths[c_i]
            cell.paragraphs[0].add_run(val)
            cell.paragraphs[0].runs[0].font.size = Pt(9.5)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Operational Step by Step Flow
    p_flow = doc.add_paragraph()
    p_flow.add_run("End-to-End Operational Flow:\n").bold = True
    steps = [
        ("Step 1 (Booking & Payment): ", "Student selects an hourly slot (e.g., Today 14:00 to 18:00) or monthly plan on our website and completes Razorpay digital payment (or admin records cash)."),
        ("Step 2 (PIN Generation): ", "Our web server creates a unique 6-digit numeric PIN (e.g. 849201) bound strictly to that booking's start timestamp and end timestamp."),
        ("Step 3 (Dual Delivery): ", "Our website automatically pushes the PIN, valid slot hours, and door access instructions to the student's registered WhatsApp and Email, and displays it on their portal."),
        ("Step 4 (Hardware Sync): ", "Our website server makes an API call to the Smart Lock Cloud (Tuya / TTLock / Custom Controller) to push the temporary passcode to the physical keypad over Wi-Fi."),
        ("Step 5 (Ingress / Entry): ", "Student arrives at the study hall, types #849201# on the keypad. The EM lock unlocks for 5 seconds. If entered before or after their slot, the keypad rejects entry."),
        ("Step 6 (Egress / Exit): ", "To leave, student simply pushes the internal Exit Button. No code or phone needed.")
    ]
    for s_title, s_desc in steps:
        p_step = doc.add_paragraph(style='List Bullet')
        p_step.add_run(s_title).bold = True
        p_step.add_run(s_desc)

    # Section 3: Technical Parameters & Data We Send
    h3 = doc.add_heading(level=1)
    r3 = h3.add_run("3. Integration Data Parameters (What Our Website Sends)")
    r3.font.color.rgb = RGBColor(16, 83, 53)
    r3.font.bold = True

    p = doc.add_paragraph()
    p.add_run("Our Next.js 15 backend requires a standardized REST API (or webhook) provided by the lock vendor/platform. Upon payment confirmation, our server will dispatch the following payload:")

    # API Payload Specification Box
    code_box = doc.add_table(rows=1, cols=1)
    code_box.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_code = code_box.rows[0].cells[0]
    cell_code.width = Inches(6.8)
    set_cell_background(cell_code, "0F172A")
    set_cell_margins(cell_code, top=140, bottom=140, left=160, right=160)

    payload_text = (
        "POST /api/v1/door-lock/sync-passcode\n"
        "Host: api.lockvendor.com (or Tuya OpenAPI / TTLock Open Cloud)\n"
        "Authorization: Bearer <API_ACCESS_TOKEN>\n"
        "Content-Type: application/json\n\n"
        "{\n"
        '  "deviceId": "DEV-ESZ-DOOR-01",              // Unique ID of Entrance Keypad\n'
        '  "passcode": "849201",                      // 6-digit numeric PIN generated by website\n'
        '  "passcodeType": "TIME_LIMITED",            // Time-bound temporary pass\n'
        '  "validFrom": "2026-11-20T14:00:00+05:30",  // Slot start datetime\n'
        '  "validTo": "2026-11-20T18:00:00+05:30",    // Slot end datetime\n'
        '  "validFromEpoch": 1795163400,              // Unix timestamp for microcontroller sync\n'
        '  "validToEpoch": 1795177800,                // Unix timestamp for microcontroller sync\n'
        '  "studentName": "Arjun Kulkarni",           // Scholar Name\n'
        '  "bookingRef": "BKG-2026-984210",           // Internal booking reference\n'
        '  "maxUses": -1                              // Multiple entries allowed during slot (-1)\n'
        "}"
    )
    p_code = cell_code.paragraphs[0]
    r_code = p_code.add_run(payload_text)
    r_code.font.name = "Consolas"
    r_code.font.size = Pt(8.5)
    r_code.font.color.rgb = RGBColor(226, 232, 240)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Explanation of Parameters Table
    table_params = doc.add_table(rows=6, cols=3)
    table_params.alignment = WD_TABLE_ALIGNMENT.CENTER
    param_headers = ["Parameter Name", "Data Type", "Business Logic & Vendor Requirement"]
    for i, h in enumerate(param_headers):
        cell = table_params.rows[0].cells[i]
        cell.paragraphs[0].add_run(h).bold = True
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

    param_rows = [
        ("passcode", "String (6 Digits)", "Must be accepted by the keypad. When entered followed by '#' or '*', unlocks door. Must not collide with active PINs."),
        ("validFrom / validTo", "ISO 8601 String & Unix Epoch", "Strict boundary timestamps. The keypad must NOT allow door opening even 1 minute prior or after this window."),
        ("deviceId", "String", "The physical door unit identifier installed at the study zone entrance."),
        ("bookingRef / studentName", "String", "Displayed in the vendor's audit log and mobile app for tracking."),
        ("Revocation Action", "DELETE / Revoke API", "If a student cancels or desk curator revokes access, our server calls DELETE /passcode/{id} to immediately invalidate the code.")
    ]

    for idx, (p1, p2, p3) in enumerate(param_rows):
        row = table_params.rows[idx + 1]
        col_widths = [Inches(1.8), Inches(1.8), Inches(3.2)]
        bg = "F8FAFC" if idx % 2 == 0 else "FFFFFF"
        for c_i, val in enumerate([p1, p2, p3]):
            cell = row.cells[c_i]
            cell.width = col_widths[c_i]
            cell.paragraphs[0].add_run(val)
            cell.paragraphs[0].runs[0].font.size = Pt(9.5)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

    # Section 4: What We Want From the Lock Setup Company
    h4 = doc.add_heading(level=1)
    r4 = h4.add_run("4. Vendor Deliverables & What We Need From Them")
    r4.font.color.rgb = RGBColor(16, 83, 53)
    r4.font.bold = True

    deliverables = [
        ("1. Device Selection with Open Cloud API: ", "The vendor must recommend/install a Wi-Fi keypad access controller that supports standard public cloud APIs (e.g. Tuya Smart Open Cloud API, TTLock Open API, or eSSL Cloud). We cannot use closed, offline-only keypads that require manual hand-programming via master card."),
        ("2. Cloud Developer API Credentials: ", "The vendor must provide us with: API Endpoint Base URL, Client ID / API Key, Client Secret, and Device ID for our center door."),
        ("3. Webhook for Door Activity (Attendance Ledger): ", "When a student unlocks the door using their PIN, the vendor's cloud server should ideally trigger a webhook to our server: POST https://study-place.onrender.com/api/biometric with { studentName, seatId, action: 'Door Unlocked', timestamp }. Our admin attendance ledger auto-records this punch."),
        ("4. Offline Algorithm Support (Internet Fault-Tolerance): ", "If the center's broadband Wi-Fi disconnects, the keypad must still function. TTLock and Tuya support pre-computed cyclic time-bound algorithms that work 100% offline without internet at the lock!"),
        ("5. Hardware Installation & Safety Compliance: ", "Vendor must mount the EM lock securely with appropriate brackets (U-bracket for frameless glass or ZL-bracket for framed doors), mount the exit button at 1.2m height inside, and wire a 12V 5A power supply with battery backup.")
    ]
    for d_title, d_desc in deliverables:
        p_d = doc.add_paragraph(style='List Bullet')
        p_d.add_run(d_title).bold = True
        p_d.add_run(d_desc)

    # Section 5: Recommended Lock Setup Hardware (Available on Amazon India)
    h5 = doc.add_heading(level=1)
    r5 = h5.add_run("5. Recommended Equipment Kit (Readily Available on Amazon India)")
    r5.font.color.rgb = RGBColor(16, 83, 53)
    r5.font.bold = True

    p = doc.add_paragraph()
    p.add_run("If the vendor asks what equipment model is preferred, we recommend any of the following standard industry-proven configurations:")

    kits = [
        ("Configuration Option A (Recommended): Tuya Smart Wi-Fi Keypad + EM Lock", 
         "Keypad: Realtime / Raycube / SecurEyes Tuya Smart Touch Keypad (~Rs 2,800 on Amazon.in)\n"
         "Lock: 600 lbs (280 kg) Single Door Electromagnetic Lock with U/ZL Brackets (~Rs 2,200)\n"
         "Exit: Heavy Duty Stainless Steel Push-to-Exit Button (NO/COM) (~Rs 450)\n"
         "Power: 12V 5A UPS Power Controller with 12V Battery (~Rs 1,500)\n"
         "Integration Protocol: Tuya Developer Platform (REST API: /v1.0/devices/{device_id}/door-lock/temp-passwords)"),
        
        ("Configuration Option B: TTLock Commercial Cloud Access Controller", 
         "Keypad: TTLock Bluetooth + Wi-Fi G2 Gateway Keypad Access Controller (~Rs 4,500 on Amazon.in)\n"
         "Lock: 600 lbs EM Lock + Interior Stainless Steel Push-to-Exit Button\n"
         "Integration Protocol: TTLock Open Platform (API: /v3/keyboardPwd/add). Known for flawless offline mathematical time-slot passcodes!"),
        
        ("Configuration Option C: eSSL Standalone Controller with REST Bridge", 
         "Controller: eSSL Enterprise Access Controller with Wiegand 26/34 Keypad + Exit Button\n"
         "Integration Protocol: eSSL Cloud REST API / ZKTeco Access Bridge")
    ]

    for k_title, k_desc in kits:
        p_k = doc.add_paragraph()
        p_k.add_run(k_title + "\n").bold = True
        p_k.add_run(k_desc)
        p_k.paragraph_format.space_after = Pt(8)

    # Section 6: Emergency & Safety Rules
    h6 = doc.add_heading(level=1)
    r6 = h6.add_run("6. Safety, Power Outage & Emergency Protocols")
    r6.font.color.rgb = RGBColor(16, 83, 53)
    r6.font.bold = True

    safety_rules = [
        ("Fail-Safe Standard: ", "The EM lock must be wired as FAIL-SAFE (energized = locked, de-energized = unlocked). In a total power failure or emergency fire alarm, power cuts and the door opens freely from both sides."),
        ("Battery Backup: ", "The 12V 5A power supply must include a 12V 7Ah rechargeable sealed lead-acid battery, ensuring 4 to 8 hours of uninterrupted door operation during local grid outages."),
        ("Interior Emergency Release: ", "In addition to the push-to-exit button, a green Break-Glass Emergency Exit Switch must be installed in compliance with local commercial fire regulations.")
    ]
    for s_title, s_desc in safety_rules:
        p_s = doc.add_paragraph(style='List Bullet')
        p_s.add_run(s_title).bold = True
        p_s.add_run(s_desc)

    # Footer note
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    p_end = doc.add_paragraph()
    p_end.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_end = p_end.add_run("— END OF SPECIFICATION BRIEF —\nPrepared for Elite Study Zone Technical Handover & Vendor Alignment")
    r_end.font.size = Pt(9)
    r_end.font.italic = True
    r_end.font.color.rgb = RGBColor(100, 116, 139)

    return doc

if __name__ == "__main__":
    doc = create_document()
    
    # 1. Save to project root
    ws_path = r"c:\Users\manda\OneDrive\Desktop\anti_PROject\Elite_Study_Zone_Smart_Door_Access_Integration_Brief.docx"
    doc.save(ws_path)
    print(f"Saved to project root: {ws_path}")
    
    # 2. Save to public directory for direct download via website
    public_dir = r"c:\Users\manda\OneDrive\Desktop\anti_PROject\public"
    os.makedirs(public_dir, exist_ok=True)
    pub_path = os.path.join(public_dir, "Elite_Study_Zone_Smart_Door_Access_Integration_Brief.docx")
    doc.save(pub_path)
    print(f"Saved to public directory (Direct Download URL available): {pub_path}")
