export type OpeningSample = {
  id: string;
  eco: string;
  name: string;
  family: string;
  summary: string;
  pgn: string;
  notes: Record<number, string>;
};

export const OPENING_SAMPLES: OpeningSample[] = [
  {
    id: 'ruy-lopez-morphy', eco: 'C78', name: '西班牙开局 · 莫菲防御', family: '开放性开局',
    summary: '白方持续向 e5 施压，黑方以主动扩张争取空间；关键不是立刻吃兵，而是保持压力。',
    pgn: `[Event "Squire 开局课 · 西班牙开局"]\n[ECO "C78"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 *`,
    notes: { 1: '1.e4 占领中心，并为后和王象打开线路。', 3: '2.Nf3 一边发展，一边直接攻击 e5 兵。', 5: '3.Bb5 用象牵制保护 e5 的马，这是西班牙开局的核心压力。', 6: '3...a6 询问白象去向，并准备用 ...b5 扩张后翼。', 11: '6.Re1 把车放到开放潜力最大的 e 线，继续给 e5 施压。', 17: '9.h3 防止 ...Bg4 的牵制，也为王制造一个透气格。' }
  },
  {
    id: 'italian-giuoco-piano', eco: 'C54', name: '意大利开局 · 慢棋体系', family: '开放性开局',
    summary: '双方快速发展后围绕 d4 突破展开较量，适合学习发展、中心与王安全的先后顺序。',
    pgn: `[Event "Squire 开局课 · 意大利开局"]\n[ECO "C54"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O 7. Re1 a6 8. Bb3 Ba7 *`,
    notes: { 5: '3.Bc4 把象放到积极位置，瞄准开局中较敏感的 f7 点。', 7: '4.c3 为未来 d4 建立兵链支撑，不是单纯走一个边兵。', 9: '5.d3 选择稳健结构，先完成发展，再寻找中心突破。', 11: '6.O-O 优先保证王安全；这通常比立即发动进攻更重要。', 13: '7.Re1 支持 e4，并让 d4 推进后中心仍有足够保护。' }
  },
  {
    id: 'sicilian-najdorf-english', eco: 'B90', name: '西西里防御 · 纳道尔夫英国攻击', family: '半开放性开局',
    summary: '异向易位带来双翼竞速：白方攻王翼，黑方在后翼反击，速度与中心控制同等重要。',
    pgn: `[Event "Squire 开局课 · 纳道尔夫"]\n[ECO "B90"]\n[Result "*"]\n\n1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O *`,
    notes: { 2: '1...c5 不对称地争夺 d4，主动制造复杂局面。', 6: '3...cxd4 交换白方中心兵，黑方获得半开放 c 线。', 10: '5...a6 是纳道尔夫的标志：控制 b5，并保留 ...e5 或 ...e6 的弹性。', 11: '6.Be3 开始英国攻击布局，通常配合 f3、Qd2 和长易位。', 20: '10.O-O-O 双方异向易位后，进攻速度往往比多吃一个兵更重要。' }
  },
  {
    id: 'french-winawer', eco: 'C18', name: '法兰西防御 · 维纳维尔变例', family: '半开放性开局',
    summary: '黑方攻击白方中心，白方用空间和王翼攻势补偿后翼兵形弱点。',
    pgn: `[Event "Squire 开局课 · 维纳维尔"]\n[ECO "C18"]\n[Result "*"]\n\n1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Qc7 8. Qxg7 Rg8 9. Qxh7 cxd4 10. Ne2 Nbc6 *`,
    notes: { 2: '1...e6 准备 ...d5 正面挑战白方中心，代价是暂时限制 c8 象。', 6: '3...Bb4 牵制 c3 马，增加对白方 e4 中心的压力。', 8: '4...c5 立即攻击 d4 兵链根部，是法兰西结构的标准反击。', 10: '5...Bxc3+ 主动交出象，换取白方后翼叠兵和长期结构目标。', 14: '7...Qc7 同时保护 g7，并准备在 c 线和中心制造反击。' }
  },
  {
    id: 'caro-kann-classical', eco: 'B18', name: '卡罗康防御 · 古典变例', family: '半开放性开局',
    summary: '黑方先解决后翼象再建立稳固结构，白方以空间和 h 兵推进争取主动。',
    pgn: `[Event "Squire 开局课 · 卡罗康古典变例"]\n[ECO "B18"]\n[Result "*"]\n\n1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 *`,
    notes: { 2: '1...c6 支持 ...d5，同时保留 c8 象走出兵链的机会。', 6: '3...dxe4 先化解白方中心，再依靠 ...Bf5 顺利发展坏象。', 8: '4...Bf5 是卡罗康的重要收益：象在 ...e6 关门前已经走到兵链外。', 11: '6.h4 争取空间并准备 h5 追赶 g6 象，但也要留意王翼格子的变化。', 16: '8...Bh7 保存重要的白格象，黑方接下来通常完成 ...e6 和王翼发展。' }
  },
  {
    id: 'qgd-orthodox', eco: 'D63', name: '后翼弃兵拒绝 · 正统防御', family: '封闭性开局',
    summary: '双方围绕 d5 支点和 c 线展开长期博弈，是学习少数兵进攻与中心张力的经典结构。',
    pgn: `[Event "Squire 开局课 · 后翼弃兵拒绝"]\n[ECO "D63"]\n[Result "*"]\n\n1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 *`,
    notes: { 3: '2.c4 用翼兵攻击黑方中心 d5，目的主要是争夺中心，不是白送兵。', 4: '2...e6 坚守 d5，形成后翼弃兵拒绝的稳固结构。', 7: '4.Bg5 牵制 f6 马，使黑方更难自由解决中心压力。', 14: '7...c6 加固 d5，并为后翼子力提供稳定阵地。', 17: '9.Bxc4 白方用活跃子力收回 c4，保持对中心和王翼的压力。' }
  },
  {
    id: 'kings-indian-classical', eco: 'E97', name: '王印度防御 · 古典主线', family: '印度防御',
    summary: '白方掌握后翼空间，黑方允许大中心后用 ...f5 攻击兵链，是典型的双翼战略竞赛。',
    pgn: `[Event "Squire 开局课 · 王印度古典主线"]\n[ECO "E97"]\n[Result "*"]\n\n1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. Be3 f5 *`,
    notes: { 4: '2...g6 准备王翼象翼侧出动，让象从远处影响中心。', 8: '4...d6 先稳住 e5，再等待合适时机冲击白方中心。', 12: '6...e5 允许白方获得空间，但固定了中心兵链的攻击方向。', 15: '8.d5 关闭中心后，白方通常向后翼扩张，黑方则转向王翼。', 20: '10...f5 攻击白方兵链前端，标志着黑方王翼反击正式开始。' }
  },
  {
    id: 'nimzo-rubinstein', eco: 'E48', name: '尼姆佐印度防御 · 鲁宾斯坦变例', family: '印度防御',
    summary: '黑方以牵制和双象取舍破坏白方兵形，白方则用中心与双象寻求长期补偿。',
    pgn: `[Event "Squire 开局课 · 尼姆佐印度"]\n[ECO "E48"]\n[Result "*"]\n\n1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 dxc4 10. Bxc4 Qc7 *`,
    notes: { 6: '3...Bb4 用象牵制 c3 马，从而间接控制 e4。', 7: '4.e3 选择鲁宾斯坦体系，稳固中心并准备 Bd3、Nf3。', 12: '6...c5 立即攻击白方 d4 中心，避免白方轻松建立大兵链。', 16: '8...Bxc3 黑方交出象对，换取白方 c 线叠兵和可攻击目标。', 19: '10.Bxc4 白方依靠双象和活跃中心补偿兵形缺陷。' }
  },
  {
    id: 'english-four-knights', eco: 'A28', name: '英国式开局 · 四马变例', family: '侧翼开局',
    summary: '白方从侧翼控制 d5，黑方建立中心；局面常转化为对兵链与双象价值的较量。',
    pgn: `[Event "Squire 开局课 · 英国式四马"]\n[ECO "A28"]\n[Result "*"]\n\n1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O 6. O-O Re8 7. d3 Bxc3 8. bxc3 e4 9. Nd4 exd3 10. exd3 *`,
    notes: { 1: '1.c4 从侧翼控制 d5，暂不暴露中心兵的最终结构。', 2: '1...e5 建立完整中心控制，形成反向西西里的典型轮廓。', 7: '4.g3 准备 Bg2，让象沿长对角线持续影响中心和后翼。', 14: '7...Bxc3 黑方主动改变兵形，试图让白方 c 兵成为长期目标。', 16: '8...e4 利用发展优势推进中心，迫使 f3 马表态。' }
  },
  {
    id: 'reti-main', eco: 'A09', name: '列蒂开局 · 王翼象体系', family: '侧翼开局',
    summary: '白方先诱导黑方建立中心，再用 c4 或 e4 从侧翼反击，强调灵活与转置。',
    pgn: `[Event "Squire 开局课 · 列蒂开局"]\n[ECO "A09"]\n[Result "*"]\n\n1. Nf3 d5 2. g3 Nf6 3. Bg2 g6 4. O-O Bg7 5. d3 O-O 6. Nbd2 c5 7. e4 Nc6 8. Re1 e5 9. exd5 Nxd5 10. Nc4 Re8 *`,
    notes: { 1: '1.Nf3 控制 e5 和 d4，同时保留转入多种开局体系的选择。', 4: '2...Nf6 发展并控制中心，避免过早固定更多兵。', 5: '3.Bg2 把象放在长对角线上，等待中心开放后发挥力量。', 13: '7.e4 正式挑战中心，列蒂经常从灵活布局转入明确的中心结构。', 18: '9...Nxd5 黑方用子力占据中心，白方接下来依靠发展和压力争夺主动。' }
  }
];

export const DEFAULT_OPENING_SAMPLE = OPENING_SAMPLES[0];
