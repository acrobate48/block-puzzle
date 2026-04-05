# -*- coding: utf-8 -*-
"""
BLOCK PUZZLE — Premium Edition
Menu anime - Skins - Themes - Animations de ligne theme-specifiques
"""
import pygame, random, sys, math
pygame.init()

# ── Layout ────────────────────────────────────────────────────────────────────
GRID_COLS = 10; GRID_ROWS = 10; CELL = 50
GRID_X = 58;  GRID_Y = 82
GRID_W = GRID_COLS * CELL; GRID_H = GRID_ROWS * CELL
HUD_X  = GRID_X + GRID_W + 18; HUD_W = 188
WIN_W  = HUD_X + HUD_W + 10    # 774
TRAY_Y = GRID_Y + GRID_H + 22; TRAY_H = 128; PIECE_CELL = 28
WIN_H  = TRAY_Y + TRAY_H + 34  # 766

# ── Thèmes ────────────────────────────────────────────────────────────────────
THEMES = [
    {"name":"JUNGLE",
     "BG":(10,25,10),"GBG":(16,38,16),"GE":(20,46,20),"GL":(8,20,8),
     "SL":(52,78,36),"SD":(6,15,6),"TR":(52,30,8),"TR2":(40,22,6),"TB":(88,52,18),
     "DC":(28,72,18),"LV":[(18,78,12),(14,68,9),(24,88,18)],"SKY":(8,20,8),
     "TM":(215,180,55),"TA":(110,215,75),"TG":(100,155,85),"GL2":(15,40,15),
     "PC":[(80,225,80),(215,195,50),(50,195,95)],"STAR":False},
    {"name":"DÉSERT",
     "BG":(52,33,8),"GBG":(72,48,12),"GE":(82,56,18),"GL":(38,23,6),
     "SL":(175,135,55),"SD":(28,16,4),"TR":(95,62,18),"TR2":(75,48,12),"TB":(195,155,45),
     "DC":(155,105,28),"LV":[(175,125,38),(155,105,28),(195,145,48)],"SKY":(45,28,6),
     "TM":(235,195,75),"TA":(235,135,38),"TG":(175,145,85),"GL2":(50,35,12),
     "PC":[(235,175,55),(215,115,38),(250,195,75)],"STAR":False},
    {"name":"OCÉAN",
     "BG":(6,16,52),"GBG":(9,23,72),"GE":(11,28,82),"GL":(4,10,38),
     "SL":(55,125,195),"SD":(3,8,32),"TR":(8,38,88),"TR2":(6,28,68),"TB":(55,155,235),
     "DC":(18,95,175),"LV":[(18,78,158),(14,98,178),(22,118,198)],"SKY":(5,13,42),
     "TM":(95,215,252),"TA":(55,195,175),"TG":(95,145,195),"GL2":(8,20,60),
     "PC":[(55,175,235),(95,215,195),(145,235,252)],"STAR":False},
    {"name":"VOLCAN",
     "BG":(28,6,4),"GBG":(42,10,6),"GE":(52,13,8),"GL":(16,4,2),
     "SL":(195,75,18),"SD":(10,3,1),"TR":(58,18,6),"TR2":(42,12,4),"TB":(215,75,18),
     "DC":(175,45,8),"LV":[(175,45,8),(195,75,18),(215,95,28)],"SKY":(22,5,3),
     "TM":(252,155,38),"TA":(252,75,28),"TG":(175,95,55),"GL2":(30,8,4),
     "PC":[(252,75,18),(252,145,38),(195,38,8)],"STAR":False},
    {"name":"NUIT",
     "BG":(7,4,23),"GBG":(11,7,36),"GE":(14,9,43),"GL":(4,2,14),
     "SL":(95,55,195),"SD":(3,1,11),"TR":(18,9,52),"TR2":(13,6,38),"TB":(115,75,215),
     "DC":(75,38,175),"LV":[(75,38,175),(58,28,155),(95,55,195)],"SKY":(5,3,18),
     "TM":(195,155,252),"TA":(145,215,252),"TG":(115,95,175),"GL2":(10,6,30),
     "PC":[(175,95,252),(95,195,252),(252,175,252)],"STAR":True},
]
COLORS = [
    (58,198,68),(198,208,38),(218,78,48),(238,138,28),
    (78,188,128),(158,58,198),(48,178,198),(238,178,58),(98,218,78),
]
SHAPES = [
    [[1]],[[1,1]],[[1],[1]],[[1,1,1]],[[1],[1],[1]],[[1,1],[1,1]],
    [[1,0],[1,0],[1,1]],[[0,1],[0,1],[1,1]],[[1,1],[1,0],[1,0]],[[1,1],[0,1],[0,1]],
    [[1,1,1],[0,1,0]],[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],[[0,1],[1,1],[0,1]],
    [[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0],[1,1],[0,1]],[[0,1],[1,1],[1,0]],
    [[1,1,1,1]],[[1],[1],[1],[1]],
    [[1,0,0],[1,0,0],[1,1,1]],[[0,0,1],[0,0,1],[1,1,1]],
    [[1,1,1],[1,0,0],[1,0,0]],[[1,1,1],[0,0,1],[0,0,1]],
    [[1,1],[1,1],[1,1]],[[1,1,1],[1,1,1]],
    [[1,0,0],[0,1,0],[0,0,1]],[[0,0,1],[0,1,0],[1,0,0]],
]
SKIN_NAMES = ["PIERRE","CRISTAL","BOIS","FEU","GLACE","NÉON"]

# ── Skins ─────────────────────────────────────────────────────────────────────
def skin_pierre(sf,col,x,y,sz,_t):
    li=tuple(min(255,v+88) for v in col); dk=tuple(max(0,v-78) for v in col)
    h3=(sz-4)//3
    pygame.draw.rect(sf,li,(x+2,y+2,sz-4,h3))
    pygame.draw.rect(sf,col,(x+2,y+2+h3,sz-4,h3))
    pygame.draw.rect(sf,tuple(max(0,v-15) for v in col),(x+2,y+2+h3*2,sz-4,sz-4-h3*2))
    pygame.draw.line(sf,li,(x+1,y+1),(x+sz-3,y+1),2)
    pygame.draw.line(sf,li,(x+1,y+1),(x+1,y+sz-3),2)
    pygame.draw.line(sf,dk,(x+1,y+sz-2),(x+sz-2,y+sz-2),2)
    pygame.draw.line(sf,dk,(x+sz-2,y+1),(x+sz-2,y+sz-2),2)
    pygame.draw.rect(sf,li,(x+3,y+3,sz//3,2))
    pygame.draw.rect(sf,li,(x+3,y+3,2,sz//4))

def skin_cristal(sf,col,x,y,sz,_t):
    c2=tuple(min(255,v+80) for v in col); face=tuple(min(255,v+130) for v in col)
    pygame.draw.rect(sf,c2,(x+1,y+1,sz-2,sz-2))
    pygame.draw.polygon(sf,face,[(x+2,y+2),(x+sz-3,y+2),(x+2,y+sz-3)])
    cx2,cy2=x+sz//2,y+sz//2; r2=sz//4
    pts=[(cx2,cy2-r2),(cx2+r2,cy2),(cx2,cy2+r2),(cx2-r2,cy2)]
    pygame.draw.polygon(sf,tuple(min(255,v+50) for v in col),pts)
    pygame.draw.polygon(sf,(255,255,255),pts,1)
    pygame.draw.rect(sf,(255,255,255),(x+3,y+3,sz//4,3))
    pygame.draw.rect(sf,(255,255,255),(x+3,y+3,3,sz//4))
    pygame.draw.rect(sf,tuple(min(255,v+60) for v in col),(x+1,y+1,sz-2,sz-2),1)

def skin_bois(sf,col,x,y,sz,_t):
    wc=tuple(max(0,min(255,int(v*0.6+55))) for v in col)
    dk=tuple(max(0,v-45) for v in wc); li2=tuple(min(255,v+30) for v in wc)
    pygame.draw.rect(sf,wc,(x+1,y+1,sz-2,sz-2))
    for i2,gy in enumerate(range(y+4,y+sz-2,5)):
        ox2=int(math.sin(gy*0.25+i2*0.8)*2)
        pygame.draw.line(sf,dk if i2%2==0 else li2,(x+2+ox2,gy),(x+sz-3+ox2,gy))
    nx,ny=x+sz-9,y+sz-9
    pygame.draw.circle(sf,dk,(nx,ny),5); pygame.draw.circle(sf,wc,(nx,ny),3)
    pygame.draw.circle(sf,li2,(nx,ny),1)
    pygame.draw.line(sf,li2,(x+1,y+1),(x+sz-3,y+1))
    pygame.draw.line(sf,dk,(x+1,y+sz-2),(x+sz-2,y+sz-2))

def skin_feu(sf,col,x,y,sz,t):
    fl=int(math.sin(t*0.008+x*0.12+y*0.08)*16)
    tip=(255, min(255,max(0,col[1]+60+fl)), max(0,min(255,30+fl)))
    mid=(min(255,max(0,col[0]+20+fl)), max(0,min(255,col[1]-40+fl//2)), max(0,min(255,col[2]-60)))
    bas=(min(255,max(0,col[0]-10)), max(0,min(255,col[1]-80)), max(0,min(255,col[2]-100)))
    h4=(sz-4)//4
    pygame.draw.rect(sf,tip,(x+2,y+2,sz-4,h4+1))
    pygame.draw.rect(sf,tuple((a+b)//2 for a,b in zip(tip,mid)),(x+2,y+2+h4,sz-4,h4))
    pygame.draw.rect(sf,mid,(x+2,y+2+h4*2,sz-4,h4))
    pygame.draw.rect(sf,bas,(x+2,y+2+h4*3,sz-4,sz-4-h4*3))
    flame=[(x+sz//2,y+3),(x+sz*3//4,y+sz//3+fl//4),(x+sz*2//3,y+sz//2),
           (x+sz//2,y+sz//3),(x+sz//3,y+sz//2),(x+sz//4,y+sz//3+fl//4)]
    pygame.draw.polygon(sf,tuple(min(255,v+50) for v in tip),flame)
    pygame.draw.circle(sf,(255,235,120),(x+sz*2//3,y+sz//3+fl//6),2)

def skin_glace(sf,col,x,y,sz,_t):
    ic=tuple(min(255,int(v*0.28+170)) for v in col)
    fr=tuple(min(255,int(v*0.15+210)) for v in col)
    pygame.draw.rect(sf,ic,(x+1,y+1,sz-2,sz-2))
    cx2,cy2=x+sz//2,y+sz//2
    for ang in range(0,360,60):
        a2=math.radians(ang); ex=cx2+int(math.cos(a2)*(sz//3)); ey=cy2+int(math.sin(a2)*(sz//3))
        pygame.draw.line(sf,fr,(cx2,cy2),(ex,ey),1)
        ex2=cx2+int(math.cos(a2+math.pi/6)*(sz//5)); ey2=cy2+int(math.sin(a2+math.pi/6)*(sz//5))
        pygame.draw.line(sf,(255,255,255),(cx2,cy2),(ex2,ey2),1)
    pygame.draw.rect(sf,(255,255,255),(x+2,y+2,sz//3,3))
    pygame.draw.rect(sf,(255,255,255),(x+2,y+2,3,sz//4))
    pygame.draw.rect(sf,tuple(min(255,v+40) for v in ic),(x+1,y+1,sz-2,sz-2),1)

def skin_neon(sf,col,x,y,sz,t):
    pulse=int(math.sin(t*0.006+x*0.04+y*0.03)*22)
    glow=tuple(min(255,v+90+pulse) for v in col); dark=tuple(max(0,v//8) for v in col)
    pygame.draw.rect(sf,dark,(x+1,y+1,sz-2,sz-2))
    pygame.draw.rect(sf,tuple(min(255,v+50+pulse//2) for v in col),(x+1,y+1,sz-2,sz-2),3)
    pygame.draw.rect(sf,glow,(x+3,y+3,sz-6,sz-6),2)
    pygame.draw.rect(sf,(255,255,255),(x+4,y+4,sz-8,sz-8),1)
    cx2,cy2=x+sz//2,y+sz//2; r2=sz//5
    pygame.draw.polygon(sf,glow,[(cx2,cy2-r2),(cx2+r2,cy2),(cx2,cy2+r2),(cx2-r2,cy2)],1)
    for cx3,cy3 in [(x+4,y+4),(x+sz-5,y+4),(x+4,y+sz-5),(x+sz-5,y+sz-5)]:
        pygame.draw.circle(sf,glow,(cx3,cy3),2)

SKIN_FNS=[skin_pierre,skin_cristal,skin_bois,skin_feu,skin_glace,skin_neon]

def draw_cell(sf,col,x,y,sz,skin,t,dimmed=False):
    if dimmed: col=tuple(max(0,v-140) for v in col)
    SKIN_FNS[skin](sf,col,x,y,sz,t)

# ── UI helpers ────────────────────────────────────────────────────────────────
def lerp_color(a,b,t):
    return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))

def shadow_rect(sf,color,rect,radius=6,shadow_off=3,shadow_alpha=90):
    s=pygame.Surface((rect.width+shadow_off,rect.height+shadow_off),pygame.SRCALPHA)
    pygame.draw.rect(s,(0,0,0,shadow_alpha),(shadow_off,shadow_off,rect.width,rect.height),border_radius=radius)
    sf.blit(s,(rect.x,rect.y))
    pygame.draw.rect(sf,color,rect,border_radius=radius)

def glow_rect(sf,color,rect,layers=3,radius=6):
    for i in range(layers,0,-1):
        exp=i*3; a=int(50*i/layers)
        r2=pygame.Rect(rect.x-exp,rect.y-exp,rect.width+exp*2,rect.height+exp*2)
        s=pygame.Surface((r2.width,r2.height),pygame.SRCALPHA)
        pygame.draw.rect(s,(*color,a),(0,0,r2.width,r2.height),border_radius=radius+exp)
        sf.blit(s,(r2.x,r2.y))

def draw_title_chars(sf,font,text,base_x,base_y,color,t,spread=0.8,amp=7,speed=0.0025):
    x=base_x
    for i,ch in enumerate(text):
        bob=int(math.sin(t*speed+i*spread)*amp)
        col2=tuple(min(255,v+int(math.sin(t*0.003+i)*15)) for v in color)
        s=font.render(ch,True,(0,0,0)); s.set_alpha(70)
        sf.blit(s,(x+3,base_y+bob+3))
        sf.blit(font.render(ch,True,col2),(x,base_y+bob))
        x+=font.render(ch,True,col2).get_width()+2

def text_width(font,text):
    return sum(font.render(c,True,(0,0,0)).get_width()+2 for c in text)

# ── Debris (animation bris de ligne) ─────────────────────────────────────────
class Debris:
    __slots__=['x','y','vx','vy','grav','drift','color','size','life','ml','is_circle','wave']
    def __init__(self,x,y,color,theme_idx):
        self.x=float(x); self.y=float(y)
        self.ml=random.randint(44,74); self.life=self.ml
        self.size=random.randint(4,13); self.wave=random.uniform(0,math.pi*2)
        if theme_idx==2:  # Océan — bulles qui montent
            self.vx=random.uniform(-1.0,1.0); self.vy=random.uniform(-4.0,-1.0)
            self.grav=-0.025; self.drift=random.uniform(-0.012,0.012)
            self.is_circle=True
            self.color=(min(255,int(color[0]*0.2+70)),min(255,int(color[1]*0.4+105)),
                        min(255,int(color[2]*0.55+140)))
        elif theme_idx==3:  # Volcan — lave qui coule
            self.vx=random.uniform(-1.2,1.2); self.vy=random.uniform(1.2,4.5)
            self.grav=0.24; self.drift=0.0; self.is_circle=False
            self.color=(min(255,int(color[0]*0.3+205)),max(0,int(color[1]*0.1+45)),
                        max(0,int(color[2]*0.05)))
        else:  # Défaut — bris
            ang=random.uniform(0,math.pi*2); spd=random.uniform(2.5,6.5)
            self.vx=math.cos(ang)*spd; self.vy=math.sin(ang)*spd-random.uniform(0,2.5)
            self.grav=0.14; self.drift=0.0; self.is_circle=random.random()<0.5
            self.color=color
    def update(self):
        self.x+=self.vx+math.sin(self.wave)*0.3; self.y+=self.vy
        self.vy+=self.grav; self.vx+=self.drift; self.wave+=0.1; self.life-=1
        return self.life>0

# ── Texte flottant ────────────────────────────────────────────────────────────
class FloatText:
    def __init__(self,text,x,y,color,font):
        self.text=text; self.x=float(x); self.y=float(y)
        self.color=color; self.font=font; self.life=72; self.ml=72
    def update(self): self.y-=0.9; self.life-=1; return self.life>0
    def draw(self,sf):
        a=int(255*self.life/self.ml)
        s=self.font.render(self.text,True,self.color); s.set_alpha(a)
        sf.blit(s,(int(self.x)-s.get_width()//2,int(self.y)))

# ── Fond procédural ───────────────────────────────────────────────────────────
def build_bg(theme_idx,seed=0):
    th=THEMES[theme_idx]; rng=random.Random(seed)
    sf=pygame.Surface((WIN_W,WIN_H))
    for y in range(WIN_H):
        c=lerp_color(th["SKY"],th["BG"],y/WIN_H)
        pygame.draw.line(sf,c,(0,y),(WIN_W,y))
    tmp=pygame.Surface((WIN_W,WIN_H),pygame.SRCALPHA)
    for _ in range(90):
        lx=rng.randint(0,WIN_W); ly=rng.randint(0,WIN_H); lr=rng.randint(8,42)
        lc=rng.choice(th["LV"]); a=rng.randint(20,65)
        pygame.draw.ellipse(tmp,(*lc,a),(lx-lr,ly-lr,lr*2,lr*2))
    for _ in range(55):
        fx=rng.randint(0,WIN_W); fy=rng.randint(0,WIN_H)
        fc=rng.choice(th["LV"]); ang=rng.uniform(0,math.pi*2); sz=rng.randint(5,15)
        pts=[(fx+int(math.cos(ang)*sz),fy+int(math.sin(ang)*sz)),
             (fx+int(math.cos(ang+2.3)*sz//2),fy+int(math.sin(ang+2.3)*sz//2)),(fx,fy)]
        pygame.draw.polygon(tmp,(*fc,75),pts)
    sf.blit(tmp,(0,0))
    for _ in range(8):
        vx=rng.randint(0,WIN_W); thick=rng.randint(1,3)
        for y in range(0,WIN_H,3):
            ox2=int(math.sin(y*0.045+rng.random()*2)*8)
            pygame.draw.circle(sf,th["DC"],(vx+ox2,y),thick)
    if th["STAR"]:
        for _ in range(200):
            sx=rng.randint(0,WIN_W); sy=rng.randint(0,WIN_H)
            br=rng.randint(100,255); pygame.draw.circle(sf,(br,br,br),(sx,sy),1)
    return sf

# ── Animations de fond par thème (appelées chaque frame) ─────────────────────
# Chaque thème a ses propres éléments animés persistants initialisés une fois.

def init_theme_fx(theme_idx, seed=0):
    """Retourne un dict d'état pour les animations de fond du thème."""
    rng = random.Random(seed)
    if theme_idx == 0:   # Jungle : feuilles qui tombent
        return {"leaves": [{"x":rng.uniform(0,WIN_W),"y":rng.uniform(0,WIN_H),
                             "vy":rng.uniform(0.4,1.2),"vx":rng.uniform(-0.3,0.3),
                             "ang":rng.uniform(0,360),"vrot":rng.uniform(-1.5,1.5),
                             "sz":rng.randint(6,16),"col":rng.choice(THEMES[0]["LV"]),
                             "wave":rng.uniform(0,math.pi*2)} for _ in range(35)]}
    elif theme_idx == 1: # Desert : grain de sable soufflés
        return {"grains": [{"x":rng.uniform(0,WIN_W),"y":rng.uniform(0,WIN_H),
                             "vx":rng.uniform(1.5,3.5),"vy":rng.uniform(-0.2,0.2),
                             "sz":rng.randint(1,4),"a":rng.randint(60,180)} for _ in range(80)],
                "dunes_t": 0.0}
    elif theme_idx == 2: # Ocean : bulles + vagues
        return {"bubbles": [{"x":rng.uniform(0,WIN_W),"y":rng.uniform(WIN_H//2,WIN_H),
                              "vy":rng.uniform(-0.5,-0.15),"vx":rng.uniform(-0.15,0.15),
                              "sz":rng.randint(2,8),"a":rng.randint(40,120),
                              "wave":rng.uniform(0,math.pi*2)} for _ in range(45)],
                "wave_off": 0.0}
    elif theme_idx == 3: # Volcan : braises qui montent
        return {"embers": [{"x":rng.uniform(0,WIN_W),"y":rng.uniform(0,WIN_H),
                             "vy":rng.uniform(-1.8,-0.5),"vx":rng.uniform(-0.4,0.4),
                             "sz":rng.randint(1,5),"life":rng.randint(0,120),"ml":120,
                             "col":rng.choice([(255,80,10),(255,140,30),(200,40,5)])} for _ in range(60)]}
    elif theme_idx == 4: # Nuit : etoiles scintillantes + aurore
        return {"stars": [{"x":rng.randint(0,WIN_W),"y":rng.randint(0,WIN_H*2//3),
                            "base_br":rng.randint(80,220),"phase":rng.uniform(0,math.pi*2),
                            "speed":rng.uniform(0.002,0.008),"sz":rng.choice([1,1,1,2])} for _ in range(220)],
                "shoot": None, "shoot_timer": rng.randint(60,200),
                "aurora_off": 0.0}
    return {}

def draw_theme_fx(screen, fx, theme_idx, t, overlay):
    """Dessine les animations de fond animées par thème."""
    overlay.fill((0,0,0,0))
    th = THEMES[theme_idx]

    if theme_idx == 0:  # ── Jungle : feuilles tombantes ─────────────────────
        for lf in fx["leaves"]:
            lf["x"] += lf["vx"] + math.sin(t*0.001+lf["wave"])*0.4
            lf["y"] += lf["vy"]
            lf["ang"] += lf["vrot"]
            lf["wave"] += 0.02
            if lf["y"] > WIN_H+20:
                lf["y"] = -20; lf["x"] = random.uniform(0,WIN_W)
            sz = lf["sz"]; ang = math.radians(lf["ang"])
            cx2,cy2 = int(lf["x"]), int(lf["y"])
            pts = [(cx2+int(math.cos(ang)*sz), cy2+int(math.sin(ang)*sz)),
                   (cx2+int(math.cos(ang+2.2)*sz//2), cy2+int(math.sin(ang+2.2)*sz//2)),
                   (cx2, cy2)]
            pygame.draw.polygon(overlay, (*lf["col"], 130), pts)
        screen.blit(overlay, (0,0))

    elif theme_idx == 1:  # ── Desert : sable + chaleur ──────────────────────
        for g in fx["grains"]:
            g["x"] = (g["x"] + g["vx"]) % WIN_W
            g["y"] += g["vy"] + math.sin(t*0.002+g["x"]*0.01)*0.15
            pygame.draw.circle(overlay, (195,155,80,g["a"]), (int(g["x"]),int(g["y"])), g["sz"])
        # Lignes de chaleur (shimmer)
        if int(t/80) % 3 == 0:
            for i in range(3):
                hy2 = int(WIN_H*0.3 + i*WIN_H*0.15 + math.sin(t*0.0015+i)*12)
                shim = pygame.Surface((WIN_W, 2), pygame.SRCALPHA)
                shim.fill((220,180,80,18))
                screen.blit(shim, (0, hy2))
        # Soleil
        sun_x = WIN_W-80; sun_y = 55
        for r2 in range(30,6,-6):
            a2 = int(15*(r2/30))
            pygame.draw.circle(overlay,(255,220,80,a2),(sun_x,sun_y),r2+12)
        pygame.draw.circle(screen,(255,215,60),(sun_x,sun_y),28)
        pygame.draw.circle(screen,(255,240,120),(sun_x,sun_y),20)
        # Rayons
        for ang in range(0,360,30):
            a3=math.radians(ang+t*0.02)
            x1=sun_x+int(math.cos(a3)*32); y1=sun_y+int(math.sin(a3)*32)
            x2=sun_x+int(math.cos(a3)*44); y2=sun_y+int(math.sin(a3)*44)
            pygame.draw.line(screen,(255,230,80),(x1,y1),(x2,y2),2)
        screen.blit(overlay, (0,0))

    elif theme_idx == 2:  # ── Ocean : bulles + vagues ───────────────────────
        # Vagues en fond (couches)
        fx["wave_off"] += 0.015
        for layer, (amp, speed, col_a, ybase) in enumerate([
            (18, 1.0, 30, WIN_H-60), (14, 1.3, 45, WIN_H-38), (10, 1.6, 70, WIN_H-18)
        ]):
            pts = [(0, WIN_H)]
            for wx in range(0, WIN_W+8, 6):
                wy = ybase + int(amp * math.sin(wx*0.012 + fx["wave_off"]*speed + layer))
                pts.append((wx, wy))
            pts.append((WIN_W, WIN_H))
            pygame.draw.polygon(overlay, (*th["DC"], col_a), pts)
        # Bulles
        for b in fx["bubbles"]:
            b["x"] += b["vx"] + math.sin(t*0.001+b["wave"])*0.3
            b["y"] += b["vy"]; b["wave"] += 0.015
            if b["y"] < -10: b["y"]=WIN_H+10; b["x"]=random.uniform(0,WIN_W)
            pygame.draw.circle(overlay,(180,230,255,b["a"]),(int(b["x"]),int(b["y"])),b["sz"])
            pygame.draw.circle(overlay,(255,255,255,b["a"]//2),(int(b["x"])-b["sz"]//3,
                                int(b["y"])-b["sz"]//3),max(1,b["sz"]//3))
        screen.blit(overlay, (0,0))

    elif theme_idx == 3:  # ── Volcan : braises + lueur ──────────────────────
        # Lueur de lave en bas
        for lh in range(40, 0, -8):
            a2 = int(35*(1-lh/40))
            lava_s = pygame.Surface((WIN_W, lh), pygame.SRCALPHA)
            lava_s.fill((220, 55, 8, a2))
            screen.blit(lava_s, (0, WIN_H-lh))
        # Ligne de lave
        lava_pts = [(0, WIN_H-20)]
        for lx in range(0, WIN_W+8, 8):
            ly2 = WIN_H-20+int(8*math.sin(lx*0.025+t*0.002))
            lava_pts.append((lx, ly2))
        lava_pts.append((WIN_W, WIN_H)); lava_pts.append((0, WIN_H))
        pygame.draw.polygon(screen, (200,45,5), lava_pts)
        pygame.draw.polygon(screen, (255,120,20), lava_pts[:len(lava_pts)-2], 2)
        # Braises
        for em in fx["embers"]:
            em["x"] += em["vx"] + math.sin(t*0.003+em["x"]*0.02)*0.5
            em["y"] += em["vy"]; em["life"] -= 1
            if em["life"] <= 0 or em["y"] < -10:
                em["x"]=random.uniform(0,WIN_W); em["y"]=WIN_H-30
                em["vy"]=random.uniform(-1.8,-0.5); em["life"]=120
            ratio = em["life"]/em["ml"]
            pygame.draw.circle(overlay,(*em["col"],int(200*ratio)),(int(em["x"]),int(em["y"])),em["sz"])
        screen.blit(overlay, (0,0))

    elif theme_idx == 4:  # ── Nuit : etoiles + aurore + shooting star ───────
        # Aurore boreale
        fx["aurora_off"] += 0.008
        for band in range(4):
            ay = int(WIN_H*0.08 + band*45 + 20*math.sin(t*0.001+band*1.2))
            aw = int(30 + 15*math.sin(t*0.0015+band*0.7))
            col_a = [(60,180,120),(80,120,220),(120,60,200),(40,160,180)][band]
            aurora_s = pygame.Surface((WIN_W, aw+40), pygame.SRCALPHA)
            for ay2 in range(aw):
                aa = int(28*(1-ay2/aw)*abs(math.sin(t*0.001+band)))
                pygame.draw.line(aurora_s,(*col_a,aa),(0,ay2),(WIN_W,ay2))
            screen.blit(aurora_s,(0, ay))
        # Etoiles scintillantes
        for st in fx["stars"]:
            br2 = int(st["base_br"]*(0.5+0.5*math.sin(t*st["speed"]+st["phase"])))
            br2 = max(20, min(255, br2))
            if st["sz"] == 1:
                pygame.draw.circle(screen,(br2,br2,br2),(st["x"],st["y"]),1)
            else:
                pygame.draw.circle(screen,(br2,br2,br2+30),(st["x"],st["y"]),2)
                pygame.draw.circle(screen,(255,255,255),(st["x"],st["y"]),1)
        # Shooting star
        fx["shoot_timer"] -= 1
        if fx["shoot_timer"] <= 0:
            fx["shoot"] = {"x":random.randint(0,WIN_W),"y":random.randint(0,WIN_H//3),
                           "vx":random.uniform(5,9),"vy":random.uniform(2,4),"life":30}
            fx["shoot_timer"] = random.randint(80,240)
        if fx["shoot"] is not None:
            s = fx["shoot"]
            s["x"]+=s["vx"]; s["y"]+=s["vy"]; s["life"]-=1
            if s["life"] > 0:
                a2 = int(220*s["life"]/30)
                pygame.draw.line(screen,(255,255,220),(int(s["x"]),int(s["y"])),
                                 (int(s["x"]-s["vx"]*4),int(s["y"]-s["vy"]*4)),2)
                pygame.draw.circle(screen,(255,255,255),(int(s["x"]),int(s["y"])),2)
            else:
                fx["shoot"] = None
        screen.blit(overlay, (0,0))

# ── Logique jeu ───────────────────────────────────────────────────────────────
def new_piece():  return {"shape":random.choice(SHAPES),"color":random.choice(COLORS)}
def new_tray():   return [new_piece(),new_piece(),new_piece()]

def can_place(grid,shape,row,col):
    for r,line in enumerate(shape):
        for c,v in enumerate(line):
            if v:
                gr,gc=row+r,col+c
                if not(0<=gr<GRID_ROWS and 0<=gc<GRID_COLS): return False
                if grid[gr][gc] is not None: return False
    return True

def place_piece(grid,shape,color,row,col):
    for r,line in enumerate(shape):
        for c,v in enumerate(line):
            if v: grid[row+r][col+c]=color

def clear_lines(grid):
    rf=[r for r in range(GRID_ROWS) if all(grid[r][c] is not None for c in range(GRID_COLS))]
    cf=[c for c in range(GRID_COLS) if all(grid[r][c] is not None for r in range(GRID_ROWS))]
    cl=set(); cl_colors={}
    for r in rf:
        for c in range(GRID_COLS): cl.add((r,c))
    for c in cf:
        for r in range(GRID_ROWS): cl.add((r,c))
    for(r,c) in cl:
        cl_colors[(r,c)]=grid[r][c]; grid[r][c]=None
    return len(rf)+len(cf),cl,cl_colors

def any_valid(grid,tray):
    for p in tray:
        if p is None: continue
        for r in range(GRID_ROWS):
            for c in range(GRID_COLS):
                if can_place(grid,p["shape"],r,c): return True
    return False

def snap_pos(mx,my,shape):
    return (my-GRID_Y)//CELL-len(shape)//2,(mx-GRID_X)//CELL-len(shape[0])//2

def spawn_particles(parts,cells,n,power,colors):
    for(r,c) in cells:
        cx2=GRID_X+c*CELL+CELL//2; cy2=GRID_Y+r*CELL+CELL//2
        for _ in range(n):
            ang=random.uniform(0,math.pi*2); spd=random.uniform(1.5,5)*power
            parts.append({"x":float(cx2),"y":float(cy2),
                          "vx":math.cos(ang)*spd,"vy":math.sin(ang)*spd-random.uniform(0,2),
                          "color":random.choice(colors),"life":random.randint(28,58),"ml":58,
                          "size":random.randint(2,int(4*power)+1),"circle":random.random()<0.5})

def spawn_debris(debris,cl_colors,theme_idx,n):
    for(r,c),color in cl_colors.items():
        if color is None: color=random.choice(COLORS)
        cx2=GRID_X+c*CELL+CELL//2; cy2=GRID_Y+r*CELL+CELL//2
        for _ in range(n):
            ox=random.randint(-CELL//4,CELL//4); oy=random.randint(-CELL//4,CELL//4)
            debris.append(Debris(cx2+ox,cy2+oy,color,theme_idx))

# ══════════════════════════════════════════════════════════════════════════════
# MENU ANIMÉ
# ══════════════════════════════════════════════════════════════════════════════
def run_menu(screen,clock,best):
    ov = pygame.Surface((WIN_W,WIN_H),pygame.SRCALPHA)

    f_title = pygame.font.SysFont("Impact",  88)
    f_sub   = pygame.font.SysFont("Impact",  36)
    f_med   = pygame.font.SysFont("Segoe UI",22,bold=True)
    f_sm    = pygame.font.SysFont("Segoe UI",16)
    f_xs    = pygame.font.SysFont("Segoe UI",13)

    sel_skin=0; sel_theme=0
    bg=build_bg(0,42)

    # Layout skin grid: 3 col × 2 row
    BTN_W=220; BTN_H=145; GAP=14
    GX=(WIN_W-(3*BTN_W+2*GAP))//2   # 43
    GY=210
    skin_rects=[pygame.Rect(GX+(i%3)*(BTN_W+GAP), GY+(i//3)*(BTN_H+GAP), BTN_W, BTN_H)
                for i in range(6)]

    # Theme strip
    TH_W=(WIN_W-80-4*10)//5; TH_H=38; TH_Y=GY+2*(BTN_H+GAP)+12
    theme_rects=[pygame.Rect(40+i*(TH_W+10), TH_Y, TH_W, TH_H) for i in range(5)]

    # Play button
    play_rect=pygame.Rect(WIN_W//2-145, TH_Y+TH_H+18, 290,62)

    # Menu background particles
    mparts=[]
    for _ in range(50):
        mparts.append({"x":random.uniform(0,WIN_W),"y":random.uniform(0,WIN_H),
                       "vx":random.uniform(-0.4,0.4),"vy":random.uniform(-1.2,-0.25),
                       "color":random.choice(COLORS),"size":random.randint(2,7),
                       "life":random.randint(0,180),"ml":180})

    # Deco blocks drifting in bg
    deco=[]
    for _ in range(14):
        deco.append({"x":random.uniform(0,WIN_W),"y":random.uniform(0,WIN_H),
                     "vx":random.uniform(-0.3,0.3),"vy":random.uniform(-0.25,0.25),
                     "color":random.choice(COLORS),"skin":random.randint(0,5),
                     "sz":random.randint(28,52)})

    running=True
    while running:
        dt=clock.tick(60); t=pygame.time.get_ticks()
        mx,my=pygame.mouse.get_pos()

        # Update particles
        for p in mparts:
            p["x"]+=p["vx"]; p["y"]+=p["vy"]; p["life"]-=1
            if p["life"]<=0 or p["y"]<-10:
                p["x"]=random.uniform(0,WIN_W); p["y"]=WIN_H+10
                p["vy"]=random.uniform(-1.2,-0.25); p["life"]=180
        for b in deco:
            b["x"]=(b["x"]+b["vx"])%WIN_W; b["y"]=(b["y"]+b["vy"])%WIN_H

        for event in pygame.event.get():
            if event.type==pygame.QUIT: pygame.quit(); sys.exit()
            if event.type==pygame.KEYDOWN:
                if event.key==pygame.K_ESCAPE: pygame.quit(); sys.exit()
                if event.key in (pygame.K_RETURN,pygame.K_SPACE): return sel_skin,sel_theme
            if event.type==pygame.MOUSEBUTTONDOWN and event.button==1:
                for i,sr in enumerate(skin_rects):
                    if sr.collidepoint(mx,my): sel_skin=i
                for i,tr in enumerate(theme_rects):
                    if tr.collidepoint(mx,my):
                        sel_theme=i; bg=build_bg(i,t)
                if play_rect.collidepoint(mx,my): return sel_skin,sel_theme

        th=THEMES[sel_theme]
        screen.blit(bg,(0,0))

        # Deco blocks (semi-transparent)
        ov.fill((0,0,0,0))
        for b in deco:
            tmp=pygame.Surface((b["sz"],b["sz"]),pygame.SRCALPHA)
            draw_cell(tmp,b["color"],0,0,b["sz"],b["skin"],t)
            tmp.set_alpha(50); screen.blit(tmp,(int(b["x"])-b["sz"]//2,int(b["y"])-b["sz"]//2))

        # Particles
        for p in mparts:
            ratio=p["life"]/p["ml"]
            pygame.draw.circle(ov,(*p["color"],int(170*ratio)),(int(p["x"]),int(p["y"])),p["size"])
        screen.blit(ov,(0,0))

        # Overlay sombre
        ov.fill((0,0,0,88)); screen.blit(ov,(0,0))

        # ── Titre animé ──────────────────────────────────────────────────────
        tw1=text_width(f_title,"BLOCK"); tw2=text_width(f_title,"PUZZLE")
        draw_title_chars(screen,f_title,"BLOCK", WIN_W//2-tw1//2, 22, th["TM"],t,amp=7)
        draw_title_chars(screen,f_title,"PUZZLE",WIN_W//2-tw2//2, 108,th["TA"],t,spread=0.9,amp=6)

        # Sous-titre
        sub=f_sub.render("— Select Your Style —",True,th["TG"])
        screen.blit(sub,(WIN_W//2-sub.get_width()//2,193))

        # ── Skin grid ─────────────────────────────────────────────────────────
        PREV=36  # preview cell size
        PREV_SHAPE=[[1,1],[1,1]]  # 2×2 pour preview

        for i,sr in enumerate(skin_rects):
            sel=(i==sel_skin); hov=sr.collidepoint(mx,my)

            # Ombre
            ss=pygame.Surface((sr.width+5,sr.height+5),pygame.SRCALPHA)
            pygame.draw.rect(ss,(0,0,0,100),(5,5,sr.width,sr.height),border_radius=14)
            screen.blit(ss,(sr.x,sr.y))

            # Fond + bordure
            if sel:   glow_rect(screen,th["TM"],sr,layers=3,radius=14)
            bg_c=tuple(min(255,v+(20 if sel else 8 if hov else 0)) for v in th["GBG"])
            pygame.draw.rect(screen,bg_c,sr,border_radius=14)
            brd=th["TM"] if sel else (th["TA"] if hov else th["DC"])
            pygame.draw.rect(screen,brd,sr,3 if sel else 1,border_radius=14)

            # Preview animé de la pièce
            pw=len(PREV_SHAPE[0])*PREV; ph=len(PREV_SHAPE)*PREV
            px=sr.x+(sr.width-pw)//2; py=sr.y+12
            for rr,line in enumerate(PREV_SHAPE):
                for cc,v in enumerate(line):
                    if v:
                        draw_cell(screen,COLORS[i%len(COLORS)],px+cc*PREV,py+rr*PREV,PREV,i,t)

            # Nom du skin
            nc=th["TM"] if sel else th["TA"]
            ns=f_med.render(SKIN_NAMES[i],True,nc)
            screen.blit(ns,(sr.centerx-ns.get_width()//2, sr.y+sr.height-ns.get_height()-10))

            # Badge sélectionné
            if sel:
                ck=f_sm.render("✓  SÉLECTIONNÉ",True,th["TM"])
                screen.blit(ck,(sr.x+8,sr.y+6))

        # ── Theme strip ────────────────────────────────────────────────────────
        tl=f_xs.render("Thème :",True,th["TG"])
        screen.blit(tl,(40,TH_Y-18))
        for i,tr in enumerate(theme_rects):
            stc=THEMES[i]; sel_t=(i==sel_theme); hov_t=tr.collidepoint(mx,my)
            if sel_t: glow_rect(screen,stc["TM"],tr,layers=2,radius=7)
            pygame.draw.rect(screen,stc["GBG"],tr,border_radius=7)
            # Dégradé décoration
            pygame.draw.rect(screen,stc["SL"],pygame.Rect(tr.x,tr.y,tr.width//2,tr.height),
                             border_radius=7)
            pygame.draw.rect(screen,stc["TM"] if sel_t else stc["DC"],tr,
                             2 if sel_t else 1,border_radius=7)
            tn=f_xs.render(stc["name"],True,stc["TM"] if sel_t else stc["TG"])
            screen.blit(tn,(tr.centerx-tn.get_width()//2,tr.centery-tn.get_height()//2))

        # ── Bouton Jouer ────────────────────────────────────────────────────────
        hov_p=play_rect.collidepoint(mx,my)
        pulse2=int(math.sin(t*0.005)*10)
        pc2=tuple(min(255,v+(35 if hov_p else 0)+pulse2) for v in th["TA"])
        glow_rect(screen,pc2,play_rect,layers=4 if hov_p else 2,radius=16)
        shadow_rect(screen,tuple(max(0,v-45) for v in th["DC"]),play_rect,radius=16)
        pygame.draw.rect(screen,pc2,play_rect,border_radius=16)
        pygame.draw.rect(screen,th["TM"],play_rect,2,border_radius=16)
        # Reflet haut
        rf_r=pygame.Rect(play_rect.x+4,play_rect.y+3,play_rect.width-8,play_rect.height//3)
        rf_s=pygame.Surface((rf_r.width,rf_r.height),pygame.SRCALPHA)
        rf_s.fill((255,255,255,30)); screen.blit(rf_s,(rf_r.x,rf_r.y))
        bt=f_med.render("▶   JOUER",True,(8,8,8) if hov_p else th["TM"])
        screen.blit(bt,(play_rect.centerx-bt.get_width()//2,play_rect.centery-bt.get_height()//2))

        hint=f_xs.render("ENTRÉE ou ESPACE pour commencer",True,th["TG"])
        screen.blit(hint,(WIN_W//2-hint.get_width()//2,play_rect.bottom+10))
        if best>0:
            bs=f_sm.render(f"RECORD : {best}",True,th["TM"])
            screen.blit(bs,(WIN_W//2-bs.get_width()//2,play_rect.bottom+28))

        pygame.display.flip()

    return sel_skin, sel_theme

# ══════════════════════════════════════════════════════════════════════════════
# BOUCLE DE JEU
# ══════════════════════════════════════════════════════════════════════════════
def main():
    screen  = pygame.display.set_mode((WIN_W,WIN_H))
    overlay = pygame.Surface((WIN_W,WIN_H),pygame.SRCALPHA)
    pygame.display.set_caption("Block Puzzle — Premium")
    clock   = pygame.time.Clock()

    f_huge  = pygame.font.SysFont("Impact",  74)
    f_big   = pygame.font.SysFont("Segoe UI",44,bold=True)
    f_med   = pygame.font.SysFont("Segoe UI",24,bold=True)
    f_sm    = pygame.font.SysFont("Segoe UI",17)
    f_xs    = pygame.font.SysFont("Segoe UI",14)
    f_float = pygame.font.SysFont("Impact",  32)

    best=0
    try:
        with open("best_score.txt") as _f: best=int(_f.read().strip())
    except Exception: pass

    while True:  # retour au menu après chaque partie
        skin_idx,theme_idx = run_menu(screen,clock,best)
        bg_surf = build_bg(theme_idx, 42)
        theme_fx = init_theme_fx(theme_idx, 42)

        SK_W=(HUD_W-6)//2; SK_H=34
        def make_skin_rects(base_y):
            return [pygame.Rect(HUD_X+(i%2)*(SK_W+5),base_y+(i//2)*(SK_H+5),SK_W,SK_H)
                    for i in range(6)]

        def reset():
            return {"grid":[[None]*GRID_COLS for _ in range(GRID_ROWS)],
                    "tray":new_tray(),"drag":None,
                    "score":0,"placed":0,"over":False,"flash":{},"combo":0,
                    "particles":[],"debris":[],"floats":[],
                    "shake":0,"shake_pw":0,
                    "screen_flash":0,"screen_flash_col":(255,255,255),
                    "cell_fill":{},"over_t":0}  # Volcano: {(r,c): float 0..1}

        state=reset()
        nonlocal_theme=[theme_idx]  # mutable ref

        running=True
        while running:
            dt=clock.tick(60); t=pygame.time.get_ticks()
            mx,my=pygame.mouse.get_pos()

            # Thème auto (part du thème choisi, change tous les 500pts)
            new_th=(theme_idx+state["score"]//500)%len(THEMES)
            if new_th!=nonlocal_theme[0]:
                nonlocal_theme[0]=new_th; bg_surf=build_bg(new_th,t)
                theme_fx=init_theme_fx(new_th,t)
                state["screen_flash"]=210; state["screen_flash_col"]=THEMES[new_th]["TM"]
            th=THEMES[nonlocal_theme[0]]

            # Décays
            for k in list(state["flash"]):
                state["flash"][k]-=dt
                if state["flash"][k]<=0: del state["flash"][k]
            state["screen_flash"]=max(0,state["screen_flash"]-5)
            for p in state["particles"]:
                p["x"]+=p["vx"]; p["y"]+=p["vy"]; p["vy"]+=0.13; p["life"]-=1
            state["particles"]=[p for p in state["particles"] if p["life"]>0]
            state["debris"]=[d for d in state["debris"] if d.update()]
            state["floats"]=[f for f in state["floats"] if f.update()]
            # Lava fill (Volcan)
            for k in list(state["cell_fill"]):
                state["cell_fill"][k]=min(1.0,state["cell_fill"][k]+0.055)
                if state["cell_fill"][k]>=1.0: del state["cell_fill"][k]
            sx,sy=0,0
            if state["shake"]>0:
                state["shake"]-=1; pw2=state["shake_pw"]
                sx=random.randint(-pw2,pw2); sy=random.randint(-pw2,pw2)

            # ── Events ──────────────────────────────────────────────────────
            for event in pygame.event.get():
                if event.type==pygame.QUIT: pygame.quit(); sys.exit()
                elif event.type==pygame.KEYDOWN:
                    if state["over"]:
                        if event.key==pygame.K_r:
                            if state["score"]>best: best=state["score"]
                            state=reset()
                        else:
                            running=False  # n'importe quelle autre touche → menu
                    else:
                        if event.key==pygame.K_ESCAPE: running=False
                        if event.key==pygame.K_r:
                            if state["score"]>best: best=state["score"]
                            state=reset()

                elif event.type==pygame.MOUSEBUTTONDOWN and event.button==1:
                    if state["over"] and pygame.time.get_ticks()-state["over_t"]>1200:
                        running=False  # clic après 1.2s → retour menu
                    else:
                        skin_rects=make_skin_rects(state.get("_skin_y",448))
                        for i2,sr in enumerate(skin_rects):
                            if sr.collidepoint(mx,my): skin_idx=i2; break
                        else:
                            if not state["over"]:
                                pw3=GRID_W//3
                                for i2,piece in enumerate(state["tray"]):
                                    if piece and pygame.Rect(GRID_X+i2*pw3,TRAY_Y,pw3,TRAY_H).collidepoint(mx,my):
                                        state["drag"]={"idx":i2}; break

                elif event.type==pygame.MOUSEBUTTONUP and event.button==1 and not state["over"]:
                    if state["drag"] is not None:
                        idx=state["drag"]["idx"]; piece=state["tray"][idx]
                        state["drag"]=None
                        if piece:
                            gr,gc=snap_pos(mx,my,piece["shape"])
                            if can_place(state["grid"],piece["shape"],gr,gc):
                                place_piece(state["grid"],piece["shape"],piece["color"],gr,gc)
                                state["tray"][idx]=None; state["placed"]+=1
                                # Lava fill (Volcan)
                                if nonlocal_theme[0]==3:
                                    for r,line in enumerate(piece["shape"]):
                                        for c,v in enumerate(line):
                                            if v: state["cell_fill"][(gr+r,gc+c)]=0.0
                                n_lines,fcells,fcols=clear_lines(state["grid"])
                                if n_lines>0:
                                    state["combo"]+=1; bonus=1+(state["combo"]-1)*0.5
                                    pts=int(n_lines*100*bonus)
                                    if n_lines==2: pts=int(350*bonus)
                                    elif n_lines>=3: pts=int(n_lines*165*bonus)
                                    state["score"]+=pts
                                    for cell in fcells: state["flash"][cell]=600
                                    # Texte flottant
                                    if fcells:
                                        cy2=GRID_Y+min(r for r,c in fcells)*CELL
                                        lbl=f"+{pts}" if n_lines<3 else f"★ +{pts} ★"
                                        state["floats"].append(FloatText(lbl,GRID_X+GRID_W//2,cy2,th["TM"],f_float))
                                    # Debris thème-spécifique
                                    nt=nonlocal_theme[0]
                                    if nt==2:    # Océan : bulles
                                        spawn_debris(state["debris"],fcols,2,10)
                                        spawn_particles(state["particles"],fcells,4,1.0,th["PC"])
                                    elif nt==3:  # Volcan : lave
                                        spawn_debris(state["debris"],fcols,3,12)
                                        spawn_particles(state["particles"],fcells,5,1.2,th["PC"])
                                    else:        # Défaut : éclats
                                        spawn_debris(state["debris"],fcols,0,8)
                                        spawn_particles(state["particles"],fcells,6 if n_lines==1 else 14,
                                                        1.0 if n_lines==1 else 1.8,th["PC"]+COLORS)
                                    if n_lines>=2: state["shake"]=12; state["shake_pw"]=3+(n_lines>=3)*4
                                    if n_lines>=2: state["screen_flash"]=80+(n_lines>=3)*100
                                    state["screen_flash_col"]=th["TM"]
                                else:
                                    state["combo"]=0
                                if all(p is None for p in state["tray"]): state["tray"]=new_tray()
                                if not any_valid(state["grid"],state["tray"]):
                                    state["over"]=True; state["over_t"]=pygame.time.get_ticks()
                                    if state["score"]>best:
                                        best=state["score"]
                                        try:
                                            with open("best_score.txt","w") as _f: _f.write(str(best))
                                        except Exception: pass

            # ── Rendu ────────────────────────────────────────────────────────
            screen.blit(bg_surf,(sx,sy))
            draw_theme_fx(screen, theme_fx, nonlocal_theme[0], t, overlay)

            # Cadre grille
            b=7
            shadow_rect(screen,th["SD"],
                pygame.Rect(GRID_X-b+sx,GRID_Y-b+sy,GRID_W+b*2,GRID_H+b*2),radius=6,shadow_off=5)
            pygame.draw.rect(screen,th["SL"],(GRID_X-b+sx,GRID_Y-b+sy,GRID_W+b*2,GRID_H+b*2),border_radius=5)
            pygame.draw.rect(screen,th["GBG"],(GRID_X+sx,GRID_Y+sy,GRID_W,GRID_H))

            # Cellules
            for r in range(GRID_ROWS):
                for c in range(GRID_COLS):
                    x=GRID_X+c*CELL+sx; y=GRID_Y+r*CELL+sy
                    color=state["grid"][r][c]; ft=state["flash"].get((r,c),0)
                    if ft>0:
                        ratio=ft/600
                        fc=lerp_color(th["GE"],th["TM"],ratio)
                        pygame.draw.rect(screen,fc,(x+1,y+1,CELL-2,CELL-2))
                        if ratio>0.4: pygame.draw.rect(screen,(255,255,225),(x+1,y+1,CELL-2,CELL-2),2)
                    elif color:
                        draw_cell(screen,color,x,y,CELL,skin_idx,t)
                        # Lave montante (Volcan)
                        if nonlocal_theme[0]==3 and (r,c) in state["cell_fill"]:
                            prog=state["cell_fill"][(r,c)]
                            lh=int((CELL-4)*(1-prog))
                            if lh>0:
                                ly=y+2+(CELL-4-lh)
                                for li2 in range(lh):
                                    lratio=li2/max(1,lh)
                                    lc=lerp_color((255,160,30),(180,25,5),lratio)
                                    pygame.draw.line(screen,lc,(x+2,ly+li2),(x+CELL-3,ly+li2))
                                pygame.draw.rect(screen,(255,200,80),(x+2,ly,CELL-4,2))
                    else:
                        pygame.draw.rect(screen,th["GE"],(x+1,y+1,CELL-2,CELL-2))
                        pygame.draw.line(screen,th["SL"],(x+1,y+1),(x+CELL-2,y+1))
                        pygame.draw.line(screen,th["SL"],(x+1,y+1),(x+1,y+CELL-2))
                        pygame.draw.line(screen,th["GL"],(x+1,y+CELL-2),(x+CELL-2,y+CELL-2))
                        pygame.draw.line(screen,th["GL"],(x+CELL-2,y+1),(x+CELL-2,y+CELL-2))

            # Snap aperçu
            if state["drag"] is not None:
                piece=state["tray"][state["drag"]["idx"]]
                if piece:
                    sh=piece["shape"]; gr,gc=snap_pos(mx,my,sh)
                    valid=can_place(state["grid"],sh,gr,gc); col2=piece["color"] if valid else (220,55,45)
                    overlay.fill((0,0,0,0))
                    for rr,line in enumerate(sh):
                        for cc,v in enumerate(line):
                            if v:
                                pr,pc2=gr+rr,gc+cc
                                if 0<=pr<GRID_ROWS and 0<=pc2<GRID_COLS:
                                    rx=GRID_X+pc2*CELL+1+sx; ry=GRID_Y+pr*CELL+1+sy
                                    pygame.draw.rect(overlay,(*col2,110),(rx,ry,CELL-2,CELL-2))
                                    pygame.draw.rect(overlay,(*col2,230),(rx,ry,CELL-2,CELL-2),2)
                    screen.blit(overlay,(0,0))

            # Plateau bois
            bx=GRID_X-5+sx; by=TRAY_Y-12+sy; bw=GRID_W+10; bh=TRAY_H+16
            shadow_rect(screen,tuple(max(0,v-30) for v in th["TR"]),
                        pygame.Rect(bx,by,bw,bh),radius=10,shadow_off=4)
            pygame.draw.rect(screen,th["TR"],(bx,by,bw,bh),border_radius=10)
            for i2 in range(0,bh,13): pygame.draw.rect(screen,th["TR2"],(bx,by+i2,bw,2))
            pygame.draw.rect(screen,th["TB"],(bx,by,bw,bh),6,border_radius=10)
            pygame.draw.rect(screen,th["TM"],(bx,by,bw,bh),1,border_radius=10)
            for cx4,cy4 in [(bx,by),(bx+bw-14,by),(bx,by+bh-14),(bx+bw-14,by+bh-14)]:
                pygame.draw.rect(screen,th["TM"],(cx4,cy4,14,14))
                pygame.draw.rect(screen,th["TR"],(cx4+2,cy4+2,10,10))

            pw4=GRID_W//3
            for i,piece in enumerate(state["tray"]):
                if i>0:
                    lx2=GRID_X+i*pw4+sx
                    for ly3 in range(TRAY_Y-8+sy,TRAY_Y+TRAY_H+4+sy,4):
                        pygame.draw.circle(screen,th["DC"],(lx2,ly3),1)
                if not piece: continue
                sh=piece["shape"]
                pw5=len(sh[0])*PIECE_CELL; ph=len(sh)*PIECE_CELL
                ox=GRID_X+i*pw4+pw4//2-pw5//2+sx; oy=TRAY_Y+(TRAY_H-ph)//2+sy
                is_drag=state["drag"] is not None and state["drag"]["idx"]==i
                for rr,line in enumerate(sh):
                    for cc,v in enumerate(line):
                        if v: draw_cell(screen,piece["color"],ox+cc*PIECE_CELL,oy+rr*PIECE_CELL,
                                        PIECE_CELL,skin_idx,t,dimmed=is_drag)

            # Pièce flottante
            if state["drag"] is not None:
                piece=state["tray"][state["drag"]["idx"]]
                if piece:
                    sh=piece["shape"]
                    ox2=mx-(len(sh[0])*CELL)//2; oy2=my-(len(sh)*CELL)//2
                    for rr,line in enumerate(sh):
                        for cc,v in enumerate(line):
                            if v: draw_cell(screen,piece["color"],ox2+cc*CELL,oy2+rr*CELL,CELL,skin_idx,t)

            # Particules + Debris (sur overlay)
            if state["particles"] or state["debris"]:
                overlay.fill((0,0,0,0))
                for p in state["particles"]:
                    ratio=p["life"]/p["ml"]; a=int(220*ratio)
                    sz=max(1,int(p["size"]*ratio))
                    if p["circle"]: pygame.draw.circle(overlay,(*p["color"],a),(int(p["x"]+sx),int(p["y"]+sy)),sz)
                    else: pygame.draw.rect(overlay,(*p["color"],a),(int(p["x"]+sx)-sz,int(p["y"]+sy)-sz,sz*2,sz*2))
                for d in state["debris"]:
                    ratio=d.life/d.ml; a=int(210*ratio); sz=max(1,int(d.size*(0.25+0.75*ratio)))
                    px2,py2=int(d.x+sx),int(d.y+sy)
                    if d.is_circle: pygame.draw.circle(overlay,(*d.color,a),(px2,py2),sz)
                    else: pygame.draw.rect(overlay,(*d.color,a),(px2-sz,py2-sz,sz*2,sz*2))
                screen.blit(overlay,(0,0))

            # Textes flottants
            for f2 in state["floats"]: f2.draw(screen)

            # Flash écran
            if state["screen_flash"]>0:
                overlay.fill((0,0,0,0))
                overlay.fill((*state["screen_flash_col"],state["screen_flash"]))
                screen.blit(overlay,(0,0))

            # ── HUD ──────────────────────────────────────────────────────────
            hpanel=pygame.Rect(HUD_X-6,GRID_Y-8,HUD_W+10,GRID_H+TRAY_H+28)
            shadow_rect(screen,th["GBG"],hpanel,radius=10,shadow_off=4)
            pygame.draw.rect(screen,th["GBG"],hpanel,border_radius=10)
            pygame.draw.rect(screen,th["DC"],hpanel,2,border_radius=10)

            hy=GRID_Y
            t1=f_sm.render("BLOCK",True,th["TM"]); t2=f_sm.render("PUZZLE",True,th["TA"])
            screen.blit(t1,(HUD_X+HUD_W//2-t1.get_width()//2,hy))
            screen.blit(t2,(HUD_X+HUD_W//2-t2.get_width()//2,hy+18))
            pygame.draw.line(screen,th["DC"],(HUD_X,hy+40),(HUD_X+HUD_W-4,hy+40),1); hy+=46

            screen.blit(f_xs.render("SCORE",True,th["TG"]),(HUD_X,hy))
            sv=f_huge.render(str(state["score"]),True,th["TM"])
            glow_rect(screen,th["TM"],pygame.Rect(HUD_X,hy+16,min(sv.get_width()+8,HUD_W),sv.get_height()),layers=2)
            screen.blit(sv,(HUD_X,hy+16)); hy+=18+sv.get_height()+6

            pygame.draw.line(screen,th["DC"],(HUD_X,hy),(HUD_X+HUD_W-4,hy),1); hy+=6
            screen.blit(f_xs.render(f"RECORD  {best}",True,th["TG"]),(HUD_X,hy)); hy+=18
            screen.blit(f_xs.render(f"PIÈCES  {state['placed']}",True,th["TG"]),(HUD_X,hy)); hy+=20

            if state["combo"]>1:
                ct=f_sm.render(f"★ x{state['combo']} COMBO!",True,th["TM"])
                screen.blit(ct,(HUD_X,hy)); hy+=ct.get_height()+4

            pygame.draw.line(screen,th["DC"],(HUD_X,hy+2),(HUD_X+HUD_W-4,hy+2),1); hy+=10
            screen.blit(f_xs.render("THÈME",True,th["TG"]),(HUD_X,hy))
            screen.blit(f_sm.render(th["name"],True,th["TM"]),(HUD_X,hy+15)); hy+=35
            next_pts=(state["score"]//500+1)*500; prog=(state["score"]%500)/500
            bar_r=pygame.Rect(HUD_X,hy,HUD_W-4,10)
            pygame.draw.rect(screen,th["GL2"],bar_r,border_radius=5)
            if prog>0: pygame.draw.rect(screen,th["TM"],(HUD_X,hy,int((HUD_W-4)*prog),10),border_radius=5)
            pygame.draw.rect(screen,th["DC"],bar_r,1,border_radius=5)
            screen.blit(f_xs.render(f"→ {next_pts-state['score']}pt",True,th["TG"]),(HUD_X,hy+13)); hy+=32

            pygame.draw.line(screen,th["DC"],(HUD_X,hy),(HUD_X+HUD_W-4,hy),1); hy+=6
            screen.blit(f_xs.render("SKIN",True,th["TG"]),(HUD_X,hy)); hy+=17
            state["_skin_y"]=hy
            skin_rects=make_skin_rects(hy)
            for i2,sr in enumerate(skin_rects):
                sel=(i2==skin_idx); hov2=sr.collidepoint(mx,my)
                if sel: glow_rect(screen,th["TM"],sr,layers=2,radius=5)
                bg_c=tuple(min(255,v+(18 if sel else 8 if hov2 else 0)) for v in th["GBG"])
                pygame.draw.rect(screen,bg_c,sr,border_radius=5)
                pygame.draw.rect(screen,th["TM"] if sel else th["DC"],sr,2 if sel else 1,border_radius=5)
                draw_cell(screen,COLORS[i2%len(COLORS)],sr.x+4,sr.y+(sr.height-16)//2,16,i2,t)
                screen.blit(f_xs.render(SKIN_NAMES[i2],True,th["TM"] if sel else th["TG"]),
                            (sr.x+24,sr.y+sr.height//2-7))
            hy+=3*(SK_H+5)+8
            pygame.draw.line(screen,th["DC"],(HUD_X,hy),(HUD_X+HUD_W-4,hy),1); hy+=6
            for txt,col in [("Glisse une pièce",th["TG"]),("R  relancer",th["TA"]),
                            ("ESC  menu",(90,110,70))]:
                screen.blit(f_xs.render(txt,True,col),(HUD_X,hy)); hy+=16

            # ── Game Over ────────────────────────────────────────────────────
            if state["over"]:
                elapsed_ov=pygame.time.get_ticks()-state["over_t"]
                fade=min(185,int(185*elapsed_ov/500))
                overlay.fill((0,0,0,fade)); screen.blit(overlay,(0,0))
                pw6=420; ph2=300; px2=WIN_W//2-pw6//2; py2=WIN_H//2-ph2//2-20
                panel=pygame.Surface((pw6,ph2),pygame.SRCALPHA)
                panel.fill((0,0,0,210))
                screen.blit(panel,(px2,py2))
                for i2 in range(0,ph2,13): pygame.draw.rect(screen,(*th["TR2"],45),(px2,py2+i2,pw6,2))
                pygame.draw.rect(screen,th["TB"],(px2,py2,pw6,ph2),4,border_radius=18)
                # Titre pulsant
                pulse_go=int(math.sin(t*0.006)*12)
                go_col=(min(255,235+pulse_go),max(0,65-pulse_go//2),max(0,45-pulse_go//2))
                cx2=WIN_W//2; cy2=WIN_H//2-10
                go_s=f_big.render("GAME OVER",True,go_col)
                glow_rect(screen,go_col,pygame.Rect(cx2-go_s.get_width()//2-4,cy2-106,go_s.get_width()+8,go_s.get_height()+4),layers=2,radius=6)
                screen.blit(go_s,(cx2-go_s.get_width()//2,cy2-104))
                # Score + record
                is_rec=(state["score"]>=best)
                sc_col=th["TM"] if not is_rec else (255,220,60)
                for surf,y2 in [
                    (f_med.render(f"Score : {state['score']}",True,sc_col),cy2-30),
                    (f_med.render(("  RECORD!" if is_rec else f"Record : {best}"),True,th["TA"]),cy2+12),
                ]:
                    screen.blit(surf,(cx2-surf.get_width()//2,y2))
                # Barre "clic pour continuer" (apparaît après 1.2s)
                if elapsed_ov>1200:
                    tap_a=int(180+75*abs(math.sin(t*0.004)))
                    tap_s=f_sm.render("Clic ou touche  →  Menu",True,(185,235,155))
                    tap_s.set_alpha(tap_a); screen.blit(tap_s,(cx2-tap_s.get_width()//2,cy2+58))
                r_s=f_xs.render("R  rejouer",True,th["TG"])
                screen.blit(r_s,(cx2-r_s.get_width()//2,cy2+88))

            pygame.display.flip()

        if state["score"]>best: best=state["score"]

if __name__=="__main__":
    main()
