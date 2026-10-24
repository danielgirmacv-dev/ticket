#!/usr/bin/env python3
"""
Generate all EEC eSupport documentation diagrams as high-resolution PNGs.
Uses only PIL (Pillow). Output: docs/assets/technical/diagrams/rendered/
"""
from __future__ import annotations
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

DOCS = Path(__file__).resolve().parent
OUT  = DOCS / "assets" / "technical" / "diagrams" / "rendered"
OUT.mkdir(parents=True, exist_ok=True)

# Design tokens
NAVY   = (15, 40, 80)
BLUE   = (30, 90, 200)
LBLUE  = (60, 130, 230)
STEEL  = (80, 110, 160)
TEAL   = (20, 150, 160)
GREEN  = (30, 160, 100)
ORANGE = (220, 120, 30)
RED    = (200, 60, 60)
GRAY   = (100, 110, 130)
LGRAY  = (200, 210, 225)
BGWHITE= (245, 248, 255)
WHITE  = (255, 255, 255)
BLACK  = (20, 25, 35)
GRIDCLR= (220, 228, 240)

def font(size, bold=False):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def new_canvas(w, h, bg=BGWHITE):
    img = Image.new("RGB", (w, h), bg)
    return img, ImageDraw.Draw(img)

def save(img, name):
    p = OUT / name
    img.save(p, dpi=(200, 200))
    print(f"  ✓  {p.name}")

def rr(d, xy, r, fill, outline=None, width=2):
    d.rounded_rectangle(xy, radius=r, fill=fill, outline=outline or fill, width=width)

def ctext(d, cx, cy, text, fnt, color=BLACK, mw=0):
    lines = []
    if mw > 0:
        words, line = text.split(), []
        for w in words:
            test = " ".join(line + [w])
            bb = d.textbbox((0,0), test, font=fnt)
            if bb[2]-bb[0] > mw and line:
                lines.append(" ".join(line)); line = [w]
            else: line.append(w)
        if line: lines.append(" ".join(line))
    else:
        lines = text.split("\n")
    bb = d.textbbox((0,0), "Ag", font=fnt)
    lh = bb[3]-bb[1]+4
    y = cy - (lh*len(lines))//2
    for ln in lines:
        bb = d.textbbox((0,0), ln, font=fnt)
        d.text((cx-(bb[2]-bb[0])//2, y), ln, font=fnt, fill=color)
        y += lh

def arr(d, x0, y0, x1, y1, color=NAVY, width=2, head=10):
    d.line([(x0,y0),(x1,y1)], fill=color, width=width)
    angle = math.atan2(y1-y0, x1-x0)
    for da in [0.5,-0.5]:
        ax = x1 - head*math.cos(angle-da)
        ay = y1 - head*math.sin(angle-da)
        d.line([(x1,y1),(int(ax),int(ay))], fill=color, width=width)

def banner(d, w, text, sub=""):
    d.rectangle([0,0,w,70], fill=NAVY)
    d.rectangle([0,70,w,74], fill=BLUE)
    ctext(d, w//2, 30, text, font(22,True), WHITE)
    if sub: ctext(d, w//2, 56, sub, font(13), LGRAY)
    return 90

def box(d, cx, cy, label, color=BLUE, bw=200, bh=52):
    rr(d, [cx-bw//2, cy-bh//2, cx+bw//2, cy+bh//2], 8, color, WHITE, 2)
    ctext(d, cx, cy, label, font(12,True), WHITE, mw=bw-16)
    return cy+bh//2

def vbox(d, cx, cy, label, color=BLUE, bw=200, bh=52):
    box(d, cx, cy, label, color, bw, bh)
    return cy+bh//2

# ─── Diagram 1: Request Lifecycle ───────────────────────────────────────────
def d1_request_lifecycle():
    W,H = 1600,800
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "HTTP Request Lifecycle", "Client → Apache → Laravel → Database")
    actors = [
        ("Client\n(Browser)", BLUE), ("Apache", STEEL), ("index.php", NAVY),
        ("Laravel\nKernel", TEAL), ("auth:sanctum\nMiddleware", ORANGE),
        ("Controller", GREEN), ("Service\nLayer", BLUE), ("Database", RED)
    ]
    cols = len(actors)
    col_w = W//(cols+1)
    col_xs = [(i+1)*col_w for i in range(cols)]
    bw,bh = 140,52
    ay = y0+10
    for i,(label,color) in enumerate(actors):
        cx = col_xs[i]
        rr(d,[cx-bw//2,ay,cx+bw//2,ay+bh],8,color,WHITE,2)
        ctext(d,cx,ay+bh//2,label,font(11,True),WHITE,mw=bw-8)
    life_top = ay+bh; life_bot = H-30
    for cx in col_xs:
        d.line([(cx,life_top),(cx,life_bot)], fill=LGRAY, width=2)
    steps = [
        (0,1,"HTTP Request",False),(1,2,"Forward request",False),
        (2,3,"Bootstrap app",False),(3,4,"Validate Bearer token",False),
        (4,5,"Route to controller",False),(5,6,"Business logic",False),
        (6,7,"Eloquent query",False),(7,6,"Query results",True),
        (6,5,"Processed data",True),(5,0,"JSON Response",True)
    ]
    sf = font(12)
    sy = life_top+30
    gap = (life_bot-sy-10)//len(steps)
    for src,dst,label,ret in steps:
        sx,dx = col_xs[src],col_xs[dst]
        color = TEAL if ret else NAVY
        arr(d,sx,sy,dx,sy,color)
        mid_x=(sx+dx)//2
        bb=d.textbbox((0,0),label,font=sf)
        d.text((mid_x-(bb[2]-bb[0])//2,sy-18),label,font=sf,fill=GRAY if ret else BLACK)
        sy+=gap
    save(img,"01-request-lifecycle.png")

# ─── Diagram 2: ERD ─────────────────────────────────────────────────────────
def d2_erd():
    W,H = 1800,1100
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Entity-Relationship Diagram", "EEC eSupport — Database Schema (17 Tables)")

    def entity(cx, cy, name, fields, color=BLUE):
        ew,rh,hh = 230,24,36
        total_h = hh + len(fields)*rh + 8
        x0,ey0 = cx-ew//2, cy-total_h//2
        rr(d,[x0,ey0,x0+ew,ey0+hh],6,color,WHITE,2)
        ctext(d,cx,ey0+hh//2,name,font(13,True),WHITE)
        d.rounded_rectangle([x0,ey0+hh,x0+ew,ey0+total_h],radius=6,fill=WHITE,outline=color,width=2)
        ry2 = ey0+hh+4
        for (ft,fn) in fields:
            d.text((x0+6,ry2),ft,font=font(9),fill=STEEL)
            bb=d.textbbox((0,0),fn,font=font(10))
            d.text((x0+ew-(bb[2]-bb[0])-6,ry2),fn,font=font(10),fill=BLACK)
            ry2+=rh
        return (x0,ey0,x0+ew,ey0+total_h)

    def rel(b1,b2,side1="right",side2="left",label=""):
        if side1=="right": p1=((b1[2]),(b1[1]+b1[3])//2)
        elif side1=="bottom": p1=((b1[0]+b1[2])//2,b1[3])
        else: p1=((b1[0]+b1[2])//2,b1[1])
        if side2=="left": p2=(b2[0],(b2[1]+b2[3])//2)
        elif side2=="top": p2=((b2[0]+b2[2])//2,b2[1])
        else: p2=((b2[0]+b2[2])//2,b2[3])
        d.line([p1,p2],fill=LGRAY,width=2)
        if label:
            mx=(p1[0]+p2[0])//2; my=(p1[1]+p2[1])//2
            bb=d.textbbox((0,0),label,font=font(9))
            tw=bb[2]-bb[0]
            d.rectangle([mx-tw//2-2,my-8,mx+tw//2+2,my+8],fill=BGWHITE)
            d.text((mx-tw//2,my-7),label,font=font(9),fill=STEEL)

    users_b   = entity(260,310,"users",[("BIGINT PK","id"),("VARCHAR","name"),("VARCHAR UK","email"),("ENUM","status")],NAVY)
    profiles_b= entity(260,620,"profiles",[("UUID PK","id"),("BIGINT FK","user_id"),("VARCHAR","phone"),("ENUM","support_category"),("INT","telegram_chat_id"),("UUID FK","location_id")],BLUE)
    assets_b  = entity(700,310,"assets",[("UUID PK","id"),("VARCHAR","name"),("ENUM","type"),("VARCHAR UK","serial_number"),("ENUM","status"),("UUID FK","assigned_to")],TEAL)
    tickets_b = entity(1150,500,"maintenance_tickets",[("UUID PK","id"),("VARCHAR","title"),("ENUM","status"),("ENUM","priority"),("UUID FK","asset_id"),("UUID FK","requester_id"),("UUID FK","assigned_technician_id"),("INT","feedback_rating")],RED)
    sched_b   = entity(700,720,"maintenance_schedules",[("UUID PK","id"),("UUID FK","asset_id"),("ENUM","frequency"),("DATE","next_run_date"),("BOOL","is_active")],STEEL)
    notif_b   = entity(1520,260,"notifications",[("UUID PK","id"),("BIGINT FK","user_id"),("VARCHAR","title"),("BOOL","is_read")],ORANGE)
    actlog_b  = entity(1520,560,"activity_logs",[("UUID PK","id"),("VARCHAR","action"),("VARCHAR","model_type"),("BIGINT FK","user_id")],GREEN)
    loc_b     = entity(700,960,"locations",[("UUID PK","id"),("VARCHAR","name")],GRAY)
    dept_b    = entity(1150,960,"departments",[("UUID PK","id"),("VARCHAR","name")],GRAY)
    faq_b     = entity(1520,860,"faqs",[("UUID PK","id"),("VARCHAR","question"),("BOOL","is_published")],STEEL)

    rel(users_b,profiles_b,"bottom","top","1:1 has one")
    rel(users_b,notif_b,"right","left","1:N receives")
    rel(profiles_b,tickets_b,"right","left","1:N requests")
    rel(assets_b,tickets_b,"right","top","1:N has tickets")
    rel(assets_b,sched_b,"bottom","top","1:N has schedules")
    rel(profiles_b,loc_b,"bottom","top","belongs to")
    save(img,"02-erd.png")

# ─── Diagram 3: Frontend Architecture ───────────────────────────────────────
def d3_frontend():
    W,H = 1400,880
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Frontend Component Architecture","React 18 SPA — Component & Routing Tree")
    cx=W//2

    def bx(bcx,bcy,label,color=BLUE,bw=200,bh=46):
        rr(d,[bcx-bw//2,bcy-bh//2,bcx+bw//2,bcy+bh//2],8,color,WHITE,2)
        ctext(d,bcx,bcy,label,font(12,True),WHITE,mw=bw-16)

    def conn(x0,y0_,x1,y1_): arr(d,x0,y0_,x1,y1_,GRAY,2,8)

    root_y = y0+50
    bx(cx,root_y,"App.tsx (Root Provider)",NAVY,260,50)

    prov_y = root_y+110
    provs = [(240,"QueryClientProvider\n(TanStack Query)",TEAL),(490,"BrowserRouter\n(React Router)",BLUE),
             (780,"TooltipProvider\n(Radix UI)",STEEL),(1060,"Toaster/Sonner\n(Notifications)",ORANGE)]
    for px,label,color in provs:
        conn(cx,root_y+25,px,prov_y-23); bx(px,prov_y,label,color,195,46)

    auth_y = prov_y+120
    bx(cx,auth_y,"AuthProvider (Context)",NAVY,260,46)
    conn(490,prov_y+23,cx,auth_y-23)

    ses_y = auth_y+110
    bx(340,ses_y,"SessionTimeoutHandler",STEEL,220,40)
    bx(850,ses_y,"Suspense + Routes",TEAL,200,40)
    conn(cx,auth_y+23,340,ses_y-20); conn(cx,auth_y+23,850,ses_y-20)

    route_y = ses_y+110
    bx(400,route_y,"/auth → Auth.tsx\n(Public Route)",ORANGE,210,46)
    bx(950,route_y,"ProtectedRoute\n(Auth Guard)",GREEN,200,46)
    conn(850,ses_y+20,400,route_y-23); conn(850,ses_y+20,950,route_y-23)

    pages_y = route_y+120
    pages = [(130,"Dashboard"),(340,"Assets.tsx"),(540,"Tickets.tsx"),
             (740,"Requests.tsx"),(940,"Reports.tsx"),(1140,"Users\n+ 12 more")]
    for px,label in pages:
        conn(950,route_y+23,px,pages_y-23); bx(px,pages_y,label,LBLUE,165,46)

    layout_y = pages_y+110
    bx(640,layout_y,"MainLayout (Sidebar + Header)",NAVY,340,46)
    for px,_ in pages: conn(px,pages_y+23,640,layout_y-23)
    bx(1200,layout_y,"ChatBot.tsx\n(Floating Widget)",TEAL,190,46)
    save(img,"03-frontend-arch.png")

# ─── Diagram 4: Auth Flow ────────────────────────────────────────────────────
def d4_auth():
    W,H = 900,900
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Authentication & Authorization Flow","Sanctum Token-Based Authentication")
    cx=W//2; bf=font(12,True); nf=font(11)

    def nd(cy,label,color=BLUE,bw=400,bh=48):
        rr(d,[cx-bw//2,cy-bh//2,cx+bw//2,cy+bh//2],10,color,WHITE,2)
        ctext(d,cx,cy,label,bf,WHITE,mw=bw-20)
        return cy+bh//2

    def dm(cy,q,bw=380,bh=60):
        pts=[(cx,cy-bh//2),(cx+bw//2,cy),(cx,cy+bh//2),(cx-bw//2,cy)]
        d.polygon(pts,fill=ORANGE,outline=WHITE)
        ctext(d,cx,cy,q,font(11,True),WHITE,mw=bw-40)
        return cy

    def darr(y0_,y1_):
        arr(d,cx,y0_,cx,y1_,NAVY,2,10)

    y=y0+20
    b=nd(y+24,"User submits credentials",NAVY); darr(b,b+20)
    b=nd(b+44,"POST /api/login",BLUE); darr(b,b+20)
    dc1=dm(b+60,"Credentials valid?")
    # No branch
    d.line([(cx+190,dc1),(cx+190,dc1+100)],fill=RED,width=2)
    arr(d,cx+190,dc1+100,cx+390,dc1+100,RED)
    rr(d,[cx+390,dc1+80,cx+560,dc1+120],6,RED,WHITE,2)
    d.text((cx+395,dc1+90),"401 Unauthorized",font=nf,fill=WHITE)
    darr(dc1+30,dc1+80)
    dc2=dm(dc1+110,"User status?")
    # pending
    d.line([(cx-190,dc2),(cx-340,dc2),(cx-340,dc2+80)],fill=ORANGE,width=2)
    rr(d,[cx-500,dc2+60,cx-280,dc2+100],6,ORANGE,WHITE,2)
    d.text((cx-495,dc2+70),"422 Awaiting approval",font=nf,fill=WHITE)
    darr(dc2+30,dc2+80)
    d.text((cx+10,dc2+50),"active",font=nf,fill=GREEN)
    b=nd(dc2+104,"Create Sanctum token",GREEN); darr(b,b+20)
    b=nd(b+44,"Return token + user object",TEAL); darr(b,b+20)
    b=nd(b+44,"Client stores in localStorage",STEEL); darr(b,b+20)
    b=nd(b+44,"Authorization: Bearer TOKEN\n(all subsequent requests)",BLUE); darr(b,b+20)
    nd(b+44,"auth:sanctum middleware\nvalidates token on every request",NAVY)
    save(img,"04-auth-flow.png")

# ─── Diagram 5: Ticket Lifecycle ─────────────────────────────────────────────
def d5_ticket_lifecycle():
    W,H = 1400,880
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Ticket Lifecycle — State Machine","Maintenance Ticket Status Transitions")
    states = {
        "new":         (180, 280, GREEN,  "NEW"),
        "pending":     (480, 160, ORANGE, "PENDING\nAPPROVAL"),
        "approved":    (780, 280, TEAL,   "APPROVED"),
        "in_progress": (780, 520, BLUE,   "IN\nPROGRESS"),
        "resolved":    (1080,520, GREEN,  "RESOLVED"),
        "closed":      (1080,720, NAVY,   "CLOSED"),
        "rejected":    (480, 700, RED,    "REJECTED"),
        "cancelled":   (180, 520, GRAY,   "CANCELLED"),
    }
    R=62; lf=font(13,True); af=font(10)
    for key,(cx,cy,color,label) in states.items():
        d.ellipse([cx-R,cy-R+y0//4,cx+R,cy+R+y0//4],fill=color,outline=WHITE,width=3)
        ctext(d,cx,cy+y0//4,label,lf,WHITE,mw=R*2-10)
    transitions = [
        ("new","pending","Requires approval"),("new","in_progress","Direct assignment"),
        ("new","cancelled","Requester cancels"),("pending","approved","Manager approves"),
        ("pending","rejected","Manager rejects"),("approved","in_progress","Technician starts"),
        ("in_progress","resolved","Technician resolves"),("resolved","closed","Auto-close / admin"),
        ("resolved","in_progress","Requester reopens"),("rejected","new","Resubmit"),
    ]
    for src,dst,label in transitions:
        sx,sy,_,_ = states[src][0],states[src][1],0,0
        dx,dy,_,_ = states[dst][0],states[dst][1],0,0
        sy+=y0//4; dy+=y0//4
        angle=math.atan2(dy-sy,dx-sx)
        x0=sx+int(R*math.cos(angle)); y0b=sy+int(R*math.sin(angle))
        x1=dx-int(R*math.cos(angle)); y1=dy-int(R*math.sin(angle))
        arr(d,x0,y0b,x1,y1,STEEL,2,10)
        mx=(x0+x1)//2; my=(y0b+y1)//2
        bb=d.textbbox((0,0),label,font=af)
        tw=bb[2]-bb[0]
        d.text((mx-tw//2,my-14),label,font=af,fill=GRAY)
    save(img,"05-ticket-lifecycle.png")

# ─── Diagram 6: Notification Flow ────────────────────────────────────────────
def d6_notification():
    W,H = 1400,780
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Notification Data Flow","Multi-Channel: SMS · Telegram · Email")
    bf=font(12,True)

    def bx(bcx,bcy,label,color=BLUE,bw=220,bh=52):
        rr(d,[bcx-bw//2,bcy-bh//2,bcx+bw//2,bcy+bh//2],10,color,WHITE,2)
        ctext(d,bcx,bcy,label,bf,WHITE,mw=bw-16)

    def drum(bcx,bcy,label,color=NAVY):
        rx,ry2=60,14; ty,boy=bcy-32,bcy+32
        d.ellipse([bcx-rx,ty-ry2,bcx+rx,ty+ry2],fill=color,outline=WHITE,width=2)
        d.rectangle([bcx-rx,ty,bcx+rx,boy],fill=color,outline=color)
        d.ellipse([bcx-rx,boy-ry2,bcx+rx,boy+ry2],fill=color,outline=WHITE,width=2)
        ctext(d,bcx,bcy+5,label,font(10,True),WHITE)

    oy=y0+30
    bx(120,oy+50,"Trigger Event\n(Ticket action)",NAVY,200,52)
    arr(d,220,oy+50,320,oy+50,NAVY,2,10)
    bx(470,oy+50,"Controller\nMethod",BLUE,180,52)
    # Path 1: sync in-app
    arr(d,470,oy+76,470,oy+160,NAVY,2,10)
    bx(470,oy+210,"NotificationService\n(in-app sync)",TEAL,240,52)
    arr(d,470,oy+236,470,oy+310,NAVY,2,10)
    drum(470,oy+360,"notifications\ntable",TEAL)
    # Path 2: async queue
    arr(d,560,oy+50,750,oy+50,NAVY,2,10)
    bx(900,oy+50,"Queue::dispatch\n(async jobs)",ORANGE,230,52)
    arr(d,900,oy+76,900,oy+150,NAVY,2,10)
    drum(900,oy+200,"jobs table\n(DB queue)",ORANGE)
    arr(d,900,oy+250,900,oy+320,NAVY,2,10)
    bx(900,oy+370,"Queue Worker\nqueue:listen",NAVY,240,52)
    arr(d,900,oy+396,900,oy+460,NAVY,2,10)
    bx(900,oy+510,"SendXxxNotification\nJob executes",STEEL,240,52)
    # 3 channels
    for cx2,color,label in [(580,RED,"SmsService\n→ SMS Gateway"),(900,BLUE,"TelegramService\n→ Telegram API"),(1200,GREEN,"MicrosoftGraphService\n→ Graph API")]:
        arr(d,900,oy+536,cx2,oy+620,STEEL,2,8)
        bx(cx2,oy+670,label,color,230,52)
    # Frontend polling
    arr(d,470,oy+386,200,oy+500,TEAL,2,8)
    bx(130,oy+550,"Frontend polls\n/api/notifications",TEAL,220,52)
    save(img,"06-notification-flow.png")

# ─── Diagram 7: Deployment Architecture ──────────────────────────────────────
def d7_deployment():
    W,H = 1400,820
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Production Deployment Architecture","cPanel Apache Shared Hosting")
    bf=font(12,True)

    def bx(bcx,bcy,label,color=BLUE,bw=240,bh=52):
        rr(d,[bcx-bw//2,bcy-bh//2,bcx+bw//2,bcy+bh//2],10,color,WHITE,2)
        ctext(d,bcx,bcy,label,bf,WHITE,mw=bw-16)

    def grp(x0,y0_,x1,y1_,label,color):
        d.rectangle([x0,y0_,x1,y1_],outline=color,width=3)
        d.rectangle([x0+8,y0_-13,x0+8+len(label)*8+8,y0_+13],fill=BGWHITE)
        d.text((x0+12,y0_-10),label,font=font(11,True),fill=color)

    oy=y0+20
    d.ellipse([20,oy+10,200,oy+90],fill=LGRAY,outline=STEEL,width=2)
    ctext(d,110,oy+50,"Internet\nUsers",font(12,True),NAVY)
    arr(d,200,oy+50,300,oy+50,NAVY,3,12)
    grp(300,oy,W-20,H-30,"cPanel Shared Hosting",NAVY)
    bx(490,oy+70,"Apache Web Server",STEEL,220,48)
    # Frontend
    grp(340,oy+140,740,oy+400,"app.domain.com (Frontend)",TEAL)
    bx(540,oy+230,"React SPA Bundle\n(index.html + assets/)",TEAL,300,52)
    bx(540,oy+340,".htaccess (SPA routing)",STEEL,260,40)
    arr(d,490,oy+94,540,oy+204,NAVY,2,8)
    # Backend
    grp(780,oy+140,W-40,oy+540,"api.domain.com (Backend)",BLUE)
    bx(1060,oy+230,"Laravel 12 API\n/backend/public/index.php",BLUE,320,52)
    bx(1060,oy+340,"App Layer\n(Controllers/Services/Models)",NAVY,320,52)
    bx(880,oy+460,"SQLite/MySQL\nDatabase",GREEN,220,48)
    bx(1200,oy+460,"storage/app/public\n(Attachments)",TEAL,230,48)
    arr(d,490,oy+94,1060,oy+204,NAVY,2,8)
    arr(d,1060,oy+256,1060,oy+314,NAVY,2,8)
    arr(d,1060,oy+366,880,oy+436,NAVY,2,8)
    arr(d,1060,oy+366,1200,oy+436,NAVY,2,8)
    # Cron
    grp(340,oy+580,W-40,H-40,"Scheduled Tasks (cPanel Cron)",ORANGE)
    bx(680,oy+645,"php artisan schedule:run\n(every minute)",ORANGE,310,48)
    bx(1100,oy+645,"php artisan queue:listen\n(optional always-on)",RED,310,48)
    arr(d,1060,oy+560,1060,oy+619,NAVY,2,8)
    save(img,"07-deployment-arch.png")

# ─── Diagram 8: SMS Flow ─────────────────────────────────────────────────────
def d8_sms():
    W,H = 1100,680
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "SMS Notification Integration Flow","Ethiopian Telco Phone Normalization & HTTP Gateway")
    cx=500; bf=font(12,True); nf=font(10)

    def nd(cy,label,color=BLUE,bw=300,bh=50):
        rr(d,[cx-bw//2,cy-bh//2,cx+bw//2,cy+bh//2],10,color,WHITE,2)
        ctext(d,cx,cy,label,bf,WHITE,mw=bw-16)
        return cy+bh//2

    def darr(a,b): arr(d,cx,a,cx,b,NAVY,2,10)

    y=y0+30
    b=nd(y+25,"NotificationService.sms()",NAVY); darr(b,b+18)
    b=nd(b+43,"SendSmsNotification Job\ndispatched to queue",BLUE); darr(b,b+18)
    b=nd(b+43,"Queue Worker processes job",STEEL); darr(b,b+18)
    b=nd(b+43,"SmsService.send(phone, msg)",TEAL); darr(b,b+18)
    dm_y=b+52
    pts=[(cx,dm_y-35),(cx+160,dm_y),(cx,dm_y+35),(cx-160,dm_y)]
    d.polygon(pts,fill=ORANGE,outline=WHITE)
    ctext(d,cx,dm_y,"Driver?",font(12,True),WHITE)
    # log branch
    lx=cx-370
    d.line([(cx-160,dm_y),(lx,dm_y)],fill=GRAY,width=2)
    rr(d,[lx-100,dm_y-24,lx+100,dm_y+24],8,GRAY,WHITE,2)
    ctext(d,lx,dm_y,"Log → laravel.log",font(11,True),WHITE)
    d.text((cx-265,dm_y-18),"log",font=nf,fill=GRAY)
    # api branch
    darr(dm_y+35,dm_y+85); d.text((cx+10,dm_y+53),"api",font=nf,fill=GREEN)
    b=nd(dm_y+113,"normalizePhone()\n→ 251XXXXXXXXX format",GREEN,340,50)
    darr(b,b+18)
    b=nd(b+43,"HTTP POST → SMS Gateway API",BLUE,340,50)
    darr(b,b+18)
    nd(b+43,"Ethiopian Mobile\n(Ethio Telecom 09x / Safaricom 07x)",RED,340,50)
    # normalization note
    nx=cx+380; ny=dm_y+60
    rr(d,[nx-5,ny,nx+260,ny+110],8,(250,248,230),ORANGE,2)
    d.text((nx,ny+6),"Normalization Examples:",font=font(10,True),fill=ORANGE)
    for i,ex in enumerate(["0912345678  → 251912345678","912345678   → 251912345678","+251912345678 → 251912345678","251912345678  → (pass-thru)"]):
        d.text((nx,ny+22+i*20),ex,font=font(9),fill=BLACK)
    save(img,"08-sms-flow.png")

# ─── Diagram 9: Telegram Flow ────────────────────────────────────────────────
def d9_telegram():
    W,H = 1300,720
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Telegram Integration Flow","Account Linking & Notification Dispatch")
    bf=font(12,True)

    def bx(bcx,bcy,label,color=BLUE,bw=300,bh=50):
        rr(d,[bcx-bw//2,bcy-bh//2,bcx+bw//2,bcy+bh//2],10,color,WHITE,2)
        ctext(d,bcx,bcy,label,bf,WHITE,mw=bw-16)

    lx,rx = 340,960
    d.rectangle([50,y0+15,640,H-20],fill=(230,240,255),outline=BLUE,width=2)
    d.text((60,y0+22),"Account Linking Flow",font=font(12,True),fill=NAVY)
    d.rectangle([680,y0+15,W-30,H-20],fill=(225,255,235),outline=GREEN,width=2)
    d.text((690,y0+22),"Notification Dispatch Flow",font=font(12,True),fill=NAVY)

    link_nodes = [
        (y0+85,"User requests\nTelegram linking",TEAL),(y0+185,"POST /api/telegram/\ngenerate-link",BLUE),
        (y0+285,"Token cached 15 min\n(DB cache)",STEEL),(y0+375,"Deep link: t.me/bot?start=TOKEN",ORANGE),
        (y0+465,"User clicks → opens\nTelegram bot",NAVY),(y0+555,"Bot /start TOKEN →\nPOST /api/telegram/webhook",TEAL),
        (y0+645,"verifyAndLinkChatId()\nchat_id saved to profile",GREEN),
    ]
    prev=None
    for ny,label,color in link_nodes:
        bx(lx,ny,label,color,290,50)
        if prev: arr(d,lx,prev+25,lx,ny-25,NAVY,2,8)
        prev=ny

    notif_nodes = [
        (y0+100,"Queue Job triggered\n(ticket action)",NAVY),(y0+220,"TelegramService\n.sendMessage(chat_id,text)",TEAL),
        (y0+360,"POST api.telegram.org\n/bot{TOKEN}/sendMessage",BLUE),(y0+490,"Message delivered\nto Telegram app",GREEN),
        (y0+600,"User receives\nnotification",ORANGE),
    ]
    prev=None
    for ny,label,color in notif_nodes:
        bx(rx,ny,label,color,290,50)
        if prev: arr(d,rx,prev+25,rx,ny-25,NAVY,2,8)
        prev=ny

    save(img,"09-telegram-flow.png")

# ─── Diagram 10: Microsoft Graph Email ───────────────────────────────────────
def d10_graph():
    W,H = 960,740
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Microsoft Graph Email Integration","OAuth2 Client Credentials — Microsoft 365 Mail")
    cx=W//2; bf=font(12,True); nf=font(10)

    def nd(cy,label,color=BLUE,bw=420,bh=52):
        rr(d,[cx-bw//2,cy-bh//2,cx+bw//2,cy+bh//2],10,color,WHITE,2)
        ctext(d,cx,cy,label,bf,WHITE,mw=bw-16)
        return cy+bh//2

    def darr(a,b,label=""):
        arr(d,cx,a,cx,b,NAVY,2,10)
        if label: d.text((cx+10,(a+b)//2-8),label,font=nf,fill=GRAY)

    y=y0+30
    b=nd(y+26,"Queue Job:\nSendTicketApprovalNotification",NAVY); darr(b,b+18)
    b=nd(b+44,"MicrosoftGraphService",BLUE); darr(b,b+18)
    dm_y=b+56
    pts=[(cx,dm_y-38),(cx+180,dm_y),(cx,dm_y+38),(cx-180,dm_y)]
    d.polygon(pts,fill=ORANGE,outline=WHITE)
    ctext(d,cx,dm_y,"Token cached\nin DB cache?",font(11,True),WHITE)
    # Yes branch
    yx=cx+400
    d.line([(cx+180,dm_y),(yx,dm_y)],fill=GREEN,width=2)
    d.text((cx+190,dm_y-18),"Yes",font=nf,fill=GREEN)
    rr(d,[yx-110,dm_y-24,yx+110,dm_y+24],8,GREEN,WHITE,2)
    ctext(d,yx,dm_y,"Use cached\naccess token",font(11,True),WHITE)
    arr(d,yx,dm_y+24,yx,dm_y+90,GREEN,2,8)
    arr(d,yx,dm_y+90,cx+30,dm_y+160,GREEN,2,8)
    # No branch
    darr(dm_y+38,dm_y+98,"No")
    b=nd(dm_y+130,"POST login.microsoftonline.com\n/oauth2/v2.0/token\n(client_credentials grant)",STEEL,460,62)
    darr(b,b+18)
    b=nd(b+44,"Cache token for 55 minutes\n(DB cache driver)",TEAL); darr(b,b+18)
    b=nd(b+44,"POST graph.microsoft.com\n/v1.0/users/{sender}/sendMail",BLUE,460,52); darr(b,b+18)
    nd(b+44,"Email delivered to recipient\n(via Microsoft 365)",GREEN)
    save(img,"10-graph-email-flow.png")

# ─── Diagram 11: RBAC ────────────────────────────────────────────────────────
def d11_rbac():
    W,H = 1200,780
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Role-Based Access Control (RBAC)","Spatie Permission — Roles & Authorization Layers")
    roles=[("super_admin",NAVY),("admin",BLUE),("manager",TEAL),("technician",GREEN),("requester",ORANGE)]
    perms=["manage users","approve users","manage tickets","assign tickets",
           "transfer tickets","view reports","manage assets","manage FAQs","submit tickets","view own tickets"]
    perms_by_role={
        "super_admin":set(perms),"admin":{"approve users","manage tickets","assign tickets","transfer tickets","view reports","manage assets","manage FAQs"},
        "manager":{"manage tickets","assign tickets","transfer tickets","view reports"},
        "technician":{"manage tickets","view reports"},"requester":{"submit tickets","view own tickets"}
    }
    rx=180; ry_start=y0+60
    d.text((rx-80,ry_start-30),"Roles",font=font(13,True),fill=NAVY)
    role_boxes={}
    for i,(role,color) in enumerate(roles):
        cy=ry_start+i*120
        rr(d,[rx-110,cy-28,rx+110,cy+28],8,color,WHITE,2)
        ctext(d,rx,cy,role,font(12,True),WHITE)
        role_boxes[role]=(rx+110,cy)
    px=600; perm_boxes={}
    d.text((px-100,ry_start-30),"Permissions",font=font(13,True),fill=BLUE)
    for i,perm in enumerate(perms):
        cy=ry_start+i*64
        rr(d,[px-140,cy-18,px+140,cy+18],6,LGRAY,STEEL,1)
        ctext(d,px,cy,perm,font(11),NAVY)
        perm_boxes[perm]=(px-140,cy)
    # connections
    for role,rperms in perms_by_role.items():
        rex,rey=role_boxes[role]
        for perm in rperms:
            if perm in perm_boxes:
                px_,py_=perm_boxes[perm]
                d.line([(rex,rey),(px_,py_)],fill=(*LGRAY,),width=1)
    # Layers column
    lx=960; layers_data=[
        (y0+90,"Layer 1\nRoute Middleware\nauth:sanctum",STEEL),(y0+240,"Layer 2\nController Role Check\nhasAnyRole(['admin',...])",BLUE),
        (y0+390,"Layer 3\nLaravel Gate / Policy\nGate::authorize('manage',...)",NAVY),(y0+540,"Layer 4\nSpatie Permission\nhasPermissionTo(...)",TEAL),
    ]
    d.text((lx-140,y0+55),"Auth Layers",font=font(13,True),fill=NAVY)
    prev=None
    for ly,label,color in layers_data:
        rr(d,[lx-140,ly-48,lx+140,ly+48],10,color,WHITE,2)
        ctext(d,lx,ly,label,font(10),WHITE,mw=260)
        if prev: arr(d,lx,prev+48,lx,ly-48,LGRAY,1,6)
        prev=ly
    save(img,"11-rbac.png")

# ─── Diagram 12: Report Flow ─────────────────────────────────────────────────
def d12_report():
    W,H = 1200,680
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Report Data Flow","Performance Analytics & CSV Export")
    bf=font(12,True)
    def bx(bcx,bcy,label,color=BLUE,bw=300,bh=50):
        rr(d,[bcx-bw//2,bcy-bh//2,bcx+bw//2,bcy+bh//2],10,color,WHITE,2)
        ctext(d,bcx,bcy,label,bf,WHITE,mw=bw-16)
    d.line([(600,y0+20),(600,H-20)],fill=LGRAY,width=2)
    ctext(d,600,y0+15,"Two Export Paths",font(10),GRAY)
    lnodes=[(y0+55,"Admin opens Reports page",NAVY),(y0+155,"GET /api/reports/performance\n(date range filters)",BLUE),
            (y0+275,"ReportController\n(DB aggregations)",TEAL),(y0+390,"maintenance_tickets\nGROUP BY / COUNT / AVG",GREEN),
            (y0+490,"JSON: summary, by_status,\nby_priority, technician_stats",STEEL),(y0+600,"Recharts: Bar/Line/Pie charts",ORANGE)]
    prev=None
    for ny,label,color in lnodes:
        bx(320,ny,label,color,280,50)
        if prev: arr(d,320,prev+25,320,ny-25,NAVY,2,8)
        prev=ny
    rnodes=[(y0+155,"GET /api/reports/export/tickets\n(CSV download)",BLUE),(y0+275,"ReportController::exportTickets()\nStream CSV response",TEAL),
            (y0+390,"maintenance_tickets\n+ JOIN profiles",GREEN),(y0+490,"Stream CSV headers\n+ data rows",RED),(y0+600,"Browser download dialog (.csv)",ORANGE)]
    arr(d,320,y0+80,880,y0+130,GRAY,2,8)
    prev=None
    for ny,label,color in rnodes:
        bx(880,ny,label,color,280,50)
        if prev: arr(d,880,prev+25,880,ny-25,NAVY,2,8)
        prev=ny
    save(img,"12-report-flow.png")

# ─── Diagram 13: Testing Pyramid ─────────────────────────────────────────────
def d13_pyramid():
    W,H = 980,660
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Testing Strategy — Test Pyramid","EEC eSupport QA Approach")
    cx=W//2; bf=font(13,True); sf=font(11)
    tiers=[
        (180,130,y0+50,RED,"E2E Tests\n(Playwright / Cypress)","Critical User Journeys — 10%"),
        (480,160,y0+180,ORANGE,"Feature & Integration Tests\n(Laravel HTTP / DB / Mocks)","API Contracts & Workflows — 30%"),
        (780,180,y0+340,GREEN,"Unit Tests\n(PHPUnit / Vitest)","Business Logic, Services, Utilities — 60%"),
    ]
    for tw,th,yt,color,label,sub in tiers:
        bw=tw+int(th*0.8)
        pts=[(cx-tw//2,yt),(cx+tw//2,yt),(cx+bw//2,yt+th),(cx-bw//2,yt+th)]
        d.polygon(pts,fill=color,outline=WHITE)
        ctext(d,cx,yt+th//2-12,label,bf,WHITE,mw=tw+80)
        ctext(d,cx,yt+th//2+20,sub,sf,WHITE,mw=bw-40)
    arr(d,cx+420,y0+520,cx+420,y0+60,GREEN,2,10)
    d.text((cx+428,y0+280),"More\nCoverage",font=font(10),fill=GREEN)
    arr(d,cx-420,y0+60,cx-420,y0+520,RED,2,10)
    d.text((cx-510,y0+280),"More\nCost\n& Time",font=font(10),fill=RED)
    lg_y=H-50; nf=font(10)
    for i,(c,t) in enumerate([(GREEN,"Unit (60%)"),(ORANGE,"Integration (30%)"),(RED,"E2E (10%)")]):
        lx2=80+i*280
        d.ellipse([lx2,lg_y,lx2+14,lg_y+14],fill=c)
        d.text((lx2+20,lg_y-1),t,font=nf,fill=BLACK)
    save(img,"13-testing-pyramid.png")

# ─── Diagram 14: Test Coverage Gap Bar Chart ──────────────────────────────────
def d14_coverage():
    W,H = 1200,620
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Test Coverage Gap Analysis","Current Implementation vs Required Coverage")
    modules=[
        ("Authentication & RBAC",0,100,"Critical"),("Ticket Lifecycle",0,100,"Critical"),
        ("Asset Management",0,95,"High"),("Approval Workflow",0,90,"High"),
        ("Notification Engine",10,90,"High"),("Console Commands",0,70,"Medium"),
        ("Frontend UI",0,70,"Medium"),("SMS Phone Normalization",100,0,"Implemented"),
        ("Smoke Tests",100,0,"Implemented"),
    ]
    bax=320; bmx=W-180; rh=54; cy_start=y0+20
    sev_colors={"Critical":RED,"High":ORANGE,"Medium":TEAL,"Implemented":GREEN}
    for i,(name,impl,gap,sev) in enumerate(modules):
        by=cy_start+i*rh+8
        d.text((8,by+14),name,font=font(11),fill=BLACK)
        sc=sev_colors.get(sev,GRAY)
        bx2=bax-88
        d.rounded_rectangle([bx2,by+12,bx2+74,by+32],radius=6,fill=sc,outline=sc)
        bb=d.textbbox((0,0),sev,font=font(9))
        d.text((bx2+37-(bb[2]-bb[0])//2,by+14),sev,font=font(9),fill=WHITE)
        d.rounded_rectangle([bax,by+10,bax+bmx,by+38],radius=4,fill=LGRAY)
        if impl>0:
            iw=int(bmx*impl/100)
            d.rounded_rectangle([bax,by+10,bax+iw,by+38],radius=4,fill=GREEN)
        if gap>0:
            gw=int(bmx*gap/100)
            gx=bax+int(bmx*impl/100)
            d.rounded_rectangle([gx,by+10,gx+gw,by+38],radius=4,fill=RED)
        d.text((bax+bmx+8,by+13),f"{impl}% ✓  {gap}% ✗",font=font(10,True),fill=BLACK)
        if i<len(modules)-1:
            d.line([(8,by+rh),(W-8,by+rh)],fill=GRIDCLR,width=1)
    lg_y=H-44
    for ix,(c,t) in enumerate([(GREEN,"Implemented"),(RED,"Coverage Gap Required")]):
        lx2=80+ix*280
        d.ellipse([lx2,lg_y,lx2+14,lg_y+14],fill=c)
        d.text((lx2+20,lg_y-1),t,font=font(10),fill=BLACK)
    save(img,"14-test-coverage-gaps.png")

# ─── Diagram 15: Troubleshooting Decision Tree ───────────────────────────────
def d15_troubleshoot():
    W,H = 1400,820
    img,d = new_canvas(W,H)
    y0 = banner(d, W, "Troubleshooting Decision Tree","Common Issues — Diagnosis & Resolution")
    bf=font(11,True); nf=font(10)

    def nd(cx,cy,label,color=BLUE,bw=220,bh=46):
        rr(d,[cx-bw//2,cy-bh//2,cx+bw//2,cy+bh//2],10,color,WHITE,2)
        ctext(d,cx,cy,label,bf,WHITE,mw=bw-16)

    def dm(cx,cy,q,bw=280,bh=56):
        pts=[(cx,cy-bh//2),(cx+bw//2,cy),(cx,cy+bh//2),(cx-bw//2,cy)]
        d.polygon(pts,fill=ORANGE,outline=WHITE)
        ctext(d,cx,cy,q,font(10,True),WHITE,mw=bw-30)

    rcx=W//2; ry=y0+50
    nd(rcx,ry,"Issue Reported",NAVY,280,46)
    arr(d,rcx,ry+23,rcx,ry+90,NAVY,2,10)
    dm(rcx,ry+110,"Issue Category?")
    branches=[(175,"Login/Auth"),(450,"Ticket Issues"),(950,"Notifications"),(1220,"Performance")]
    for bx2,label in branches:
        arr(d,rcx,ry+138,bx2,ry+190,STEEL,2,8)
        nd(bx2,ry+210,label,BLUE,200,44)

    issues_map = {
        175:[("401 Unauthorized\nor access denied",ORANGE),("Check: token expired\nor status=pending",STEEL),("Fix: re-login or\nadmin approves account",GREEN)],
        450:[("Status not updating\nor wrong assignment",ORANGE),("Check: user role\nand API response",STEEL),("Fix: reassign role\nin admin panel",GREEN)],
        950:[("SMS/Email/Telegram\nnot delivered",ORANGE),("Check: queue worker\nand .env credentials",RED),("Run: queue:listen\ncheck laravel.log",STEEL),("Verify: phone/chat_id\nformat in profile",GREEN)],
        1220:[("Slow API response\nor timeout",ORANGE),("Run: config:cache\nroute:cache",STEEL),("Check: DB indexes\non tickets/profiles",GREEN)],
    }
    for bx2,issue_list in issues_map.items():
        prev=ry+232
        for ny_off,(label,color) in enumerate(issue_list):
            ny=ry+310+ny_off*110
            arr(d,bx2,prev,bx2,ny-23,NAVY,2,8)
            nd(bx2,ny,label,color,210,46)
            prev=ny+23

    save(img,"15-troubleshoot-tree.png")

if __name__ == "__main__":
    print(f"\nGenerating EEC eSupport diagrams → {OUT}\n")
    d1_request_lifecycle()
    d2_erd()
    d3_frontend()
    d4_auth()
    d5_ticket_lifecycle()
    d6_notification()
    d7_deployment()
    d8_sms()
    d9_telegram()
    d10_graph()
    d11_rbac()
    d12_report()
    d13_pyramid()
    d14_coverage()
    d15_troubleshoot()
    total = len(list(OUT.glob("*.png")))
    print(f"\n✓ All {total} diagrams generated.\n")
