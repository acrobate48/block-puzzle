'use strict';
// ─── SHAPES ──────────────────────────────────────────────────────────────────
const SHAPES=[
  [[1]],[[1,1]],[[1],[1]],[[1,1,1]],[[1],[1],[1]],[[1,1],[1,1]],
  [[1,0],[1,0],[1,1]],[[0,1],[0,1],[1,1]],[[1,1],[1,0],[1,0]],[[1,1],[0,1],[0,1]],
  [[1,1,1],[0,1,0]],[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],[[0,1],[1,1],[0,1]],
  [[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0],[1,1],[0,1]],[[0,1],[1,1],[1,0]],
  [[1,1,1,1]],[[1],[1],[1],[1]],
  [[1,0,0],[1,0,0],[1,1,1]],[[0,0,1],[0,0,1],[1,1,1]],
  [[1,1,1],[1,0,0],[1,0,0]],[[1,1,1],[0,0,1],[0,0,1]],
  [[1,1],[1,1],[1,1]],[[1,1,1],[1,1,1]],
  [[1,0,0],[0,1,0],[0,0,1]],[[0,0,1],[0,1,0],[1,0,0]]
];
const COLORS=['#3AC644','#C6D026','#DA4E30','#EE8A1C',
              '#4EBC80','#9E3AC6','#30B2C6','#EEB23A',
              '#62DA4E','#E040A0','#40C0E0','#FF7070'];

const THEMES=[
  {name:'JUNGLE',  bg:'#081508',gbg:'#0F2310',ge:'#132A12',sl:'#2E4820',dc:'#183810',
   tm:'#D4B030',ta:'#5DC940',tg:'#5A9048',sky:'#060E06',pc:['#50E150','#D7C332','#32C35F'],hi:'#90FF80',
   hudBg:'rgba(6,14,6,0.88)',hudBorder:'#2E4820',gridBorder:'#5DC940',gridGlow:'#40FF20',trayBg:'rgba(15,35,16,0.92)',cellGlow:'#90FF80',scoreGlow:'#D4B030'},
  {name:'DÉSERT',  bg:'#301C06',gbg:'#422808',ge:'#4C3010',sl:'#A07830',dc:'#885018',
   tm:'#E8B838',ta:'#E07820',tg:'#A07848',sky:'#281602',pc:['#EBAF37','#D77326','#FABE4B'],hi:'#FFE080',
   hudBg:'rgba(48,28,6,0.88)',hudBorder:'#A07830',gridBorder:'#E8B838',gridGlow:'#FFD060',trayBg:'rgba(66,40,8,0.92)',cellGlow:'#FFE080',scoreGlow:'#E8B838'},
  {name:'OCÉAN',   bg:'#040C28',gbg:'#070F38',ge:'#090F44',sl:'#2868A8',dc:'#0C4888',
   tm:'#50C8F0',ta:'#28AAA0',tg:'#4878A8',sky:'#030820',pc:['#37AFEB','#5FC3C3','#91EBFC'],hi:'#A0F0FF',
   hudBg:'rgba(4,12,40,0.88)',hudBorder:'#2868A8',gridBorder:'#50C8F0',gridGlow:'#00E8FF',trayBg:'rgba(7,15,56,0.92)',cellGlow:'#A0F0FF',scoreGlow:'#50C8F0'},
  {name:'VOLCAN',  bg:'#180402',gbg:'#240804',ge:'#2C0A06',sl:'#A83C0C',dc:'#901804',
   tm:'#F08020',ta:'#F03810',tg:'#A04828',sky:'#100302',pc:['#FC4B12','#FC9126','#C32608'],hi:'#FFB060',
   hudBg:'rgba(24,4,2,0.88)',hudBorder:'#A83C0C',gridBorder:'#F08020',gridGlow:'#FF4000',trayBg:'rgba(36,8,4,0.92)',cellGlow:'#FFB060',scoreGlow:'#F08020'},
  {name:'NUIT',    bg:'#050312',gbg:'#08051C',ge:'#0A0620',sl:'#4828A8',dc:'#380898',
   tm:'#A878F0',ta:'#70B8F0',tg:'#604898',sky:'#030110',pc:['#AF5FFC','#5FC3FC','#FCAFFE'],hi:'#E0B0FF',
   hudBg:'rgba(5,3,18,0.88)',hudBorder:'#4828A8',gridBorder:'#A878F0',gridGlow:'#C060FF',trayBg:'rgba(8,5,28,0.92)',cellGlow:'#E0B0FF',scoreGlow:'#A878F0'},
  {name:'ARCTIQUE',bg:'#08121E',gbg:'#0E1C2E',ge:'#122438',sl:'#3878A8',dc:'#204C78',
   tm:'#88E0F8',ta:'#60C0F0',tg:'#4888A8',sky:'#040C16',pc:['#78E8FF','#A0F0E0','#C0F8FF'],hi:'#C0F8FF',
   hudBg:'rgba(8,18,30,0.88)',hudBorder:'#3878A8',gridBorder:'#88E0F8',gridGlow:'#C0F8FF',trayBg:'rgba(14,28,46,0.92)',cellGlow:'#C0F8FF',scoreGlow:'#88E0F8'},
  {name:'COSMOS',  bg:'#020008',gbg:'#060012',ge:'#080018',sl:'#380880',dc:'#200060',
   tm:'#B040F0',ta:'#6080F0',tg:'#483068',sky:'#010004',pc:['#D060FF','#8060FF','#60A0FF'],hi:'#E0A0FF',
   hudBg:'rgba(2,0,8,0.88)',hudBorder:'#380880',gridBorder:'#B040F0',gridGlow:'#E060FF',trayBg:'rgba(6,0,18,0.92)',cellGlow:'#E0A0FF',scoreGlow:'#B040F0'},
  {name:'ENCHANTÉ',bg:'#030A06',gbg:'#051008',ge:'#06140A',sl:'#148040',dc:'#0C3020',
   tm:'#40F060',ta:'#80F040',tg:'#307048',sky:'#020604',pc:['#60FF80','#A0FF60','#40FFBC'],hi:'#A0FFC0',
   hudBg:'rgba(3,10,6,0.88)',hudBorder:'#148040',gridBorder:'#40F060',gridGlow:'#80FF40',trayBg:'rgba(5,16,8,0.92)',cellGlow:'#A0FFC0',scoreGlow:'#40F060'},
  {name:'PLAGE',   bg:'#1C0804',gbg:'#280C06',ge:'#301008',sl:'#A03818',dc:'#782008',
   tm:'#F09838',ta:'#F05830',tg:'#A85840',sky:'#140604',pc:['#FFB050','#FF8040','#FFDC80'],hi:'#FFD080',
   hudBg:'rgba(28,8,4,0.88)',hudBorder:'#A03818',gridBorder:'#F09838',gridGlow:'#FFD080',trayBg:'rgba(40,12,6,0.92)',cellGlow:'#FFD080',scoreGlow:'#F09838'},
  {name:'NÉOPOLIS',bg:'#010510',gbg:'#030C28',ge:'#040E30',sl:'#1A3888',dc:'#081840',
   tm:'#00DDFF',ta:'#A040FF',tg:'#5080B0',sky:'#000408',pc:['#00DDFF','#A040FF','#FF40C0'],hi:'#C0F0FF',
   hudBg:'rgba(1,5,16,0.88)',hudBorder:'#1A3888',gridBorder:'#00DDFF',gridGlow:'#00FFFF',trayBg:'rgba(3,12,40,0.92)',cellGlow:'#C0F0FF',scoreGlow:'#00DDFF'}
];
const SKIN_NAMES=['PIERRE','CRISTAL','BOIS','MÉTAL','MARBRE','CANDY','GLACE','FEU','NÉON','GALAXIE'];
const ANIMATED_SKINS=new Set([7,8]);
const COLS=10,ROWS=10;
const CELL_CACHE=new Map();
