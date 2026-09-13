import generatedDeepLines from "./opening-deep-lines.json";

export type TheorySource = { label: string; url: string };

export type OpeningVariation = {
  id: string;
  eco: string;
  name: string;
  pgn: string;
  focus: string;
};

export type OpeningTheoryCourse = {
  sampleId: string;
  introduction: string;
  plans: string[];
  sources: TheorySource[];
  variations: OpeningVariation[];
};

type VariationSeed = [id: string, eco: string, name: string, pgn: string, focus: string];
const DEEP_LINES = generatedDeepLines as Record<string, string>;

const LICHESS_OPENINGS: TheorySource = {
  label: "Lichess 开局数据库（CC0）",
  url: "https://github.com/lichess-org/chess-openings",
};

function course(
  sampleId: string,
  introduction: string,
  plans: string[],
  wikiUrl: string,
  variations: VariationSeed[],
): OpeningTheoryCourse {
  return {
    sampleId,
    introduction,
    plans,
    sources: [LICHESS_OPENINGS, { label: "Wikibooks 开局理论", url: wikiUrl }],
    variations: variations.map(([id, eco, name, pgn, focus]) => ({
      id,
      eco,
      name,
      pgn: DEEP_LINES[`${sampleId}/${id}`] ?? pgn,
      focus,
    })),
  };
}

export const OPENING_THEORY_COURSES: OpeningTheoryCourse[] = [
  course(
    "ruy-lopez-morphy",
    "1.e4 e5 之后，白方先用 Nf3 攻击 e5，再以 Bb5 牵制其主要保护者。西班牙开局的要点通常不是马上赢兵，而是让黑方长期承担守住中心、完成发展的压力；黑方则用 ...a6、...Nf6 或更直接的 ...f5 选择不同性质的反击。",
    ["白方常以 c3、d4 建立第二次中心冲击。", "黑方要决定保住 e5、交换中心，还是用后翼空间换取主动。", "先完成易位，再判断 e 线压力是否真实。"],
    "https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._e4/1...e5/2._Nf3/2...Nc6/3._Bb5",
    [
      ["morphy", "C78", "莫菲防御", "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7", "...a6 先询问白象，再以 ...b5 争取空间；白方保留对 e5 的持久压力。"],
      ["berlin", "C67", "柏林防御", "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6", "黑方立即攻击 e4 并愿意进入后被交换的稳健结构，白方以发展领先补偿。"],
      ["exchange", "C68", "兑换变例", "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O", "白方交出象对，换取黑方叠兵和较清晰的残局目标。"],
      ["open", "C80", "开放防御", "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4", "黑方拿走 e4 兵，白方用快速 d4 和子力活动证明中心反击。"],
      ["marshall", "C89", "马歇尔进攻", "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5", "黑方以 ...d5 主动弃兵，换取发展速度和对白王的持续进攻。"],
      ["arkhangelsk", "C78", "阿尔汉格尔斯克变例", "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 Bb7", "黑方尽早把 c8 象放上长对角线，以子力活跃弥补后翼推进。"],
      ["schliemann", "C63", "施利曼防御", "1. e4 e5 2. Nf3 Nc6 3. Bb5 f5 4. Nc3 fxe4 5. Nxe4", "...f5 直接挑战 e4，用王翼风险换取战术主动。"],
      ["bird", "C61", "伯德防御", "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nd4 4. Nxd4 exd4", "黑马主动占据 d4，接受兵形变化以争夺中心格。"],
      ["cozio", "C60", "科齐奥防御", "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nge7 4. O-O g6", "黑方避免被钉住，以 ...g6、...Bg7 建立较灵活但稍拥挤的阵形。"],
      ["classical", "C64", "古典防御", "1. e4 e5 2. Nf3 Nc6 3. Bb5 Bc5 4. c3 Nf6 5. d4", "...Bc5 主动发展并瞄准 f2；白方用 c3、d4 争夺节奏。"],
      ["steinitz", "C62", "斯坦尼茨防御", "1. e4 e5 2. Nf3 Nc6 3. Bb5 d6 4. d4 Bd7", "...d6 牢固支撑 e5，但暂时限制黑方子力，白方应利用空间。"],
    ],
  ),
  course(
    "italian-giuoco-piano",
    "意大利开局把双方王象放到最积极的对角线，并围绕 f7 与 d4 展开竞争。白方可以选择安静的 c3、d3，也可以用 d4 或 b4 立刻打开中心；黑方的不同回应决定局面是战略较量还是强制战术。",
    ["发展、中心和王安全的次序比抢兵重要。", "白方常准备 c3、d4；黑方要及时以 ...d5 或 ...Nf6 反击。", "中心开放时，未易位的王会迅速成为战术目标。"],
    "https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._e4/1...e5/2._Nf3/2...Nc6/3._Bc4",
    [
      ["pianissimo", "C50", "慢棋体系", "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6 5. O-O d6", "双方先完成发展，再用 c3、d4 或后翼行动逐步改变中心。"],
      ["giuoco", "C54", "意大利主线", "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4", "c3、d4 立即争夺中心，考验双方发展的精确次序。"],
      ["evans", "C51", "伊文斯弃兵", "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3", "白方牺牲 b 兵赶走黑象，以时间和开放线路换取攻击。"],
      ["two-knights", "C55", "双马防御", "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Bc5", "黑方用 ...Nf6 反击 e4，不让白方无代价地建立理想中心。"],
      ["fried-liver", "C57", "煎肝进攻", "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7", "白方在 f7 牺牲马，试图把黑王拖入中心；每一步都需要具体计算。"],
      ["traxler", "C57", "特拉克斯勒反击", "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 Bc5", "黑方不守 f7，反而把象对准 f2，用对攻争夺主动。"],
      ["hungarian", "C50", "匈牙利防御", "1. e4 e5 2. Nf3 Nc6 3. Bc4 Be7 4. d4 d6", "...Be7 避开尖锐战术，目标是可靠易位和稳固中心。"],
      ["scotch-gambit", "C44", "苏格兰弃兵转型", "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. O-O", "白方暂缓回收 d4 兵，用快速发展和 e 线压力换取时间。"],
      ["deutz", "C55", "多伊茨弃兵", "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d4", "白方易位后马上 d4，以一枚中心兵换取开放线和发展速度。"],
      ["max-lange", "C56", "马克斯·兰格进攻", "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Nf6 5. O-O Bc5 6. e5", "e5 赶马并打开中心，形成高度强制的战术局面。"],
      ["center-attack", "C53", "中心进攻", "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. e5", "白方连续推进中心兵，必须用先手证明兵链前进的合理性。"],
    ],
  ),
  course(
    "sicilian-najdorf-english",
    "西西里防御以 ...c5 从侧面争夺 d4，纳道尔夫的 ...a6 则控制 b5 并保留 ...e5、...e6 两种中心结构。白方的第六步几乎就是选择整盘棋的计划：长易位进攻、古典发展或位置性控制。",
    ["黑方常利用半开放 c 线和后翼多数兵。", "白方若长易位，王翼兵推进必须与黑方后翼反击赛跑。", "判断 ...e5 之后 d5 弱格与空间收益谁更重要。"],
    "https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._e4/1...c5/2._Nf3/2...d6/3._d4/3...cxd4/4._Nxd4/4...Nf6/5._Nc3/5...a6",
    [
      ["english", "B90", "英国攻击", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3", "Be3、f3、Qd2 与长易位组成清晰的王翼进攻部署。"],
      ["main", "B96", "古典主线", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4", "Bg5 加强对 d5 的控制，f4 支撑 e5 突破并准备攻王。"],
      ["poisoned-pawn", "B97", "毒兵变例", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2", "黑后吃下 b2 兵，白方以发展、困后和王翼攻击寻求补偿。"],
      ["sozin", "B88", "索津进攻", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3", "Bc4 瞄准 e6、f7，白方争取快速建立直接攻击。"],
      ["adams", "B90", "亚当斯进攻", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. h3", "h3 限制 ...Ng4 并准备 g4，用一个节奏换取稳定的王翼扩张。"],
      ["opocensky", "B92", "奥波琴斯基变例", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5", "白方采用古典发展，避免过早暴露王位并保留多种易位选择。"],
      ["amsterdam", "B93", "阿姆斯特丹变例", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. f4", "f4 立即加强 e5，但延后子力发展，要求白方保持节奏。"],
      ["zagreb", "B91", "萨格勒布变例", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. g3", "白方以 Bg2 控制长对角线，选择更位置化的布局。"],
      ["lipnitsky", "B90", "利普尼茨基攻击", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 b5", "白象保留在进攻对角线上，黑方以 ...b5 争取后翼节奏。"],
      ["petronic", "B90", "彼得罗尼奇进攻", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 Ng4", "黑马立刻骚扰 e3 象，试图打乱英国攻击的标准部署。"],
      ["dekker", "B90", "德克尔变例", "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. g4", "g4 省略准备直接抢空间，威力与王翼弱点同时增加。"],
    ],
  ),
  course(
    "french-winawer",
    "法兰西防御用 ...e6、...d5 正面挑战白方中心。维纳维尔的 ...Bb4 把 c3 马与 e4 兵联系起来，黑方常交出象对破坏白方后翼兵形；白方则依靠 e5 空间和王翼进攻争取主动。",
    ["黑方的标准反击是 ...c5 攻击 d4 兵链根部。", "白方要决定保留中心、交换中心或用 Qg4 直接攻王。", "c8 象何时走出兵链，是黑方布局是否成功的关键。"],
    "https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._e4/1...e6/2._d4/2...d5/3._Nc3/3...Bb4",
    [
      ["main", "C18", "维纳维尔主线", "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3", "白方获得空间和双象，黑方得到明确的 c 兵攻击目标。"],
      ["poisoned-pawn", "C18", "毒兵变例", "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Qc7 8. Qxg7", "白后吃兵换取物质，黑方依靠发展和开放线组织反击。"],
      ["advance", "C17", "推进变例", "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5", "e5 固定空间优势，也把 d4 兵链根部交给 ...c5 攻击。"],
      ["exchange", "C01", "兑换结构", "1. e4 e6 2. d4 d5 3. exd5 exd5 4. Nf3", "中心对称后，优势来自子力位置和时机，而非开局空间。"],
      ["alekhine", "C15", "阿廖欣弃兵", "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Ne2 dxe4 5. a3", "白方以发展和象对为目标，愿意暂时承受中心兵压力。"],
      ["fingerslip", "C15", "手滑变例", "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. Bd2", "Bd2 立即解除牵制，允许交换但减少兵形被破坏的风险。"],
      ["retreat", "C18", "退象变例", "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Ba5", "黑象保留象对，让白方 a3 成为一次可被利用的节奏投入。"],
      ["bogoljubow", "C17", "波戈留博夫变例", "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. Bd2", "白方先解除牵制，再决定 a3 或中心交换，布局较稳健。"],
      ["petrosian", "C17", "彼得罗相变例", "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. h4", "h4 抢王翼空间，准备 h5，同时保留后在中心的灵活性。"],
      ["kondratiyev", "C18", "孔德拉季耶夫变例", "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Kf8", "黑王主动离开 g 线，以失去易位权换取守住王翼和反击机会。"],
      ["positional", "C18", "位置型主线", "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Nf3", "Nf3 优先完成发展，不急于吃 g7，转向长期空间优势。"],
    ],
  ),
  course(
    "caro-kann-classical",
    "卡罗康同样以 ...d5 挑战 e4，但先走 ...c6，目的是让 c8 象在 ...e6 之前走到兵链外。它通常换来坚固兵形，代价是黑方前几步较少直接给白方制造压力。",
    ["黑方首先要安全发展 c8 象。", "白方可用推进、兑换或 Panov 结构改变局面性质。", "稳固不等于被动：黑方要及时 ...c5 或 ...e5 反击中心。"],
    "https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._e4/1...c6/2._d4/2...d5/3._Nc3",
    [
      ["classical", "B18", "古典变例", "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6", "...Bf5 先激活坏象，白方以 Ng3、h4 争取空间和节奏。"],
      ["advance", "B12", "推进变例", "1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nf3 e6", "白方锁住中心获得空间，黑方从 ...c5 和 ...f6 寻找反击。"],
      ["exchange", "B13", "兑换变例", "1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Bd3", "形成对称的 Carlsbad 轮廓，双方靠子力活动和少数兵计划较量。"],
      ["panov", "B14", "帕诺夫进攻", "1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3", "白方接受孤立后兵的可能性，换取开放线路和主动发展。"],
      ["accelerated-panov", "B10", "加速帕诺夫", "1. e4 c6 2. c4 d5 3. exd5 cxd5", "白方跳过 d4 立即 c4，提早向黑方中心施压。"],
      ["two-knights", "B11", "双马变例", "1. e4 c6 2. Nf3 d5 3. Nc3 Bg4", "白方保留 d 兵选择，以快速发展避免过早固定中心。"],
      ["tartakower", "B15", "塔塔科维尔变例", "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nf6 5. Nxf6+ exf6", "黑方接受叠兵换取开放 e 线、稳固中心和双象。"],
      ["bronstein-larsen", "B16", "布龙斯坦–拉尔森", "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nf6 5. Nxf6+ gxf6", "...gxf6 打开 g 线并保留 e 兵，结构冒险但富有进攻性。"],
      ["gurgenidze", "B15", "古尔根尼泽体系", "1. e4 c6 2. d4 d5 3. Nc3 g6", "黑方准备 ...Bg7 从长对角线施压，用灵活性换取较慢发展。"],
      ["karpov", "B17", "卡尔波夫变例", "1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7", "...Nd7 保留 ...Ngf6 的交换选择，强调坚固和弹性。"],
      ["fantasy", "B12", "幻想变例", "1. e4 c6 2. d4 d5 3. f3 e6 4. Nc3", "f3 建立 e4、d4 大中心，但延缓发展并削弱王翼。"],
    ],
  ),
  course(
    "qgd-orthodox",
    "后翼弃兵的 2.c4 并非单纯送兵，而是用翼兵攻击黑方 d5 中心。拒绝弃兵后，黑方以 ...e6 守住支点，双方围绕何时释放中心张力、c8 象如何发展以及 c 线控制展开长期较量。",
    ["白方常以 cxd5 制造少数兵进攻结构。", "黑方要用 ...c5 或 ...e5 完成中心解放。", "c8 象和 d5 支点是判断黑方布局质量的两个指标。"],
    "https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._d4/1...d5/2._c4/2...e6",
    [
      ["orthodox", "D63", "正统防御", "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7", "黑方以可靠发展守住 d5，随后寻找 ...c5 或 ...e5 解放。"],
      ["exchange", "D35", "兑换变例", "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5", "交换后形成 Carlsbad 兵形，白方常准备 b4、b5 少数兵进攻。"],
      ["cambridge", "D52", "剑桥温泉防御", "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. e3 c6 6. Nf3 Qa5", "...Qa5 同时加压 c3 和 a2，制造具体战术问题。"],
      ["lasker", "D56", "拉斯克防御", "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 Ne4", "...Ne4 主动交换子力，降低白方空间优势的攻击潜力。"],
      ["tartakower", "D58", "塔塔科维尔防御", "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6", "...b6、...Bb7 让坏象从长对角线发展，并保留中心反击。"],
      ["tarrasch", "D32", "塔拉什防御", "1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5", "黑方立刻 ...c5 获取活动，愿意接受孤立后兵。"],
      ["semi-tarrasch", "D41", "半塔拉什", "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c5 5. e3 Nc6", "黑方保留以马回吃 d5 的可能，减少孤兵结构的强制性。"],
      ["ragozin", "D38", "拉戈津防御", "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Bb4", "...Bb4 把后翼弃兵结构与尼姆佐式牵制结合起来。"],
      ["vienna", "D44", "维也纳变例", "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 dxc4 5. e4 Bb4", "黑方拿 c4 兵并攻击 e4 中心，接受尖锐的动态局面。"],
      ["harrwitz", "D37", "哈维茨进攻", "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Be7 5. Bf4", "Bf4 把象放到兵链外，强化 e5 并避免传统 Bg5 路线。"],
      ["alatortsev", "D31", "阿拉托尔采夫变例", "1. d4 d5 2. c4 e6 3. Nc3 Be7", "黑方先 ...Be7，避免某些 Bg5 牵制次序并保留马的布局选择。"],
    ],
  ),
  course(
    "kings-indian-classical",
    "王印度允许白方建立 d4、e4 大中心，黑方以王翼侧翼象和 ...e5 发起反击。中心一旦以 d5 关闭，兵链方向通常决定战略：白方在后翼扩张，黑方以 ...f5 攻王。",
    ["不要把空间优势当成永久优势，必须准备应对 ...f5。", "黑方要争取王翼主动，同时防止后翼被突破。", "中心开闭决定双方应该在哪一翼行动。"],
    "https://en.wikibooks.org/wiki/Chess_Opening_Theory/ECO_volume_E",
    [
      ["classical", "E97", "古典主线", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7", "中心关闭后形成经典双翼竞速：白攻后翼，黑攻王翼。"],
      ["samisch", "E80", "赛米什变例", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3", "f3 牢固支撑 e4，并准备 Be3、Qd2、长易位。"],
      ["four-pawns", "E76", "四兵进攻", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f4", "白方用最大空间压制黑方，但发展与中心稳定性成为代价。"],
      ["fianchetto", "E67", "王翼象变例", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. Nf3 d6 5. g3 O-O 6. Bg2", "白方以 Bg2 控制长对角线，降低黑方标准王翼攻击的威力。"],
      ["averbakh", "E73", "阿韦尔巴赫变例", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5", "Bg5 限制黑方 ...e5、...f5 的协调，强调位置控制。"],
      ["makogonov", "E71", "马科戈诺夫变例", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. h3", "h3 控制 g4 并准备 g4 或 Be3，减慢黑方王翼反击。"],
      ["bayonet", "E97", "刺刀进攻", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. b4", "b4 立即在后翼抢空间，要求白方的进攻速度快于 ...f5。"],
      ["petrosian", "E92", "彼得罗相变例", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. d5", "白方较早关闭中心，并用稳健布局限制黑方典型反击。"],
      ["exchange", "E92", "兑换变例", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. dxe5", "白方交换中心以降低攻势，转向结构清晰的较量。"],
      ["gligoric", "E92", "格利戈里奇体系", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. Be3", "Be3 完成发展并控制 d4、c5，保留易位与中心选择。"],
      ["orthodox", "E94", "正统体系", "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 Nbd7 7. O-O e5", "黑马走 d7 保留 c 兵，布局稳健但稍显拥挤。"],
    ],
  ),
  course(
    "nimzo-rubinstein",
    "尼姆佐印度以 ...Bb4 牵制 c3 马，从而阻止或削弱 e4。黑方常愿意用象交换马，换取叠兵、弱格和对中心的控制；白方则以双象、空间和中心潜力作为长期补偿。",
    ["白方要判断双象能否在开放局面中发挥。", "黑方通常及时以 ...c5 或 ...d5 攻击中心。", "兵形弱点只有在能够被子力攻击时才是真弱点。"],
    "https://en.wikibooks.org/wiki/Chess_Opening_Theory/ECO_volume_E",
    [
      ["rubinstein", "E48", "鲁宾斯坦变例", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5", "e3 建立可靠中心并自然发展王象，是最经典的位置型选择。"],
      ["classical", "E32", "古典变例", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2", "Qc2 保护 c3 马并准备 e4，代价是后较早暴露。"],
      ["samisch", "E24", "赛米什变例", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. a3 Bxc3+ 5. bxc3", "白方主动要双象并接受叠兵，希望用大中心和开放 b 线补偿。"],
      ["leningrad", "E30", "列宁格勒变例", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Bg5", "Bg5 再牵制 f6 马，增加黑方中心布局的难度。"],
      ["kmoch", "E20", "克莫赫变例", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3", "f3 强行准备 e4 大中心，但削弱王翼并延迟发展。"],
      ["spielmann", "E22", "斯皮尔曼变例", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qb3", "Qb3 同时向 b4 象和 b7 施压，立即提出具体问题。"],
      ["three-knights", "E21", "三马变例", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3", "Nf3 先完成发展，保留 e 兵和后的多种安排。"],
      ["huebner", "E41", "许布纳变例", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 c5 6. Nf3 Nc6", "黑方先固定中心再交换，目标是让白方双象缺少开放线路。"],
      ["botvinnik", "E49", "博特维尼克体系", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. a3", "a3 要求黑象表态，准备以 b 兵回吃后建立强中心。"],
      ["romanischin", "E20", "罗曼尼辛变例", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. g3", "白方准备 Bg2，以长对角线和稳健王位对抗牵制。"],
      ["reshevsky", "E46", "列舍夫斯基变例", "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nge2", "Nge2 支撑 c3 马和 e4 计划，同时保持 f 兵灵活。"],
    ],
  ),
  course(
    "english-four-knights",
    "英国式的 1.c4 从侧翼控制 d5，并延迟决定 d、e 兵的结构。黑方可以用 ...e5 建立反向西西里、以 ...c5 对称回应，或走 ...Nf6 保留转入印度防御的可能。",
    ["先看中心格控制，不要只按棋盘左右理解侧翼开局。", "白方常以 g3、Bg2 长期施压 d5。", "转置很多，兵形比开局名称更值得记忆。"],
    "https://en.wikibooks.org/wiki/Chess_Opening_Theory/Great_Big_Opening_Survey",
    [
      ["four-knights", "A28", "四马变例", "1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3", "双方快速发展马，白方以 Bg2 持续控制 d5。"],
      ["symmetrical", "A30", "对称变例", "1. c4 c5 2. Nf3 Nf6 3. Nc3 Nc6", "黑方复制白方布局，先打破对称的一方必须证明多出的节奏。"],
      ["botvinnik", "A26", "博特维尼克体系", "1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. e4", "白方以 c4、e4 建立暗格控制，接受 d4 弱格换取空间。"],
      ["reversed-sicilian", "A25", "反向西西里", "1. c4 e5 2. Nc3 Nf6 3. g3 d5", "白方多一个节奏面对西西里式结构，黑方仍可主动占据中心。"],
      ["mikenas", "A18", "米肯纳斯–卡尔斯", "1. c4 Nf6 2. Nc3 e6 3. e4", "e4 建立大中心，允许黑方用 ...d5 或 ...c5 立即反击。"],
      ["kings-english", "A20", "王翼英国式", "1. c4 e5 2. g3 Nf6 3. Bg2", "白方直接完成翼侧象布局，把 d5 作为长期支点。"],
      ["anglo-indian", "A15", "英印防御", "1. c4 Nf6 2. Nf3 e6 3. g3", "双方保留转入后翼弃兵、列蒂或印度防御的选择。"],
      ["agincourt", "A13", "阿金库尔防御", "1. c4 e6 2. Nf3 d5 3. g3", "黑方建立后兵中心，白方从侧翼持续施压。"],
      ["hedgehog", "A30", "刺猬结构", "1. c4 c5 2. Nf3 Nf6 3. g3 b6 4. Bg2 Bb7", "黑方空间较少却结构紧凑，等待 ...d5 或 ...b5 的解放时机。"],
      ["bremen", "A29", "不来梅体系", "1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O", "白方完成标准翼侧象布局，准备在 d5 或中心寻找突破。"],
      ["keres", "A20", "凯列斯变例", "1. c4 e5 2. Nc3 Nf6 3. g3 c6", "...c6 准备 ...d5 建立完整中心，白方要及时施加压力。"],
    ],
  ),
  course(
    "reti-main",
    "列蒂从 1.Nf3 开始控制 e5、d4，却不急于占据中心。它常诱导黑方先建立兵中心，再以 c4、g3、Bg2 从侧翼攻击；同一着序也可能转入英国式、后翼弃兵或王印度攻击。",
    ["记住中心反击的时机，而不是死背名称。", "Bg2 的力量取决于中心何时开放。", "保留转置选择是优点，但也要避免布局过慢。"],
    "https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._Nf3",
    [
      ["kingside", "A09", "王翼象体系", "1. Nf3 d5 2. g3 Nf6 3. Bg2 g6 4. O-O Bg7", "双方以翼侧象远程控制中心，白方保留 c4、d4、e4 的选择。"],
      ["accepted", "A09", "列蒂弃兵接受", "1. Nf3 d5 2. c4 dxc4 3. e3", "黑方拿走 c4 兵，白方用发展和象回收争取节奏。"],
      ["advance", "A09", "列蒂推进变例", "1. Nf3 d5 2. c4 d4 3. b4", "黑方用 d4 抢空间，白方从后翼破坏其兵链。"],
      ["anglo-slav", "A12", "英格兰–斯拉夫体系", "1. Nf3 d5 2. c4 c6 3. b3", "黑方建立斯拉夫三角，白方以 Bb2 从长对角线施压。"],
      ["reversed-blumenfeld", "A09", "反向布鲁门菲尔德", "1. Nf3 d5 2. c4 d4 3. e3 c5 4. b4", "白方以 b4 兵翼弃兵冲击黑方中心链。"],
      ["capablanca", "A09", "卡帕布兰卡变例", "1. Nf3 d5 2. c4 e6 3. b3 Nf6 4. Bb2", "白方稳健发展后翼象，等待合适时机打开中心。"],
      ["penguin", "A04", "企鹅变例", "1. Nf3 d5 2. Rg1", "白车早出是非常规选择，依靠突袭价值但牺牲正常发展节奏。"],
      ["zilbermints", "A09", "齐尔伯明茨弃兵", "1. Nf3 d5 2. e4 dxe4 3. Ng5", "白方用中心兵换取发展和对 e4 的快速追击。"],
      ["kia", "A07", "王印度进攻", "1. Nf3 d5 2. g3 Nf6 3. Bg2 g6 4. O-O Bg7 5. d3 O-O 6. Nbd2", "白方建立通用王翼阵形，之后常以 e4、e5 发起攻王。"],
      ["lasker", "A09", "拉斯克体系", "1. Nf3 d5 2. c4 c6 3. b3 Bf5", "白方发展 Bb2，黑方先把 c8 象放到兵链外。"],
      ["symmetrical", "A05", "对称列蒂", "1. Nf3 Nf6 2. c4 c5 3. Nc3 Nc6", "双方保持结构对称，白方要用先手选择更有利的破局时机。"],
    ],
  ),
];

export const OPENING_THEORY_BY_SAMPLE = Object.fromEntries(
  OPENING_THEORY_COURSES.map((item) => [item.sampleId, item]),
) as Record<string, OpeningTheoryCourse>;

export function openingVariationCount() {
  return OPENING_THEORY_COURSES.reduce((total, item) => total + item.variations.length, 0);
}
