



const TOOLS = [



  { id:'shichu',      cat:'fun',      icon:'🔯', name:'四柱推命',           desc:'生年月日から四柱・五行・大運を算出' },



  { id:'kanji',       cat:'fun',      icon:'🀄', name:'姓名判断・画数占い', desc:'五格で運勢判定' },



  { id:'random',      cat:'fun',      icon:'🎲', name:'乱数生成',           desc:'さいころ・カード・くじ引き' },



  { id:'bpm',         cat:'fun',      icon:'🎵', name:'メトロノーム＆コード進行プレーヤー', desc:'BPM・拍子設定＋王道進行など8種のコード再生' },



  { id:'world-clock', cat:'global',   icon:'🌍', name:'世界時計・時差計算', desc:'国と時間を入力→各国の時刻を表示' },



  { id:'currency',    cat:'global',   icon:'💱', name:'為替換算',           desc:'リアルタイムレートで通貨換算' },



  { id:'unit-conv',   cat:'global',   icon:'📐', name:'単位換算',           desc:'重さ・長さ・温度を変換' },



  { id:'tax',         cat:'money',    icon:'🧾', name:'消費税計算',         desc:'税込⇔税抜、8%/10%対応' },



  { id:'loan',        cat:'money',    icon:'🏦', name:'ローン返済計算',     desc:'月返済額・総返済額を試算' },



  { id:'warikan',     cat:'money',    icon:'🍽️', name:'割り勘計算',         desc:'合計金額÷人数、端数処理対応' },



  { id:'tedori',     cat:'money',    icon:'💴', name:'手取り計算',         desc:'月収から手取り額を概算' },



  { id:'date-diff',   cat:'datetime', icon:'📆', name:'日付差分計算',       desc:'2日間の日数・週数・月数' },



  { id:'age',         cat:'datetime', icon:'🎂', name:'年齢計算',           desc:'誕生日から正確な年齢を算出' },



  { id:'pomodoro',    cat:'datetime', icon:'🍅', name:'ポモドーロタイマー', desc:'25分集中+5分休憩のタイマー' },



  { id:'char-count',  cat:'text',     icon:'🔤', name:'文字数カウンター',   desc:'文字数・バイト数をリアルタイム表示' },



  { id:'base64',      cat:'text',     icon:'🔐', name:'Base64変換',         desc:'エンコード・デコード' },



  { id:'password',    cat:'text',     icon:'🔑', name:'パスワード生成',     desc:'文字種・長さ指定で安全生成' },



  { id:'qr',          cat:'design',   icon:'📱', name:'QRコード生成',       desc:'URLやテキストからQR生成' },



  { id:'color',       cat:'design',   icon:'🎨', name:'カラーコード変換',   desc:'HEX↔RGB↔HSL 相互変換' },
  { id:'shorten',     cat:'design',   icon:'🔗', name:'URL短縮',           desc:'長いURLを短縮リンクに変換' },



  { id:'bmi',         cat:'health',   icon:'⚖️', name:'BMI計算',           desc:'身長・体重から標準体重を算出' },



  { id:'calorie',     cat:'health',   icon:'🔥', name:'カロリー消費計算',   desc:'基礎代謝と1日の消費カロリーを算出' },



  { id:'body-fat',    cat:'health',   icon:'📊', name:'体脂肪率計算',       desc:'腹囲・首回りから体脂肪率を推定' },



];



const SECTION_LABELS = { global:'🌐 グローバル', money:'💰 お金・計算', datetime:'📅 日時', text:'📝 テキスト', design:'🎨 デザイン', health:'💪 健康', fun:'🔮 エンタメ' };

/* ── 文脈広告（承認済みASPリンクを持つツールのみ） ── */
const ADS = {
  tax: [
    { icon:'🧮', title:'freee会計', sub:'確定申告・帳簿付けをまるごと自動化', pr:'#3b82f6', cta:'無料で試す', url:'https://px.a8.net/svt/ejp?a8mat=4B3R2V+FLFW3E+3SPO+9FL80Y', img:'https://www15.a8.net/0.gif?a8mat=4B3R2V+FLFW3E+3SPO+9FL80Y' },
    { icon:'📗', title:'やよいの青色申告 オンライン', sub:'初年度無料・シンプル操作で青色申告控除', pr:'#f59e0b', cta:'1年間無料で試す', url:'https://px.a8.net/svt/ejp?a8mat=4B3R2V+FM1BP6+35XE+5YJRM', img:'https://www12.a8.net/0.gif?a8mat=4B3R2V+FM1BP6+35XE+5YJRM' }
  ]
};

function renderAds(toolId){
  const ads = ADS[toolId];
  if(!ads || !ads.length) return '';
  const items = ads.map(a=>`<a class="ad-banner" href="${a.url}" target="_blank" rel="nofollow noopener" referrerpolicy="no-referrer-when-downgrade"><span class="ad-icon">${a.icon}</span><span class="ad-body"><span class="ad-title">${a.title}</span><br><span class="ad-sub">${a.sub}</span></span><span class="ad-pr" style="background:${a.pr}">PR</span><span class="ad-cta">${a.cta} →</span><img border="0" width="1" height="1" src="${a.img}" alt="" style="position:absolute;"/></a>`).join('');
  return `<div class="ads-label">関連サービス</div>${items}`;
}







/* ── ツールUI定義 ── */



const RENDERERS = {



  tax: ()=>`<div class="tool-input-row"><label>金額（円）</label><div class="with-unit"><input id="taxAmt" type="number" value="1000" oninput="calcTax()"><span class="unit">円</span></div></div><div class="tool-input-row"><label>税率</label><div class="rate-grid"><button class="rate-btn" id="tax8" onclick="setRate(8)">8%（軽減）</button><button class="rate-btn on" id="tax10" onclick="setRate(10)">10%（標準）</button></div></div><div class="tool-input-row"><label>計算モード</label><select id="taxMode" onchange="calcTax()"><option value="ex">税抜き → 税込みを計算</option><option value="in">税込み → 税抜きを計算</option></select></div><div class="result-area visible"><div class="result-grid"><div class="result-item"><div class="result-label">税抜き</div><div class="result-value" id="taxEx">—<span class="unit">円</span></div></div><div class="result-item"><div class="result-label">税額</div><div class="result-value" id="taxAmt2">—<span class="unit">円</span></div></div><div class="result-item span2"><div class="result-label">税込み</div><div class="result-value" id="taxIn">—<span class="unit">円</span></div></div></div></div>`,



  warikan: ()=>`<div class="tool-input-pair"><div class="tool-input-row"><label>合計金額</label><div class="with-unit"><input id="wTotal" type="number" value="12800" oninput="calcWarikan()"><span class="unit">円</span></div></div><div class="tool-input-row"><label>人数</label><div class="with-unit"><input id="wPeople" type="number" value="4" min="2" oninput="calcWarikan()"><span class="unit">人</span></div></div></div><div class="tool-input-row"><label>端数処理</label><select id="wRound" onchange="calcWarikan()"><option value="round">四捨五入</option><option value="ceil">切り上げ</option><option value="floor">切り捨て</option></select></div><div class="result-area visible"><div class="result-grid"><div class="result-item span2"><div class="result-label">1人あたり</div><div class="result-value" id="wPer">—<span class="unit">円</span></div></div><div class="result-item"><div class="result-label">幹事集金額</div><div class="result-value" id="wCollect">—<span class="unit">円</span></div></div><div class="result-item"><div class="result-label">端数</div><div class="result-value" id="wRem">—<span class="unit">円</span></div></div></div></div>`,



  loan: ()=>`<div class="tool-input-pair"><div class="tool-input-row"><label>借入金額</label><div class="with-unit"><input id="lAmount" type="number" value="3000" oninput="calcLoan()"><span class="unit">万円</span></div></div><div class="tool-input-row"><label>年利</label><div class="with-unit"><input id="lRate" type="number" value="1.5" step="0.1" oninput="calcLoan()"><span class="unit">%</span></div></div></div><div class="tool-input-row"><label>返済期間</label><div class="with-unit"><input id="lYears" type="number" value="35" oninput="calcLoan()"><span class="unit">年</span></div></div><div class="result-area visible"><div class="result-grid"><div class="result-item span2"><div class="result-label">毎月の返済額</div><div class="result-value" id="lMonthly">—<span class="unit">円</span></div></div><div class="result-item"><div class="result-label">総返済額</div><div class="result-value" id="lTotal">—<span class="unit">万円</span></div></div><div class="result-item"><div class="result-label">利息合計</div><div class="result-value" id="lInterest">—<span class="unit">万円</span></div></div></div></div>`,

  tedori: ()=>`<div class="tool-input-row"><label>月収（顧面）</label><div class="with-unit"><input id="tdGross" type="number" value="30" oninput="calcTedori()"><span class="unit">万円</span></div></div><div class="tool-input-row"><label>年齢</label><div class="rate-grid"><button class="rate-btn on" id="td39" onclick="setTdAge(39)">40歳未満</button><button class="rate-btn" id="td40" onclick="setTdAge(40)">40歳以上（介護保険）</button></div></div><div class="result-area visible"><div class="result-grid"><div class="result-item"><div class="result-label">健保・介護・支援金</div><div class="result-value" id="tdHi">—<span class="unit">円</span></div></div><div class="result-item"><div class="result-label">厚生年金</div><div class="result-value" id="tdPe">—<span class="unit">円</span></div></div><div class="result-item"><div class="result-label">雇用保険</div><div class="result-value" id="tdEi">—<span class="unit">円</span></div></div><div class="result-item"><div class="result-label">所得税（概算）</div><div class="result-value" id="tdTx">—<span class="unit">円</span></div></div><div class="result-item"><div class="result-label">住民税（概算）</div><div class="result-value" id="tdRt">—<span class="unit">円</span></div></div><div class="result-item span2"><div class="result-label" style="font-weight:900;color:var(--blue);">月手取り（概算）</div><div class="result-value" id="tdNet" style="color:var(--blue);font-size:1.08rem;">—<span class="unit">円</span></div></div></div><p style="font-size:.68rem;color:var(--muted);margin:4px 0 0;">※協会けんぽ全国平均・会社員想定の概算。等級・扶養・各種控除により変動します</p></div>`,



  'world-clock': ()=>`<div id="wcWrap" style="width:100%;border-radius:10px;overflow:hidden;"></div><div style="margin-top:14px;background:var(--bg2);border-radius:10px;padding:12px 14px;"><div style="font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:8px;">🕐 時差計算 — 特定の時刻を入力して各国の時刻を確認</div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><select id="wcFromTz" onchange="calcWcConv()" style="flex:1;min-width:130px;padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:.82rem;font-family:inherit;background:var(--white);"><option value="">現在時刻（自動）</option><option value="Asia/Tokyo">東京 (JST)</option><option value="Asia/Shanghai">北京 (CST)</option><option value="Asia/Singapore">シンガポール (SGT)</option><option value="Asia/Dubai">ドバイ (GST)</option><option value="Asia/Kolkata">ムンバイ (IST)</option><option value="Europe/Moscow">モスクワ (MSK)</option><option value="Europe/London">ロンドン (GMT/BST)</option><option value="America/New_York">ニューヨーク (ET)</option><option value="America/Los_Angeles">ロサンゼルス (PT)</option><option value="Australia/Sydney">シドニー (AEST)</option><option value="America/Sao_Paulo">サンパウロ (BRT)</option></select><input id="wcFromTime" type="time" onchange="calcWcConv()" style="width:110px;padding:7px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:.82rem;font-family:inherit;background:var(--white);"><button onclick="resetWcConv()" style="padding:7px 12px;background:var(--bg);border:1.5px solid var(--border);border-radius:8px;font-size:.78rem;font-family:inherit;cursor:pointer;color:var(--muted);">リセット</button></div></div>`,



  password: ()=>`<div class="tool-input-row"><label>文字数</label><input id="pwLen" type="range" min="8" max="32" value="16" oninput="updatePwLen();genPw()"><div style="text-align:right;font-size:.75rem;color:var(--muted);margin-top:2px;"><span id="pwLenVal">16</span>文字</div></div><div class="tool-input-row"><label>文字種</label><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;"><label style="font-size:.78rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="pwUpper" checked onchange="genPw()"> 大文字</label><label style="font-size:.78rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="pwLower" checked onchange="genPw()"> 小文字</label><label style="font-size:.78rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="pwNum" checked onchange="genPw()"> 数字</label><label style="font-size:.78rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="pwSym" onchange="genPw()"> 記号</label></div></div><div class="result-area visible"><div style="background:var(--bg);border-radius:10px;padding:13px 15px;font-family:monospace;font-size:.88rem;letter-spacing:.05em;word-break:break-all;cursor:pointer;" id="pwOutput" onclick="copyPw()" title="クリックでコピー">—</div><div style="text-align:right;margin-top:6px;display:flex;gap:8px;justify-content:flex-end;"><button class="calc-btn" style="width:auto;padding:6px 16px;font-size:.78rem;" onclick="genPw()">再生成</button><button class="calc-btn" style="width:auto;padding:6px 16px;font-size:.78rem;background:var(--bg);color:var(--blue);border:1.5px solid var(--blue);" onclick="copyPw()">コピー</button></div></div>`,



  kanji: ()=>`<div style="display:flex;gap:10px;margin-bottom:10px;"><div class="tool-input-row" style="flex:1;margin:0;"><label>姓（苗字）</label><input id="kjSei" type="text" placeholder="例：山田" maxlength="8" oninput="calcKanji()" style="font-size:1.05rem;letter-spacing:.08em;"></div><div class="tool-input-row" style="flex:1;margin:0;"><label>名（名前）</label><input id="kjMei" type="text" placeholder="例：太郎" maxlength="8" oninput="calcKanji()" style="font-size:1.05rem;letter-spacing:.08em;"></div></div><div id="kjResult"></div>`,



  shichu: ()=>`<div style="display:flex;gap:6px;margin-bottom:8px;"><div class="tool-input-row" style="flex:2;margin:0;"><label>生年月日</label><input id="scDate" type="date" min="1924-01-01" max="2060-12-31" value="1990-01-01" oninput="calcShichu()" style="font-size:.85rem;"></div><div class="tool-input-row" style="flex:3;margin:0;"><label>出生時刻（任意）</label><select id="scHour" onchange="calcShichu()"><option value="-1">不明</option><option value="0">子（23〜1時）</option><option value="1">丑（1〜3時）</option><option value="2">寅（3〜5時）</option><option value="3">卯（5〜7時）</option><option value="4">辰（7〜9時）</option><option value="5">巳（9〜11時）</option><option value="6">午（11〜13時）</option><option value="7">未（13〜15時）</option><option value="8">申（15〜17時）</option><option value="9">酉（17〜19時）</option><option value="10">戌（19〜21時）</option><option value="11">亥（21〜23時）</option></select></div></div><div class="tool-input-row" style="margin-bottom:10px;"><label>性別</label><div class="rate-grid"><button class="rate-btn on" id="scMale" onclick="scSetGender(0)">男命</button><button class="rate-btn" id="scFemale" onclick="scSetGender(1)">女命</button></div></div><div id="scResult"></div>`,

  random: ()=>`<div class="tool-input-row"><label>モード</label><div class="rate-grid"><button class="rate-btn on" id="rdDice" onclick="rdSetMode('dice')">🎲 さいころ</button><button class="rate-btn" id="rdCard" onclick="rdSetMode('card')">🃏 カード</button><button class="rate-btn" id="rdLot" onclick="rdSetMode('lot')">🎯 くじ引き</button></div></div><div id="rdDiceWrap"><div class="tool-input-row"><label>面数</label><div class="rate-grid"><button class="rate-btn on" id="rdF6" onclick="rdSetFace(6)">6面</button><button class="rate-btn" id="rdF4" onclick="rdSetFace(4)">4面</button><button class="rate-btn" id="rdF10" onclick="rdSetFace(10)">10面</button><button class="rate-btn" id="rdF20" onclick="rdSetFace(20)">20面</button></div></div><div class="tool-input-row"><label>個数</label><div class="with-unit"><input id="rdCount" type="number" value="1" min="1" max="10"><span class="unit">個</span></div></div></div><div id="rdCardWrap" style="display:none"><div class="tool-input-row"><label>スート</label><select id="rdSuit"><option value="all">全スート</option><option value="♠">♠ スペード</option><option value="♥">♥ ハート</option><option value="♦">♦ ダイヤ</option><option value="♣">♣ クラブ</option></select></div></div><div id="rdLotWrap" style="display:none"><div class="tool-input-row"><label>選択肢（改行区切り）</label><textarea id="rdItems" rows="4" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.82rem;font-family:inherit;resize:vertical;">Aさん&#10;Bさん&#10;Cさん&#10;Dさん</textarea></div></div><button class="calc-btn" onclick="execRandom()" style="margin-top:4px;">実行</button><div class="result-area visible" style="margin-top:10px;"><div id="rdResult" style="font-size:1.4rem;font-weight:900;text-align:center;padding:16px;letter-spacing:.05em;">—</div></div>`,

  bpm: () => `
  <div class="tool-input-row">
    <label>テンポ（BPM）</label>
    <div style="display:flex;align-items:center;gap:10px;">
      <input id="bpmVal" type="range" min="40" max="240" value="90" oninput="bpmSlide()" style="flex:1;">
      <div style="width:56px;text-align:right;font-weight:900;font-size:1.1rem;color:var(--blue);"><span id="bpmValNum">90</span></div>
    </div>
  </div>
  <div class="tool-input-pair">
    <div class="tool-input-row">
      <label>拍子</label>
      <select id="bpmBeats" onchange="bpmApplyIfPlaying()">
        <option value="2">2拍子（2/4）</option>
        <option value="3">3拍子（3/4）</option>
        <option value="4" selected>4拍子（4/4）</option>
        <option value="6">6拍子（6/8）</option>
      </select>
    </div>
    <div class="tool-input-row">
      <label>メトロノーム音</label>
      <select id="bpmMetroSound" onchange="bpmApplyIfPlaying()">
        <option value="click">電子音（クリック）</option>
        <option value="wood" selected>ウッドブロック</option>
        <option value="beep">ソフトビープ</option>
      </select>
    </div>
  </div>
  <div class="tool-input-pair">
    <div class="tool-input-row">
      <label>メトロノーム音量</label>
      <input id="bpmMetroVol" type="range" min="0" max="100" value="80" oninput="bpmApplyVolume()">
    </div>
    <div class="tool-input-row">
      <label>コード音量</label>
      <input id="bpmChordVol" type="range" min="0" max="100" value="80" oninput="bpmApplyVolume()">
    </div>
  </div>

  <div class="tool-input-row" style="text-align:center;margin:16px 0;">
    <button class="calc-btn" id="bpmStartBtn" style="font-size:1rem;" onclick="bpmToggle()">▶ メトロノーム開始</button>
    <div style="display:flex;gap:6px;justify-content:center;margin-top:10px;" id="bpmBeatDots"></div>
    <div id="bpmStateLabel" style="font-size:.72rem;color:var(--muted);margin-top:6px;"></div>
  </div>

  <div style="border-top:1.5px solid var(--border);margin:16px 0 14px;padding-top:14px;">
    <div style="font-size:.85rem;font-weight:900;margin-bottom:10px;">🎹 コード進行を鳴らす</div>
    <div class="tool-input-row">
      <label>進行パターン</label>
      <select id="bpmProgression" onchange="bpmOnProgressionChange()">
        <option value="oudou">王道進行（Ⅳ-Ⅴ-Ⅲm-Ⅵm）</option>
        <option value="canon">カノン進行（I-V-VIm-IIIm-IV-I-IV-V）</option>
        <option value="komuro">小室進行（Ⅵm-Ⅳ-Ⅰ-Ⅴ）</option>
        <option value="marusa">丸サ進行（I-VIm-IIm-V）</option>
        <option value="junkan">循環コード（Ⅰ-Ⅵm-Ⅳ-Ⅴ）</option>
        <option value="blues">ブルース進行（Ⅰ-Ⅳ-Ⅴ）</option>
        <option value="setsunai">切ない系進行（VIm-IV-V-VIm）</option>
        <option value="cliche">クリシェ進行（I-I/VII-I7/♭VII-VIm）</option>
      </select>
    </div>

    <div id="bpmProgressionSeq" style="display:flex;flex-wrap:wrap;gap:10px;margin:10px 0;"></div>

    <div class="tool-input-pair">
      <div class="tool-input-row">
        <label>キー</label>
        <div style="display:flex;gap:6px;">
          <select id="bpmKeyRoot" onchange="bpmApplyIfPlaying()" style="flex:1;">
            <option>C</option><option>C#</option><option>D</option><option>D#</option>
            <option>E</option><option>F</option><option>F#</option><option>G</option>
            <option>G#</option><option>A</option><option>A#</option><option>B</option>
          </select>
          <select id="bpmKeyMode" onchange="bpmApplyIfPlaying()" style="flex:1;">
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </div>
      </div>
      <div class="tool-input-row">
        <label>拍の長さ（1コードの保持）</label>
        <select id="bpmChordDur" onchange="bpmApplyIfPlaying()">
          <option value="whole" selected>全音符（1小節）</option>
          <option value="half">2分音符</option>
          <option value="quarter">4分音符</option>
          <option value="eighth">8分音符</option>
        </select>
      </div>
    </div>
    <div class="tool-input-pair">
      <div class="tool-input-row">
        <label>音色</label>
        <select id="bpmTimbre" onchange="bpmApplyIfPlaying()">
          <option value="soft" selected>ソフトパッド</option>
          <option value="piano">ピアノ</option>
          <option value="organ">オルガン</option>
          <option value="strings">ストリングス</option>
        </select>
      </div>
      <div class="tool-input-row">
        <label>演奏パターン</label>
        <select id="bpmPattern" onchange="bpmApplyIfPlaying()">
          <option value="block">ブロック（同時に鳴らす）</option>
          <option value="arpeggio-up">アルペジオ（上行）</option>
          <option value="arpeggio-updown">アルペジオ（上下）</option>
          <option value="rhythm">リズムカッティング</option>
        </select>
      </div>
    </div>
    <div class="tool-input-row" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <label style="margin:0;display:flex;align-items:center;gap:6px;font-size:.8rem;">
        <input type="checkbox" id="bpmChordsOn" checked onchange="bpmApplyIfPlaying()"> コード進行を再生に含める
      </label>
      <label style="margin:0;display:flex;align-items:center;gap:6px;font-size:.8rem;">
        開始前のカウント:
        <select id="bpmCountdown" onchange="bpmApplyIfPlaying()" style="width:auto;">
          <option value="0">なし</option>
          <option value="1">1小節</option>
          <option value="2">2小節</option>
        </select>
      </label>
    </div>

    <div style="font-size:.72rem;color:var(--muted);margin-top:10px;">🎼 各コードの構成音をト音記号（上声）＋ヘ音記号（ベース）の大譜表で表示。「最高音↓」「最低音↑」でその場で鳴る上声の音を動かせます（ベース音は固定・次回も記憶）</div>
  </div>
`,

  'char-count': ()=>`<div class="tool-input-row"><label>テキストを入力</label><textarea id="ccText" rows="5" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-size:.85rem;font-family:inherit;resize:vertical;" placeholder="ここにテキストを貼り付けてください..." oninput="calcCharCount()"></textarea></div><div class="result-area visible"><div class="result-grid"><div class="result-item"><div class="result-label">文字数（スペース含む）</div><div class="result-value" id="ccAll">0</div></div><div class="result-item"><div class="result-label">文字数（スペース除く）</div><div class="result-value" id="ccNoSp">0</div></div><div class="result-item"><div class="result-label">行数</div><div class="result-value" id="ccLines">0</div></div><div class="result-item"><div class="result-label">単語数（半角）</div><div class="result-value" id="ccWords">0</div></div><div class="result-item"><div class="result-label">バイト数（UTF-8）</div><div class="result-value" id="ccBytes">0</div></div><div class="result-item"><div class="result-label">段落数</div><div class="result-value" id="ccParas">0</div></div></div></div>`,

  age: ()=>`<div class="tool-input-row"><label>生年月日</label><input id="ageBirth" type="date" value="1990-01-01" oninput="calcAge()"></div><div class="tool-input-row"><label>基準日</label><input id="ageBase" type="date" oninput="calcAge()"><div style="font-size:.72rem;color:var(--muted);margin-top:3px;">空白で今日</div></div><div class="result-area visible"><div class="result-grid"><div class="result-item span2"><div class="result-label">年齢</div><div class="result-value" id="ageYear" style="font-size:1.3rem;">—<span class="unit">歳</span></div></div><div class="result-item"><div class="result-label">生後日数</div><div class="result-value" id="ageDays">—<span class="unit">日</span></div></div><div class="result-item"><div class="result-label">次の誕生日まで</div><div class="result-value" id="ageNext">—<span class="unit">日</span></div></div></div></div>`,

  'date-diff': ()=>`<div class="tool-input-pair"><div class="tool-input-row"><label>開始日</label><input id="ddFrom" type="date" oninput="calcDateDiff()"></div><div class="tool-input-row"><label>終了日</label><input id="ddTo" type="date" oninput="calcDateDiff()"></div></div><div class="result-area visible"><div class="result-grid"><div class="result-item span2"><div class="result-label">日数</div><div class="result-value" id="ddDays">—<span class="unit">日</span></div></div><div class="result-item"><div class="result-label">週数</div><div class="result-value" id="ddWeeks">—<span class="unit">週</span></div></div><div class="result-item"><div class="result-label">ヶ月（概算）</div><div class="result-value" id="ddMonths">—<span class="unit">ヶ月</span></div></div></div></div>`,

  'unit-conv': ()=>`<div class="tool-input-row"><label>カテゴリ</label><select id="ucCat" onchange="ucChangeCat()"><option value="length">長さ</option><option value="weight">重さ</option><option value="temp">温度</option><option value="area">面積</option><option value="speed">速さ</option></select></div><div class="tool-input-pair"><div class="tool-input-row"><label>変換元</label><div style="display:flex;gap:6px;"><input id="ucVal" type="number" value="1" oninput="calcUnitConv()" style="flex:1;"><select id="ucFrom" onchange="calcUnitConv()" style="flex:1;"></select></div></div><div class="tool-input-row"><label>変換先</label><div style="display:flex;gap:6px;"><div class="result-value" id="ucResult" style="flex:1;padding:8px 10px;background:var(--bg2);border-radius:8px;font-weight:700;">—</div><select id="ucTo" onchange="calcUnitConv()" style="flex:1;"></select></div></div></div>`,

  base64: ()=>`<div class="tool-input-row"><label>モード</label><div class="rate-grid"><button class="rate-btn on" id="b64Enc" onclick="b64SetMode('enc')">エンコード</button><button class="rate-btn" id="b64Dec" onclick="b64SetMode('dec')">デコード</button></div></div><div class="tool-input-row"><label>入力</label><textarea id="b64In" rows="4" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-size:.82rem;font-family:monospace;resize:vertical;" placeholder="テキストを入力..." oninput="calcBase64()"></textarea></div><div class="tool-input-row"><label>結果</label><div style="position:relative;"><textarea id="b64Out" rows="4" readonly style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-size:.82rem;font-family:monospace;resize:vertical;background:var(--bg2);"></textarea><button onclick="copyEl('b64Out')" style="position:absolute;top:6px;right:8px;padding:3px 10px;font-size:.72rem;border:1px solid var(--border);border-radius:6px;background:var(--white);cursor:pointer;">コピー</button></div></div>`,

  bmi: ()=>`<div class="tool-input-pair"><div class="tool-input-row"><label>身長</label><div class="with-unit"><input id="bmiH" type="number" value="170" min="100" max="250" oninput="calcBmi()"><span class="unit">cm</span></div></div><div class="tool-input-row"><label>体重</label><div class="with-unit"><input id="bmiW" type="number" value="65" min="20" max="200" oninput="calcBmi()"><span class="unit">kg</span></div></div></div><div class="result-area visible"><div class="result-grid"><div class="result-item span2"><div class="result-label">BMI</div><div class="result-value" id="bmiVal" style="font-size:1.3rem;">—</div></div><div class="result-item"><div class="result-label">判定</div><div class="result-value" id="bmiJudge">—</div></div><div class="result-item"><div class="result-label">標準体重</div><div class="result-value" id="bmiStd">—<span class="unit">kg</span></div></div></div></div>`,

  calorie: ()=>`<div class="tool-input-row"><label>性別</label><div class="rate-grid"><button class="rate-btn on" id="calMale" onclick="calSetGender('m')">男性</button><button class="rate-btn" id="calFemale" onclick="calSetGender('f')">女性</button></div></div><div class="tool-input-pair"><div class="tool-input-row"><label>年齢</label><div class="with-unit"><input id="calAge" type="number" value="30" min="15" max="80" oninput="calcCalorie()"><span class="unit">歳</span></div></div><div class="tool-input-row"><label>体重</label><div class="with-unit"><input id="calW" type="number" value="65" min="30" max="200" oninput="calcCalorie()"><span class="unit">kg</span></div></div></div><div class="tool-input-row"><label>身長</label><div class="with-unit"><input id="calH" type="number" value="170" min="120" max="220" oninput="calcCalorie()"><span class="unit">cm</span></div></div><div class="tool-input-row"><label>活動レベル</label><select id="calAct" onchange="calcCalorie()"><option value="1.2">ほぼ座りっぱなし（デスクワーク）</option><option value="1.375" selected>軽い運動（週1〜3回）</option><option value="1.55">中程度の運動（週3〜5回）</option><option value="1.725">激しい運動（週6〜7回）</option><option value="1.9">非常に激しい（アスリート）</option></select></div><div class="result-area visible"><div class="result-grid"><div class="result-item span2"><div class="result-label">1日の推定消費カロリー（TDEE）</div><div class="result-value" id="calTdee" style="font-size:1.3rem;">—<span class="unit">kcal</span></div></div><div class="result-item"><div class="result-label">基礎代謝（BMR）</div><div class="result-value" id="calBmr">—<span class="unit">kcal</span></div></div><div class="result-item"><div class="result-label">体重維持カロリー</div><div class="result-value" id="calMaint">—<span class="unit">kcal</span></div></div></div></div>`,

  'body-fat': ()=>`<div class="tool-input-row"><label>性別</label><div class="rate-grid"><button class="rate-btn on" id="bfMale" onclick="bfSetGender('m')">男性</button><button class="rate-btn" id="bfFemale" onclick="bfSetGender('f')">女性</button></div></div><div class="tool-input-pair"><div class="tool-input-row"><label>身長</label><div class="with-unit"><input id="bfH" type="number" value="170" min="100" max="250" oninput="calcBodyFat()"><span class="unit">cm</span></div></div><div class="tool-input-row"><label>体重</label><div class="with-unit"><input id="bfW" type="number" value="65" min="20" max="200" oninput="calcBodyFat()"><span class="unit">kg</span></div></div></div><div class="tool-input-pair"><div class="tool-input-row"><label>腹囲</label><div class="with-unit"><input id="bfWaist" type="number" value="80" min="40" max="200" oninput="calcBodyFat()"><span class="unit">cm</span></div></div><div class="tool-input-row"><label>首回り</label><div class="with-unit"><input id="bfNeck" type="number" value="37" min="20" max="70" oninput="calcBodyFat()"><span class="unit">cm</span></div></div></div><div id="bfHipRow" style="display:none" class="tool-input-row"><label>ヒップ</label><div class="with-unit"><input id="bfHip" type="number" value="90" min="40" max="200" oninput="calcBodyFat()"><span class="unit">cm</span></div></div><div class="result-area visible"><div class="result-grid"><div class="result-item span2"><div class="result-label">体脂肪率（推定）</div><div class="result-value" id="bfPct" style="font-size:1.3rem;">—<span class="unit">%</span></div></div><div class="result-item"><div class="result-label">脂肪量</div><div class="result-value" id="bfMass">—<span class="unit">kg</span></div></div><div class="result-item"><div class="result-label">除脂肪体重</div><div class="result-value" id="bfLean">—<span class="unit">kg</span></div></div></div><p style="font-size:.68rem;color:var(--muted);margin:4px 0 0;">※米海軍式（体周囲径法）による推定値</p></div>`,

  currency: ()=>`<div class="tool-input-pair"><div class="tool-input-row"><label>金額</label><input id="curAmt" type="number" value="1" min="0" oninput="calcCurrency()"></div><div class="tool-input-row"><label>通貨</label><select id="curFrom" onchange="calcCurrency()"><option value="JPY">JPY 日本円</option><option value="USD" selected>USD 米ドル</option><option value="EUR">EUR ユーロ</option><option value="GBP">GBP 英ポンド</option><option value="CNY">CNY 中国元</option><option value="KRW">KRW 韓国ウォン</option><option value="AUD">AUD 豪ドル</option><option value="CAD">CAD カナダドル</option><option value="CHF">CHF スイスフラン</option><option value="SGD">SGD シンガポールドル</option><option value="HKD">HKD 香港ドル</option><option value="THB">THB タイバーツ</option></select></div></div><div id="curResult" class="result-area visible"><div style="text-align:center;padding:12px;color:var(--muted);font-size:.8rem;">レートを取得中...</div></div><div style="font-size:.68rem;color:var(--muted);margin-top:4px;">※ exchangerate-api.com 無料レート（日次更新）</div>`,

  color: ()=>`<div class="tool-input-pair"><div class="tool-input-row"><label>カラーピッカー</label><input id="clrPick" type="color" value="#3b82f6" oninput="syncColor('pick')" style="width:100%;height:44px;padding:2px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;"></div><div class="tool-input-row"><label>HEX</label><input id="clrHex" type="text" value="#3b82f6" maxlength="7" oninput="syncColor('hex')" style="font-family:monospace;letter-spacing:.05em;text-transform:uppercase;"></div></div><div class="result-area visible"><div class="result-grid"><div class="result-item"><div class="result-label">RGB</div><div class="result-value" id="clrRgb" style="font-family:monospace;font-size:.85rem;">—</div></div><div class="result-item"><div class="result-label">HSL</div><div class="result-value" id="clrHsl" style="font-family:monospace;font-size:.85rem;">—</div></div><div class="result-item"><div class="result-label">CMYK（概算）</div><div class="result-value" id="clrCmyk" style="font-family:monospace;font-size:.85rem;">—</div></div><div class="result-item"><div class="result-label">明度</div><div class="result-value" id="clrLum">—</div></div></div><div id="clrPreview" style="margin-top:10px;height:40px;border-radius:8px;border:1px solid var(--border);transition:background .15s;"></div></div>`,

  pomodoro: ()=>`<div style="text-align:center;padding:8px 0 4px;"><div id="pomDisplay" style="font-size:3rem;font-weight:900;font-family:monospace;letter-spacing:.05em;color:var(--text);">25:00</div><div id="pomLabel" style="font-size:.8rem;color:var(--muted);margin-top:2px;">作業時間</div></div><div style="display:flex;gap:8px;justify-content:center;margin:12px 0;"><button id="pomStartBtn" class="calc-btn" style="width:auto;padding:8px 24px;" onclick="pomToggle()">▶ スタート</button><button class="calc-btn" style="width:auto;padding:8px 16px;background:var(--bg);color:var(--text);border:1.5px solid var(--border);" onclick="pomReset()">リセット</button></div><div class="tool-input-pair" style="margin-top:4px;"><div class="tool-input-row"><label>作業（分）</label><input id="pomWork" type="number" value="25" min="1" max="60" oninput="pomReset()"></div><div class="tool-input-row"><label>休憩（分）</label><input id="pomBreak" type="number" value="5" min="1" max="30" oninput="pomReset()"></div></div><div class="result-area visible" style="margin-top:4px;"><div class="result-grid"><div class="result-item"><div class="result-label">完了セット数</div><div class="result-value" id="pomSets">0</div></div><div class="result-item"><div class="result-label">フェーズ</div><div class="result-value" id="pomPhase">作業中</div></div></div></div>`,

  qr: ()=>`<div class="tool-input-row"><label>テキスト / URL</label><textarea id="qrText" rows="3" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-size:.85rem;font-family:inherit;resize:vertical;" placeholder="URLやテキストを入力..." oninput="genQr()"></textarea></div><div class="tool-input-row"><label>サイズ</label><div class="rate-grid"><button class="rate-btn" id="qr150" onclick="qrSetSize(150)">小</button><button class="rate-btn on" id="qr200" onclick="qrSetSize(200)">中</button><button class="rate-btn" id="qr300" onclick="qrSetSize(300)">大</button></div></div><div class="result-area visible" style="text-align:center;padding:16px 0;"><div id="qrOut"><div style="color:var(--muted);font-size:.82rem;">テキストを入力するとQRコードが表示されます</div></div><a id="qrDl" style="display:none;margin-top:10px;padding:6px 18px;background:var(--blue);color:#fff;border-radius:8px;font-size:.78rem;text-decoration:none;display:inline-block;" download="qrcode.png">ダウンロード</a></div>`,

  shorten: () => `
    <div class="tool-input-row">
      <label>短縮したいURL</label>
      <input id="shUrl" type="url" placeholder="https://example.com/very/long/path" oninput="shClearResult()" onkeydown="if(event.key==='Enter')shRun()">
    </div>
    <div class="tool-input-row">
      <label>短縮サービス</label>
      <div class="rate-grid" id="shServiceGrid">
        <button class="rate-btn on" id="shSvc-tinyurl" onclick="shSetService('tinyurl')">TinyURL</button>
        <button class="rate-btn" id="shSvc-dagd" onclick="shSetService('dagd')">da.gd</button>
      </div>
    </div>
    <div class="tool-input-row" style="text-align:center;margin:14px 0 4px;">
      <button class="calc-btn" id="shBtn" style="font-size:1rem;" onclick="shRun()">短縮する</button>
    </div>
    <div id="shError" style="display:none;color:#dc2626;font-size:.78rem;text-align:center;margin-top:6px;"></div>
    <div class="result-area" id="shResultArea">
      <div style="background:var(--bg);border-radius:10px;padding:14px 16px;font-family:monospace;font-size:.95rem;word-break:break-all;color:var(--blue);cursor:pointer;" id="shOutput" onclick="shCopy()" title="クリックでコピー">—</div>
      <div style="text-align:right;margin-top:6px;display:flex;gap:8px;justify-content:flex-end;">
        <button class="calc-btn" style="width:auto;padding:7px 18px;font-size:.8rem;background:var(--bg);color:var(--blue);border:1.5px solid var(--blue);" onclick="shCopy()">コピー</button>
      </div>
    </div>
    <div id="shServiceNote" style="font-size:.68rem;color:var(--muted);text-align:center;margin-top:12px;">TinyURL の無料APIを利用しています。短縮URLは第三者が発行するリンクです。</div>`,

  default: (t)=>`<div style="text-align:center;padding:32px 16px;color:var(--muted);"><div style="font-size:2.5rem;margin-bottom:12px;">${t.icon}</div><div style="font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:6px;">${t.name}</div><div style="font-size:.8rem;">このツールは準備中です。近日公開予定。</div></div>`,



};



const KJ_STROKES={'一':1,'二':2,'人':2,'入':2,'八':2,'力':2,'刀':2,'十':2,'又':2,'丁':2,'乃':2,'了':2,'九':2,'七':2,'三':3,'山':3,'川':3,'大':3,'小':3,'上':3,'下':3,'子':3,'女':3,'土':3,'工':3,'千':3,'万':3,'久':3,'口':3,'干':3,'夕':3,'丸':3,'己':3,'弓':3,'士':3,'也':3,'刃':3,'凡':3,'寸':3,'才':3,'之':3,'亡':3,'巾':3,'中':4,'仁':4,'友':4,'太':4,'元':4,'公':4,'今':4,'心':4,'手':4,'文':4,'天':4,'水':4,'火':4,'木':4,'王':4,'介':4,'日':4,'月':4,'午':4,'切':4,'内':4,'父':4,'片':4,'予':4,'化':4,'比':4,'分':4,'止':4,'牛':4,'円':4,'互':4,'匹':4,'升':4,'斗':4,'欠':4,'勾':4,'允':4,'云':4,'巴':4,'爪':4,'世':5,'主':5,'市':5,'田':5,'本':5,'以':5,'右':5,'生':5,'央':5,'平':5,'弘':5,'礼':5,'末':5,'白':5,'石':5,'目':5,'永':5,'玄':5,'甲':5,'申':5,'用':5,'由':5,'立':5,'令':5,'仙':5,'外':5,'左':5,'矢':5,'台':5,'出':5,'加':5,'功':5,'北':5,'代':5,'可':5,'史':5,'司':5,'叶':5,'句':5,'古':5,'号':5,'広':5,'必':5,'正':5,'民':5,'玉':5,'冬':5,'且':5,'兄':5,'冊':5,'処':5,'圧':5,'尼':5,'六':6,'光':6,'年':6,'好':6,'在':6,'名':6,'多':6,'字':6,'安':6,'守':6,'宇':6,'成':6,'次':6,'行':6,'全':6,'伊':6,'色':6,'西':6,'両':6,'共':6,'吉':6,'地':6,'存':6,'宅':6,'竹':6,'糸':6,'羊':6,'老':6,'曲':6,'有':6,'朱':6,'江':6,'求':6,'百':6,'自':6,'回':6,'妃':6,'如':6,'寺':6,'帆':6,'式':6,'当':6,'早':6,'旭':6,'杉':6,'机':6,'汀':6,'池':6,'沙':6,'灰':6,'羽':6,'舟':6,'芳':6,'邦':6,'亘':6,'圭':6,'壮':6,'宗':6,'朴':6,'汐':6,'汝':6,'沢':6,'灯':6,'至':6,'臣':6,'団':6,'芝':6,'花':7,'言':7,'足':7,'車':7,'来':7,'何':7,'体':7,'作':7,'私':7,'君':7,'里':7,'村':7,'林':7,'男':7,'谷':7,'形':7,'豆':7,'貝':7,'赤':7,'走':7,'身':7,'近':7,'位':7,'住':7,'佐':7,'余':7,'兵':7,'克':7,'初':7,'利':7,'助':7,'孝':7,'完':7,'宏':7,'寿':7,'尾':7,'岐':7,'岡':7,'岩':7,'希':7,'序':7,'弟':7,'杏':7,'材':7,'杜':7,'束':7,'沖':7,'泉':7,'秀':7,'芹':7,'役':7,'努':7,'医':7,'吹':7,'坂':7,'妙':7,'妥':7,'妊':7,'妨':7,'孜':7,'巡':7,'局':7,'岑':7,'沿':7,'牡':7,'牧':7,'社':7,'那':7,'防':7,'汪':7,'灼':7,'明':8,'長':8,'東':8,'知':8,'和':8,'其':8,'京':8,'依':8,'佳':8,'典':8,'具':8,'制':8,'固':8,'夜':8,'奈':8,'実':8,'宙':8,'岳':8,'岸':8,'幸':8,'弦':8,'征':8,'忠':8,'昌':8,'昇':8,'昔':8,'昭':8,'旺':8,'枝':8,'松':8,'武':8,'河':8,'治':8,'波':8,'注':8,'炎':8,'玲':8,'直':8,'育':8,'茂':8,'茜':8,'果':8,'周':8,'宝':8,'妹':8,'姉':8,'官':8,'侍':8,'刻':8,'奉':8,'奇':8,'妻':8,'孟':8,'季':8,'岬':8,'拓':8,'昂':8,'欧':8,'沼':8,'炉':8,'居':8,'技':8,'扶':8,'斉':8,'杭':8,'枕':8,'泰':8,'盲':8,'空':8,'若':8,'茄':8,'茎':8,'茶':8,'草':8,'芽':8,'虎':8,'表':8,'迪':8,'阜':8,'阿':8,'佑':8,'受':8,'呼':8,'垂':8,'弥':8,'承':8,'枚':8,'板':8,'炊':8,'狛':8,'南':9,'星':9,'春':9,'紅':9,'英':9,'後':9,'思':9,'保':9,'信':9,'亮':9,'俊':9,'則':9,'勇':9,'品':9,'宣':9,'室':9,'建':9,'律':9,'昼':9,'柄':9,'柏':9,'栄':9,'洗':9,'洞':9,'洲':9,'珊':9,'珍':9,'皆':9,'相':9,'省':9,'砂':9,'紀':9,'研':9,'約':9,'美':9,'首':9,'香':9,'便':9,'城':9,'屋':9,'恒':9,'指':9,'是':9,'柱':9,'柳':9,'洋':9,'活':9,'界':9,'厚':9,'咲':9,'哉':9,'奏':9,'型':9,'拳':9,'政':9,'染':9,'柚':9,'柾':9,'桁':9,'洪':9,'津':9,'派':9,'珂':9,'珀':9,'皇':9,'盾':9,'眉':9,'神':9,'竿':9,'苑':9,'荒':9,'荘':9,'軍':9,'重':9,'俗':9,'促':9,'削':9,'勉':9,'垣':9,'帯':9,'冠':9,'帝':9,'秋':9,'高':10,'原':10,'海':10,'家':10,'真':10,'桜':10,'修':10,'剛':10,'兼':10,'凌':10,'唐':10,'埋':10,'姫':10,'宰':10,'宴':10,'容':10,'展':10,'峰':10,'峯':10,'島':10,'師':10,'恵':10,'悦':10,'時':10,'晃':10,'晄':10,'朗':10,'栗':10,'格':10,'桂':10,'桐':10,'桑':10,'浩':10,'浪':10,'涙':10,'特':10,'祐':10,'紋':10,'翁':10,'脈':10,'能':10,'航':10,'記':10,'訓':10,'通':10,'速':10,'郎':10,'都':10,'隼':10,'剣':10,'倫':10,'倉':10,'倖':10,'倶':10,'員':10,'宵':10,'宸':10,'差':10,'席':10,'恋':10,'旅':10,'晋':10,'梅':10,'浦':10,'烈':10,'珪':10,'珠':10,'珥':10,'秩':10,'紘':10,'索':10,'般':10,'討':10,'郡':10,'配':10,'針':10,'馬':10,'俸':10,'党':10,'哲':10,'望':11,'清':11,'理':11,'崎':11,'健':11,'啓':11,'堂':11,'基':11,'常':11,'悠':11,'梨':11,'梧':11,'淳':11,'深':11,'渉':11,'渓':11,'球':11,'産':11,'略':11,'異':11,'盛':11,'移':11,'笹':11,'絆':11,'絵':11,'統':11,'翌':11,'脩':11,'舵':11,'菊':11,'菖':11,'菜':11,'著':11,'訪':11,'連':11,'野':11,'雀':11,'雅':11,'雪':11,'魚':11,'鹿':11,'敏':11,'堀':11,'康':11,'張':11,'教':11,'淀':11,'準':11,'笛':11,'鳥':11,'麻':11,'彩':11,'習':11,'液':11,'率':11,'累':11,'頃':11,'混':11,'景':12,'晴':12,'智':12,'湖':12,'渡':12,'紫':12,'間':12,'陽':12,'雄':12,'喜':12,'勝':12,'博':12,'富':12,'寛':12,'尊':12,'就':12,'幾':12,'敬':12,'最':12,'晶':12,'森':12,'棟':12,'植':12,'湘':12,'湛':12,'満':12,'湧':12,'煌':12,'無':12,'琢':12,'琳':12,'童':12,'筑':12,'結':12,'絢':12,'翔':12,'葵':12,'象':12,'貴':12,'須':12,'越':12,'雲':12,'順':12,'黄':12,'喬':12,'嵐':12,'境':12,'察':12,'掌':12,'焦':12,'短':12,'等':12,'策':12,'筋':12,'賀':12,'道':12,'飯':12,'巣':12,'普':12,'照':13,'義':13,'楽':13,'新':13,'源':13,'滋':13,'福':13,'輝':13,'愛':13,'誠':13,'幹':13,'廉':13,'想':13,'楠':13,'歌':13,'滝':13,'煉':13,'瑛':13,'瑠':13,'碧':13,'稔':13,'経':13,'絹':13,'聖':13,'詩':13,'豊':13,'農':13,'逢':13,'頌':13,'鼓':13,'楼':13,'歳':13,'滑':13,'溝':13,'弾':13,'楷':13,'滅':13,'蒼':13,'徳':14,'静':14,'夢':14,'漢':14,'維':14,'綾':14,'翠':14,'聡':14,'豪':14,'銀':14,'領':14,'駒':14,'嫡':14,'彰':14,'徹':14,'漁':14,'漆':14,'漫':14,'瑶':14,'碑':14,'精':14,'緒':14,'緑':14,'総':14,'語':14,'誰':14,'際':14,'障':14,'飾':14,'誕':14,'需':14,'颯':14,'賢':15,'潤':15,'慶':15,'樹':15,'稲':15,'遥':15,'穂':15,'郷':15,'権':15,'横':15,'璃':15,'確':15,'稼':15,'練':15,'震':15,'熟':15,'論':15,'遵':15,'龍':16,'薫':16,'頼':16,'暁':16,'澄':16,'錦':16,'橘':16,'壁':16,'奮':16,'激':16,'濁':16,'燃':16,'積':16,'篤':16,'藩':16,'錬':16,'駿':16,'優':17,'謙':17,'環':17,'翼':17,'織':18,'騎':18,'藤':18,'鎌':18,'麗':19,'蘭':19,'響':20,'鑑':23};



const KJ_FORTUNE={1:{r:'大吉',t:'最高の吉数。物事の始まりを意味し、強い意志と行動力で大きな成功を収める。'},2:{r:'凶',t:'孤独や分離を暗示する数。協調性を大切にすることで困難を乗り越えられる。'},3:{r:'大吉',t:'明朗快活で才能豊かな数。創造力と社交性で多くの人に愛され繁栄する。'},4:{r:'凶',t:'苦労を伴う数。地道な努力を続けることで少しずつ道が開ける。'},5:{r:'大吉',t:'五行の中心を表す安定と発展の数。粘り強さと統率力で大きな目標を達成する。'},6:{r:'大吉',t:'家庭や愛情に恵まれる数。人望が厚く、協力者を得て着実に成功する。'},7:{r:'吉',t:'精神的な強さを持つ勝利の数。独自のセンスと探求心で特技を磨き成功する。'},8:{r:'大吉',t:'堅実な努力が実を結ぶ数。粘り強さと行動力で困難を乗り越え大成する。'},9:{r:'凶',t:'完成と終わりを表す数。変化への適応が求められ、精神的な成熟が鍵となる。'},10:{r:'凶',t:'一つの区切りを示す数。気持ちの浮き沈みが激しく、安定を求める努力が必要。'},11:{r:'大吉',t:'直感力と霊感に恵まれた数。理想を高く持ち、独創的な才能で道を切り開く。'},12:{r:'凶',t:'孤独になりやすい数。周囲の理解を得るため、積極的なコミュニケーションが大切。'},13:{r:'大吉',t:'変革と創造の数。柔軟な発想と行動力で時代の流れを先取りして成功する。'},14:{r:'凶',t:'波乱が多い数。自由を求める反面、根気と一貫性を持つことが成功への鍵。'},15:{r:'大吉',t:'温かみと人気を誇る数。誠実さと親切心で周囲に慕われ、幸運を引き寄せる。'},16:{r:'大吉',t:'人徳に恵まれる数。強いリーダーシップと包容力で多くの人を引きつける。'},17:{r:'吉',t:'勇気と決断力の数。強い意志で困難を突破し、自分の道を切り開いていく。'},18:{r:'吉',t:'発展と活力の数。積極的な行動力で事業や夢を大きく発展させる力がある。'},19:{r:'凶',t:'孤独な成功者の数。自力で道を切り開く力がある一方、孤立に注意が必要。'},20:{r:'凶',t:'感受性が豊かな数。芸術的才能があるが、感情の起伏に左右されやすい。'},21:{r:'大吉',t:'独立と成功の数。強い意志と自立心で困難を乗り越え、独自の道を拓く。'},22:{r:'凶',t:'苦労が多い数。努力の割に報われにくいが、周囲への気配りが幸運を招く。'},23:{r:'大吉',t:'才気あふれる数。頭脳明晰で行動力もあり、若くして大きな成功を収める。'},24:{r:'大吉',t:'財運と人気に恵まれる数。誠実な人柄で信頼を集め、物事が順調に進む。'},25:{r:'大吉',t:'独創性と才能の数。個性的な発想で新しい分野を切り開き、名声を得る。'},26:{r:'凶',t:'波乱万丈の数。人の縁に翻弄されやすく、自分の軸をしっかり持つことが大切。'},27:{r:'吉',t:'知性と誇りの数。高い理想を持ち、自分の信念を貫くことで道が開ける。'},28:{r:'凶',t:'人間関係に苦労する数。信頼できる人を見極める目と粘り強さが必要。'},29:{r:'大吉',t:'知恵と決断の数。頭脳と行動力を兼ね備え、困難な状況でも活路を見出す。'},30:{r:'半吉',t:'賭けの数。直感を信じて行動するが吉凶が半々で、慎重さも必要。'},31:{r:'大吉',t:'人望に厚い数。温厚で信頼される人柄が多くの協力者を呼び、大成する。'},32:{r:'大吉',t:'幸運に恵まれる数。人との縁を大切にすることで思わぬ幸運が舞い込む。'},33:{r:'大吉',t:'才能輝く数。創造力と魅力で人を惹きつけ、芸術や文化の分野で活躍する。'},34:{r:'凶',t:'苦難の数。困難が多いが、逆境に強く、乗り越えるたびに人間的に成長する。'},35:{r:'大吉',t:'温和な繁栄の数。穏やかな性格と着実な努力で、安定した幸せを得る。'},36:{r:'凶',t:'英雄が苦労する数。才能はあるが周囲との摩擦が多く、協調性を磨くことが大切。'},37:{r:'大吉',t:'実力と人徳を兼ね備えた数。自力で道を切り開き、多くの人に認められる。'},38:{r:'凶',t:'苦労が多い数。努力が実を結ぶまでに時間がかかるが、諦めない心が大切。'},39:{r:'大吉',t:'才知に富む指導者の数。優れたリーダーシップで周囲を牽引し、大きな成果を上げる。'},40:{r:'凶',t:'孤独を感じやすい数。自分の才能を信じて地道に積み重ねることで道が開ける。'},41:{r:'大吉',t:'誠実で謙虚な人柄が信頼を集め、時間をかけて着実に成功する。'},42:{r:'凶',t:'苦難の数。波乱が多く苦労しやすいが、強い精神力で乗り越えられる。'},43:{r:'凶',t:'散財しやすい数。金銭管理を徹底し、計画的に物事を進めることが重要。'},44:{r:'凶',t:'労苦が多い数。努力は認められにくいが、誠実に積み重ねることで信頼を得る。'},45:{r:'大吉',t:'人格者の数。誠実で思いやりのある人柄が周囲から慕われ、高い地位に就く。'},46:{r:'凶',t:'孤独と苦労の数。精神的な強さと周囲への感謝の気持ちが幸運を招く。'},47:{r:'大吉',t:'自力で道を拓く数。強い意志と行動力で困難を乗り越え、晩年に大成する。'},48:{r:'大吉',t:'知恵と財力の数。優れた判断力と誠実さで信頼を集め、社会的成功を得る。'},49:{r:'凶',t:'苦悩が多い数。理想と現実のギャップに悩むが、柔軟な対応で道が開ける。'},50:{r:'凶',t:'吉凶半々の数。慎重な判断と行動力のバランスが成功を左右する。'},51:{r:'吉',t:'再起の数。困難を乗り越えた先に大きな成果が待っている。'},52:{r:'大吉',t:'統率力の数。組織を率いる力があり、多くの人の支持を得て成功する。'},53:{r:'凶',t:'波乱が多い数。変化に翻弄されやすいが、信念を持ち続けることが大切。'},54:{r:'凶',t:'苦労が多い数。地道な努力を続けることで少しずつ状況が改善される。'},55:{r:'凶',t:'大器晩成の数。若いうちは苦労が多いが、経験を積むにつれて力を発揮する。'},56:{r:'凶',t:'意志が揺れやすい数。自分の軸をしっかり持ち、流されない強さが必要。'},57:{r:'大吉',t:'努力報われる数。粘り強く取り組むことで、必ず結果がついてくる。'},58:{r:'大吉',t:'大器晩成の数。時間をかけて力を蓄え、後半の人生で大きな飛躍を遂げる。'},59:{r:'凶',t:'苦難の連続の数。困難に負けず前に進む勇気が最終的な成功をもたらす。'},60:{r:'凶',t:'吉凶が入り乱れる数。安定した生活基盤を築くことが幸運への近道。'},61:{r:'大吉',t:'温情と知性の数。人情味あふれる人柄で多くの人に慕われ、社会で活躍する。'},62:{r:'凶',t:'孤立しやすい数。自分の才能を周囲に認めてもらう努力が必要。'},63:{r:'大吉',t:'繁栄と安定の数。誠実な努力と人徳で、家庭・仕事ともに安定した幸せを得る。'},64:{r:'凶',t:'苦難が多い数。困難な状況でも諦めない粘り強さが将来の成功につながる。'},65:{r:'大吉',t:'吉祥の数。穏やかで慈悲深い人柄が周囲から愛され、幸運に恵まれる。'},66:{r:'凶',t:'物事を前向きに捉える思考習慣が運気を向上させる鍵となる。'},67:{r:'吉',t:'確かな力を持つ数。着実な努力と忍耐力で、自分の分野で確固たる地位を築く。'},68:{r:'大吉',t:'財運豊かな数。実力と人徳を兼ね備え、事業や職業で大きな成功を収める。'},69:{r:'凶',t:'苦難が続く数。精神的な成熟と周囲への感謝の気持ちが状況を好転させる。'},70:{r:'凶',t:'空虚な数。形にとらわれず、本質を見極める目を養うことが大切。'},71:{r:'凶',t:'停滞しやすい数。新しい挑戦への勇気と行動力が現状打破につながる。'},72:{r:'凶',t:'苦労が多い数。周囲との協力を大切にし、支え合うことで道が開ける。'},73:{r:'凶',t:'慎重な思考と信頼できる人への相談が助けになる数。'},74:{r:'凶',t:'苦難の数。逆境を成長の機会と捉えることができれば、大きく飛躍できる。'},75:{r:'凶',t:'基盤をしっかり固めることが長期的な幸福への道となる数。'},76:{r:'凶',t:'波乱が多い数。自分の信念を持ち、ブレない軸を作ることが安定につながる。'},77:{r:'凶',t:'過去から学ぶ姿勢が大切な数。同じ失敗を繰り返さない積み重ねが成功につながる。'},78:{r:'凶',t:'晩成の数。焦らず自分のペースで積み重ねることで、後に大きな成果が出る。'},79:{r:'凶',t:'誠実さと粘り強さを持ち続けることで道は必ず開ける数。'},80:{r:'凶',t:'外見より内面を磨き、本質的な価値を追求することが大切な数。'},81:{r:'大吉',t:'最高の幸運数。一の力に戻る円満な数で、生涯にわたって幸福と繁栄が続く。'}};







/* ── 計算ロジック ── */



let taxRate=10;



function setRate(r){taxRate=r;document.getElementById('tax8').classList.toggle('on',r===8);document.getElementById('tax10').classList.toggle('on',r===10);calcTax();}



function calcTax(){const amt=parseFloat(document.getElementById('taxAmt')?.value)||0;const mode=document.getElementById('taxMode')?.value;const rate=taxRate/100;let ex,tax,inc;if(mode==='ex'){ex=amt;tax=Math.round(amt*rate);inc=ex+tax;}else{inc=amt;ex=Math.round(inc/(1+rate));tax=inc-ex;}const fmt=n=>n.toLocaleString();const set=(id,v)=>{const el=document.getElementById(id);if(el)el.innerHTML=`${fmt(v)}<span class="unit">円</span>`;};set('taxEx',ex);set('taxAmt2',tax);set('taxIn',inc);}



function calcWarikan(){const total=parseFloat(document.getElementById('wTotal')?.value)||0;const ppl=parseInt(document.getElementById('wPeople')?.value)||1;const mode=document.getElementById('wRound')?.value||'round';let per;if(mode==='round')per=Math.round(total/ppl);else if(mode==='ceil')per=Math.ceil(total/ppl);else per=Math.floor(total/ppl);const collect=per*ppl;const rem=Math.abs(collect-total);const fmt=n=>n.toLocaleString();const set=(id,v)=>{const el=document.getElementById(id);if(el)el.innerHTML=`${fmt(v)}<span class="unit">円</span>`;};set('wPer',per);set('wCollect',collect);set('wRem',rem);}



function calcLoan(){const P=(parseFloat(document.getElementById('lAmount')?.value)||0)*10000;const r=(parseFloat(document.getElementById('lRate')?.value)||0)/100/12;const n=(parseInt(document.getElementById('lYears')?.value)||1)*12;if(P<=0||n<=0)return;const monthly=r>0?P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):P/n;const total=monthly*n;const interest=total-P;const set=(id,v,u)=>{const el=document.getElementById(id);if(el)el.innerHTML=`${v}<span class="unit">${u}</span>`;};set('lMonthly',Math.round(monthly).toLocaleString(),'円');set('lTotal',(total/10000).toFixed(1),'万円');set('lInterest',(interest/10000).toFixed(1),'万円');}

let tdAge=39;

function setTdAge(a){tdAge=a;document.getElementById('td39').classList.toggle('on',a<40);document.getElementById('td40').classList.toggle('on',a>=40);calcTedori();}

function tdKyuyoKojo(ag,minimum,minUpTo){if(ag<=minUpTo)return minimum;if(ag<=3600000)return ag*0.3+80000;if(ag<=6600000)return ag*0.2+440000;if(ag<=8500000)return ag*0.1+1100000;return 1950000;}
function tdKisoKojo(shotoku){if(shotoku<=4890000)return 1040000;if(shotoku<=6550000)return 670000;if(shotoku<=23500000)return 620000;if(shotoku<=24000000)return 480000;if(shotoku<=24500000)return 320000;if(shotoku<=25000000)return 160000;return 0;}
function calcTedori(){
  const g=(parseFloat(document.getElementById('tdGross')?.value)||0)*10000;
  if(g<=0){['tdHi','tdPe','tdEi','tdTx','tdRt','tdNet'].forEach(function(id){var el=document.getElementById(id);if(el)el.innerHTML='—<span class="unit">円</span>';});return;}
  // 2026年度 協会けんぽ東京都（本人負担）: 健保9.85%/2・介護1.62%/2・子ども子育て支援金0.23%/2、厚生年金18.3%/2（標準報酬月額の上限65万円）、雇用保険0.5%
  const hi=Math.round(g*0.04925);
  const kai=tdAge>=40?Math.round(g*0.0081):0;
  const shien=Math.round(g*0.00115);
  const pe=Math.round(Math.min(g,650000)*0.0915);
  const ei=Math.round(g*0.005);
  const ins=(hi+kai+shien+pe+ei)*12;
  const ag=g*12;
  // 所得税: 令和8年分（給与所得控除の最低74万円・基礎控除の特例）
  const shotoku=Math.max(0,ag-tdKyuyoKojo(ag,740000,2200000));
  const taxable=Math.floor(Math.max(0,shotoku-ins-tdKisoKojo(shotoku))/1000)*1000;
  let itax;if(taxable<=1950000)itax=taxable*0.05;else if(taxable<=3300000)itax=taxable*0.1-97500;else if(taxable<=6950000)itax=taxable*0.2-427500;else if(taxable<=9000000)itax=taxable*0.23-636000;else if(taxable<=18000000)itax=taxable*0.33-1536000;else itax=taxable*0.4-2796000;
  const itaxM=Math.round(Math.max(0,itax)*1.021/12);
  // 住民税: 給与所得控除は最低65万円、基礎控除43万円、所得割10%＋均等割等5,000円/年
  const rTaxable=Math.max(0,ag-tdKyuyoKojo(ag,650000,1900000)-ins-430000);
  const rtaxM=Math.round((rTaxable*0.1+5000)/12);
  const net=g-(hi+kai+shien)-pe-ei-itaxM-rtaxM;
  const fmt=function(n){return Math.max(0,Math.round(n)).toLocaleString('ja-JP');};
  const set=function(id,v){var el=document.getElementById(id);if(el)el.innerHTML=fmt(v)+'<span class="unit">円</span>';};
  set('tdHi',hi+kai+shien);set('tdPe',pe);set('tdEi',ei);set('tdTx',itaxM);set('tdRt',rtaxM);
  var nel=document.getElementById('tdNet');if(nel)nel.innerHTML=fmt(net)+'<span class="unit">円</span>';
}



let clockInterval=null;



const WC_PINS=[
  {id:'Asia/Tokyo',      name:'東京',         lon:139.69, lat:35.68,  ax:'end',    dx:-7},
  {id:'Asia/Shanghai',   name:'北京',         lon:116.39, lat:39.90,  ax:'end',    dx:-7},
  {id:'Asia/Singapore',  name:'シンガポール',  lon:103.82, lat:1.35,   ax:'middle', dx:0},
  {id:'Asia/Dubai',      name:'ドバイ',        lon:55.27,  lat:25.20,  ax:'end',    dx:-7},
  {id:'Asia/Kolkata',    name:'ムンバイ',      lon:72.87,  lat:19.08,  ax:'start',  dx:7},
  {id:'Europe/Moscow',   name:'モスクワ',      lon:37.62,  lat:55.75,  ax:'start',  dx:7},
  {id:'Europe/London',   name:'ロンドン',      lon:-0.13,  lat:51.51,  ax:'end',    dx:-7},
  {id:'America/New_York',name:'NY',           lon:-74.01, lat:40.71,  ax:'end',    dx:-7},
  {id:'America/Los_Angeles',name:'LA',        lon:-118.24,lat:34.05,  ax:'start',  dx:7},
  {id:'Australia/Sydney',name:'シドニー',      lon:151.21, lat:-33.87, ax:'end',    dx:-7},
  {id:'America/Sao_Paulo',name:'São Paulo',   lon:-46.63, lat:-23.55, ax:'start',  dx:7}
];
function lngToX(lon){return (lon+180)/360*680;}
function latToY(lat){return (90-lat)/180*340;}

function buildMapSVG(paths){
  var bg='<rect width="680" height="340" fill="#0d2137"/>';
  var grid='';
  // 経線（60度ごと: -180,-120,-60,0,60,120,180）
  for(var gx=0;gx<=6;gx++){var gxx=(gx/6*680).toFixed(1);grid+='<line x1="'+gxx+'" y1="0" x2="'+gxx+'" y2="340" stroke="#1a3a5c" stroke-width="0.4"/>';}
  // 緯線（60度ごと: -60,0,60）＋赤道を赤道線で上書き
  grid+='<line x1="0" y1="56.7" x2="680" y2="56.7" stroke="#1a3a5c" stroke-width="0.4"/>'; // 60°N
  grid+='<line x1="0" y1="283.3" x2="680" y2="283.3" stroke="#1a3a5c" stroke-width="0.4"/>'; // 60°S
  // 赤道
  grid+='<line x1="0" y1="170" x2="680" y2="170" stroke="#2a6a8c" stroke-width="0.8" stroke-dasharray="5,3"/>';
  var land='<g fill="#2d5a3d" stroke="#3a7050" stroke-width="0.3">'+paths+'</g>';
  var pins='';
  WC_PINS.forEach(function(p){
    var px=lngToX(p.lon).toFixed(1);
    var py=latToY(p.lat).toFixed(1);
    pins+='<g transform="translate('+px+','+py+')">'
      +'<circle r="3" fill="#f59e0b" stroke="#fff" stroke-width="0.8"/>'
      +'<circle r="8" fill="#f59e0b" opacity="0.12"/>'
      +'<text x="'+p.dx+'" y="-10" text-anchor="'+p.ax+'" font-family="sans-serif" font-size="7" fill="#e2e8f0" font-weight="700">'+p.name+'</text>'
      +'<text x="'+p.dx+'" id="wcr-'+p.id.replace(/\//g,'_')+'" y="3" text-anchor="'+p.ax+'" font-family="monospace" font-size="7.5" fill="#94d4ff" font-weight="700">--:--:--</text>'
      +'<text x="'+p.dx+'" id="wct-'+p.id.replace(/\//g,'_')+'" y="14" text-anchor="'+p.ax+'" font-family="monospace" font-size="8" fill="#fbbf24" font-weight="700" visibility="hidden">--:--</text>'
      +'</g>';
  });
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 340" style="width:100%;height:auto;display:block;border-radius:8px;">'+bg+grid+land+pins+'</svg>';
}

// TopoJSONの座標を等長方形投影でSVGパスに変換（アンチメリジアン対応）
function topoToSvgPaths(topo){
  var countries=topojson.feature(topo,topo.objects.countries);
  var svgPaths='';
  countries.features.forEach(function(f){
    var d='';
    function ring(coords){
      if(!coords||coords.length<2) return '';
      var seg='';
      var prevX=null;
      for(var i=0;i<coords.length;i++){
        var cx=lngToX(coords[i][0]);
        var cy=latToY(coords[i][1]);
        if(i===0){
          seg+='M'+cx.toFixed(1)+','+cy.toFixed(1);
        } else {
          // 経度差が300px以上（約160°相当）なら経線をまたいでいる→新サブパス
          if(prevX!==null && Math.abs(cx-prevX)>300){
            seg+='M'+cx.toFixed(1)+','+cy.toFixed(1);
          } else {
            seg+='L'+cx.toFixed(1)+','+cy.toFixed(1);
          }
        }
        prevX=cx;
      }
      return seg+'Z';
    }
    var geom=f.geometry;
    if(!geom) return;
    if(geom.type==='Polygon'){
      geom.coordinates.forEach(function(r){d+=ring(r);});
    } else if(geom.type==='MultiPolygon'){
      geom.coordinates.forEach(function(poly){poly.forEach(function(r){d+=ring(r);});});
    }
    if(d) svgPaths+='<path d="'+d+'"/>';
  });
  return svgPaths;
}

// UTC変換: tzでのhh:mm → UTC milliseconds (今日の日付基準)
function inputToUtcMs(tz, timeStr){
  var now=new Date();
  // 今のtzオフセット(ms)を測定
  var utcStr=now.toLocaleString('sv-SE',{timeZone:'UTC'});
  var tzStr=now.toLocaleString('sv-SE',{timeZone:tz});
  var offsetMs=new Date(tzStr+' UTC').getTime()-new Date(utcStr+' UTC').getTime();
  // tzでの今日の日付
  var todayInTz=now.toLocaleDateString('sv-SE',{timeZone:tz});
  // 入力時刻をUTCとして解釈してからオフセット分を引く
  var inputAsUtcMs=new Date(todayInTz+'T'+timeStr+':00Z').getTime();
  return inputAsUtcMs-offsetMs;
}

var wcMapPaths=null; // キャッシュ
function startClock(){
  stopClock();
  var wrap=document.getElementById('wcWrap');
  if(!wrap) return;
  // topojsonが未ロードなら動的ロード
  function doStart(paths){
    wrap.innerHTML=buildMapSVG(paths)
      +'<div id="wcCaption" style="margin-top:6px;font-size:0.78rem;color:#94a3b8;text-align:center;min-height:1.2em;"></div>';
    function tick(){
      var fromTz=document.getElementById('wcFromTz')?document.getElementById('wcFromTz').value:'';
      var fromTime=document.getElementById('wcFromTime')?document.getElementById('wcFromTime').value:'';
      var now=new Date();
      var hasInput=!!(fromTz&&fromTime);
      var baseDate=hasInput?new Date(inputToUtcMs(fromTz,fromTime)):null;

      WC_PINS.forEach(function(p){
        var key=p.id.replace(/\//g,'_');
        var rEl=document.getElementById('wcr-'+key); // リアルタイム（青）
        var tEl=document.getElementById('wct-'+key); // 入力変換（黄）
        if(rEl) rEl.textContent=now.toLocaleTimeString('ja-JP',{timeZone:p.id,hour:'2-digit',minute:'2-digit',second:'2-digit'});
        if(tEl){
          if(hasInput){
            tEl.textContent='['+baseDate.toLocaleTimeString('ja-JP',{timeZone:p.id,hour:'2-digit',minute:'2-digit'})+']';
            tEl.setAttribute('visibility','visible');
          } else {
            tEl.setAttribute('visibility','hidden');
          }
        }
      });

      // キャプション更新
      var cap=document.getElementById('wcCaption');
      if(cap){
        if(hasInput){
          var fromPin=WC_PINS.find(function(p){return p.id===fromTz;});
          var fromName=fromPin?fromPin.name:fromTz;
          var tzAbbr=new Date().toLocaleTimeString('en-GB',{timeZone:fromTz,timeZoneName:'short'}).split(' ').pop()||fromTz;
          cap.textContent='📌 '+fromName+'（'+tzAbbr+'）を '+fromTime+' とした場合の各国の時刻（黄色 [ ] が変換結果）';
        } else {
          cap.textContent='';
        }
      }
    }
    tick();
    clockInterval=setInterval(tick,1000);
  }
  if(wcMapPaths!==null){doStart(wcMapPaths);return;}
  // topojson-client をロード
  wrap.innerHTML='<div style="padding:20px;text-align:center;color:#64748b;font-size:.82rem;">🌍 地図を読み込み中...</div>';
  function loadScript(src,cb){var s=document.createElement('script');s.src=src;s.onload=cb;document.head.appendChild(s);}
  function fetchMap(){
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(function(r){return r.json();})
      .then(function(topo){
        wcMapPaths=topoToSvgPaths(topo);
        doStart(wcMapPaths);
      })
      .catch(function(){wcMapPaths='';doStart('');});
  }
  if(typeof topojson!=='undefined'){fetchMap();}
  else{loadScript('https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js',fetchMap);}
}
function stopClock(){if(clockInterval){clearInterval(clockInterval);clockInterval=null;}}
/* ToolsLab bpm glue v2 */
let bpmEngine = null;
// bpmVoicingOps: { "progressionKey:chordIndex": { high: N, low: M } }
// high = number of times the current highest note has been dropped an octave;
// low = number of times the current lowest note has been dropped an octave.
let bpmVoicingOps = {};

function bpmLoadShifts() {
  try {
    const raw = localStorage.getItem('toolslab_bpm_voicing_ops');
    bpmVoicingOps = raw ? JSON.parse(raw) : {};
  } catch (e) { bpmVoicingOps = {}; }
}
function bpmSaveShifts() {
  try { localStorage.setItem('toolslab_bpm_voicing_ops', JSON.stringify(bpmVoicingOps)); } catch (e) {}
}
function bpmOpsKey(chordIdx) {
  return document.getElementById('bpmProgression').value + ':' + chordIdx;
}
function bpmGetOps(chordIdx) {
  return bpmVoicingOps[bpmOpsKey(chordIdx)] || [];
}
function bpmGetOpsArray() {
  const progKey = document.getElementById('bpmProgression').value;
  const prog = CHORD_PROGRESSIONS[progKey];
  return prog.chords.map((_, i) => bpmGetOps(i));
}

function bpmSlide() {
  document.getElementById('bpmValNum').textContent = document.getElementById('bpmVal').value;
  bpmApplyIfPlaying();
}
function bpmGetOptions() {
  const progKey = document.getElementById('bpmProgression').value;
  return {
    bpm: parseInt(document.getElementById('bpmVal').value, 10),
    beatsPerBar: parseInt(document.getElementById('bpmBeats').value, 10),
    timbre: document.getElementById('bpmTimbre').value,
    pattern: document.getElementById('bpmPattern').value,
    metronomeSound: document.getElementById('bpmMetroSound').value,
    progression: CHORD_PROGRESSIONS[progKey],
    keyRoot: document.getElementById('bpmKeyRoot').value,
    keyMode: document.getElementById('bpmKeyMode').value,
    chordDuration: document.getElementById('bpmChordDur').value,
    chordsOn: document.getElementById('bpmChordsOn').checked,
    countdownBars: parseInt(document.getElementById('bpmCountdown').value, 10),
    metronomeOn: true,
    octaveShifts: [],
    voicingOps: bpmGetOpsArray(),
  };
}
function bpmBuildDots() {
  const beats = parseInt(document.getElementById('bpmBeats').value, 10);
  const wrap = document.getElementById('bpmBeatDots');
  wrap.innerHTML = Array.from({length: beats}, (_, i) =>
    `<div class="bpm-dot" data-i="${i}" style="width:14px;height:14px;border-radius:50%;background:var(--border);transition:background .1s;"></div>`
  ).join('');
}
// Returns { notes, fixedBass }: `notes` is the current (possibly re-voiced) full chord;
// `fixedBass` is the chord's bass/root pitch, fixed to its original definition and never
// affected by voicing operations (used to anchor the bass-clef reference note).
function bpmChordAvg(notes) {
  return notes.reduce((a, b) => a + b, 0) / notes.length;
}
// Automatic voice leading: shifts each chord's UPPER voices (everything except the bass/root,
// which always stays at its natural, fixed octave — see below) by whichever octave brings
// their average pitch closest to the previous chord's upper-voice average, so the progression's
// register doesn't jump around. Runs automatically whenever the progression or key changes,
// BEFORE the user's manual 最高音↓/最低音↑ operations are applied on top of the result.
// For a single upper-voice note, finds the octave transposition that lands it closest to ANY
// note in the previous chord's upper voices — i.e. if this note shares a pitch class with a
// note the previous chord held, it lands on that exact pitch (common tone kept, including its
// octave), otherwise it moves by the smallest possible distance to its nearest neighbor.
// Tie-break: when two octave candidates are equally close to the previous chord, prefer
// whichever is closer to the note's own natural (untransposed) octave — otherwise a note can
// jump to a distant octave for a marginal or tied improvement in nearness to an unrelated note,
// which reads as a bigger, stranger leap than simply staying put.
function bpmClosestOctave(note, prevUpperNotes) {
  // Require a genuinely closer match (not just marginally closer) before jumping an extra
  // octave away from the note's own position — otherwise "nearest by 1 semitone" can send a
  // note two registers away for a barely-better fit against some unrelated previous note.
  const MARGIN = 3;
  let best = note, bestDist = Infinity, bestOwnDist = 0;
  for (let oct = -2; oct <= 2; oct++) {
    const candidate = note + oct * 12;
    const ownDist = Math.abs(oct * 12);
    prevUpperNotes.forEach((p) => {
      const dist = Math.abs(candidate - p);
      if (dist + MARGIN * ownDist / 12 < bestDist + MARGIN * bestOwnDist / 12) {
        bestDist = dist; best = candidate; bestOwnDist = ownDist;
      }
    });
  }
  return best;
}
function bpmVoiceLedBaseNotes(progKey, keyRootSemitone, isMinor) {
  const prog = CHORD_PROGRESSIONS[progKey];
  const result = [];
  let prevUpper = null;
  prog.chords.forEach((chordDef) => {
    const raw = buildChordNotes(chordDef, keyRootSemitone, isMinor, 0);
    const bass = raw[0];
    const upper = raw.slice(1);
    if (upper.length === 0 || prevUpper == null) {
      result.push(raw);
      prevUpper = upper.length ? upper : [bass];
      return;
    }
    // Each upper note independently seeks the octave nearest to any note the previous
    // chord's upper voices held — this keeps common tones (even across octaves) and gives
    // genuinely smooth voice leading, rather than shifting the whole chord as one block.
    const bestUpper = upper.map((n) => bpmClosestOctave(n, prevUpper));
    result.push([bass].concat(bestUpper));
    prevUpper = bestUpper;
  });
  return result;
}
function bpmChordNotesFor(chordIdx) {
  const progKey = document.getElementById('bpmProgression').value;
  const keyRoot = document.getElementById('bpmKeyRoot').value;
  const keyMode = document.getElementById('bpmKeyMode').value;
  const keyRootSemitone = NOTE_NAMES_V2.indexOf(keyRoot);
  const voiceLed = bpmVoiceLedBaseNotes(progKey, keyRootSemitone, keyMode === 'minor');
  const baseNotes = voiceLed[chordIdx];
  const fixedBass = baseNotes.length > 0 ? baseNotes[0] : null;
  const notes = applyVoicingOps(baseNotes, bpmGetOps(chordIdx));
  return { notes: notes, fixedBass: fixedBass };
}
function bpmRenderSequence(activeIdx) {
  const progKey = document.getElementById('bpmProgression').value;
  const prog = CHORD_PROGRESSIONS[progKey];
  const keyRoot = document.getElementById('bpmKeyRoot').value;
  const keyMode = document.getElementById('bpmKeyMode').value;
  const wrap = document.getElementById('bpmProgressionSeq');
  wrap.innerHTML = prog.chords.map((c, i) => {
    const label = ctpChordLabel(c);
    const actualName = ctpActualChordName(c, keyRoot, keyMode === 'minor');
    const active = i === activeIdx;
    const { notes, fixedBass } = bpmChordNotesFor(i);
    return `<div style="padding:8px 10px;border-radius:10px;min-width:120px;
      border:2px solid ${active ? 'var(--blue)' : 'var(--border)'};
      background:${active ? 'var(--blue-lt)' : 'var(--white)'};">
      <div style="font-weight:700;font-size:.85rem;text-align:center;margin-bottom:2px;color:${active ? 'var(--blue)' : 'var(--text)'};">${label}</div>
      <div style="font-weight:900;font-size:1.3rem;text-align:center;margin-bottom:6px;color:${active ? 'var(--blue)' : 'var(--text)'};">${actualName}</div>
      <div style="background:#1a1d29;border-radius:6px;padding:4px;">${ctpRenderStaffSVG(notes, fixedBass, 130)}</div>
      <div style="display:flex;gap:4px;margin-top:6px;">
        <button class="rate-btn" onclick="bpmVoicingOp(${i},'high')" style="flex:1;padding:4px 2px;font-size:.65rem;" title="最高音を1オクターブ下げる">最高音↓</button>
        <button class="rate-btn" onclick="bpmVoicingOp(${i},'up')" style="flex:1;padding:4px 2px;font-size:.65rem;" title="最低音を1オクターブ上げる">最低音↑</button>
      </div>
      <button class="rate-btn" onclick="bpmVoicingReset(${i})" style="width:100%;margin-top:4px;padding:3px 2px;font-size:.62rem;color:var(--muted);">リセット</button>
    </div>`;
  }).join('');
}
function bpmVoicingOp(chordIdx, which) {
  const key = bpmOpsKey(chordIdx);
  const cur = bpmGetOps(chordIdx);
  const next = cur.concat([which]).slice(-12); // cap history length defensively
  bpmVoicingOps[key] = next;
  bpmSaveShifts();
  bpmRenderSequence(bpmCurrentChordIdx);
  bpmApplyIfPlaying();
}
function bpmVoicingReset(chordIdx) {
  delete bpmVoicingOps[bpmOpsKey(chordIdx)];
  bpmSaveShifts();
  bpmRenderSequence(bpmCurrentChordIdx);
  bpmApplyIfPlaying();
}
let bpmCurrentChordIdx = 0;
function bpmOnProgressionChange() {
  bpmCurrentChordIdx = 0;
  bpmRenderSequence(0);
  bpmApplyIfPlaying();
}
function bpmToggle() {
  const btn = document.getElementById('bpmStartBtn');
  if (!bpmEngine) bpmEngine = new ChordMetronomeEngineV2();
  if (bpmEngine.isPlaying) {
    bpmEngine.stop();
    btn.textContent = '▶ メトロノーム開始';
    document.getElementById('bpmStateLabel').textContent = '';
    document.querySelectorAll('.bpm-dot').forEach(d => d.style.background = 'var(--border)');
  } else {
    bpmBuildDots();
    bpmEngine.onBeat = (beatInBar, beatsPerBar, state) => {
      document.querySelectorAll('.bpm-dot').forEach((d, i) => {
        d.style.background = i === beatInBar ? (state === 'countdown' ? '#f59e0b' : 'var(--blue)') : 'var(--border)';
      });
      document.getElementById('bpmStateLabel').textContent = state === 'countdown' ? 'カウント中…' : '';
    };
    bpmEngine.onChordChange = (idx) => {
      bpmCurrentChordIdx = idx;
      bpmRenderSequence(idx);
    };
    bpmEngine.metronomeGain = parseInt(document.getElementById('bpmMetroVol').value, 10) / 100;
    bpmEngine.chordGain = parseInt(document.getElementById('bpmChordVol').value, 10) / 100;
    bpmEngine.start(bpmGetOptions());
    btn.textContent = '■ 停止';
  }
}
// Volume-only change: adjust gain live without interrupting playback (no stop/restart).
function bpmApplyVolume() {
  if (bpmEngine) {
    bpmEngine.metronomeGain = parseInt(document.getElementById('bpmMetroVol').value, 10) / 100;
    bpmEngine.chordGain = parseInt(document.getElementById('bpmChordVol').value, 10) / 100;
  }
}
// Any other setting change (BPM, key, pattern, timbre, chord duration, countdown, beats,
// metronome sound, progression, octave shift): stop playback rather than restarting immediately,
// so the old and new chord audio never overlap. The user presses start again to resume.
function bpmApplyIfPlaying() {
  bpmApplyVolume();
  if (bpmEngine && bpmEngine.isPlaying) {
    bpmEngine.stop();
    const btn = document.getElementById('bpmStartBtn');
    if (btn) btn.textContent = '▶ メトロノーム開始';
    document.getElementById('bpmStateLabel').textContent = '';
    document.querySelectorAll('.bpm-dot').forEach(d => d.style.background = 'var(--border)');
  }
  bpmBuildDots();
  // Key/progression/voicing changes must re-render the note sequence & staves immediately,
  // not just on the next onChordChange callback (which only fires once playback starts).
  bpmRenderSequence(bpmCurrentChordIdx);
}
function bpmStopIfPlaying() {
  if (bpmEngine && bpmEngine.isPlaying) {
    bpmEngine.stop();
    const btn = document.getElementById('bpmStartBtn');
    if (btn) btn.textContent = '▶ メトロノーム開始';
  }
}
function bpmInit() {
  bpmLoadShifts();
  bpmBuildDots();
  bpmCurrentChordIdx = 0;
  bpmRenderSequence(0);
}

const SH_SERVICES = {
  tinyurl: {
    label: 'TinyURL', note: 'TinyURL の無料APIを利用しています。短縮URLは第三者が発行するリンクです。',
    apiUrl: u => 'https://tinyurl.com/api-create.php?url=' + encodeURIComponent(u),
    parse: async (res) => {
      const text = (await res.text()).trim();
      return /^https?:\/\//i.test(text) ? text : null;
    },
  },
  dagd: {
    label: 'da.gd', note: 'da.gd の無料APIを利用しています。短縮URLは第三者が発行するリンクです。',
    apiUrl: u => 'https://da.gd/s?url=' + encodeURIComponent(u),
    parse: async (res) => {
      const text = (await res.text()).trim();
      return /^https?:\/\//i.test(text) ? text : null;
    },
  },
};
let shService = 'tinyurl';
function shSetService(id) {
  shService = id;
  const note = document.getElementById('shServiceNote');
  if (note) note.textContent = (SH_SERVICES[id] || SH_SERVICES.tinyurl).note;
  Object.keys(SH_SERVICES).forEach(k => {
    document.getElementById('shSvc-' + k)?.classList.toggle('on', k === id);
  });
  shClearResult();
}
function shClearResult() {
  const err = document.getElementById('shError'); if (err) err.style.display = 'none';
  const area = document.getElementById('shResultArea'); if (area) area.classList.remove('visible');
}
async function shRun() {
  const input = document.getElementById('shUrl');
  const btn = document.getElementById('shBtn');
  const err = document.getElementById('shError');
  const area = document.getElementById('shResultArea');
  const out = document.getElementById('shOutput');
  if (!input || !btn || !err || !area || !out) return;

  let url = input.value.trim();
  if (!url) { err.textContent = 'URLを入力してください'; err.style.display = 'block'; area.classList.remove('visible'); return; }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  err.style.display = 'none';
  area.classList.remove('visible');
  btn.disabled = true;
  btn.textContent = '短縮中…';

  try {
    const svc = SH_SERVICES[shService] || SH_SERVICES.tinyurl;
    const res = await fetch(svc.apiUrl(url));
    const shortUrl = await svc.parse(res);
    if (!shortUrl) {
      err.textContent = '短縮に失敗しました。URLを確認してください';
      err.style.display = 'block';
    } else {
      out.textContent = shortUrl;
      area.classList.add('visible');
    }
  } catch (e) {
    err.textContent = '通信エラーが発生しました。時間をおいて再試行してください';
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = '短縮する';
  }
}
function shCopy() {
  const url = document.getElementById('shOutput')?.textContent || '';
  if (!url || url === '—') return;
  navigator.clipboard?.writeText(url).then(()=>{ const el=document.getElementById('shOutput'); if(el){el.style.background='var(--blue-lt)'; setTimeout(()=>el.style.background='',800); }});
}

function calcWcConv(){stopClock();startClock();}
function resetWcConv(){var s=document.getElementById('wcFromTz');var t=document.getElementById('wcFromTime');if(s)s.value='';if(t)t.value='';stopClock();startClock();}



// ── random ──
var rdMode='dice',rdFace=6;
function rdSetMode(m){rdMode=m;['dice','card','lot'].forEach(x=>{document.getElementById('rd'+x.charAt(0).toUpperCase()+x.slice(1)+'Wrap').style.display=x===m?'':'none';document.getElementById('rd'+x.charAt(0).toUpperCase()+x.slice(1)).classList.toggle('on',x===m);});}
function rdSetFace(f){rdFace=f;[4,6,10,20].forEach(n=>{const b=document.getElementById('rdF'+n);if(b)b.classList.toggle('on',n===f);});}
function execRandom(){
  var res='';
  if(rdMode==='dice'){var n=parseInt(document.getElementById('rdCount')?.value||1);var results=[];for(var i=0;i<n;i++)results.push(Math.floor(Math.random()*rdFace)+1);res=results.join('  ＋  ')+(n>1?' ＝ '+results.reduce((a,b)=>a+b,0):'');}
  else if(rdMode==='card'){var suits=['♠','♥','♦','♣'],vals=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];var s=document.getElementById('rdSuit').value;var deck=s==='all'?suits.flatMap(su=>vals.map(v=>su+v)):vals.map(v=>s+v);var pick=deck[Math.floor(Math.random()*deck.length)];res=pick;}
  else{var items=document.getElementById('rdItems').value.split('\n').map(s=>s.trim()).filter(Boolean);if(items.length<2){res='選択肢を2つ以上入力してください';} else {res=items[Math.floor(Math.random()*items.length)];}}
  var el=document.getElementById('rdResult');if(el)el.textContent=res;
}

// ── bpm ──

// ── char-count ──
function calcCharCount(){var t=document.getElementById('ccText')?.value||'';document.getElementById('ccAll').textContent=t.length;document.getElementById('ccNoSp').textContent=t.replace(/\s/g,'').length;document.getElementById('ccLines').textContent=t===''?0:t.split('\n').length;document.getElementById('ccWords').textContent=t.trim()===''?0:t.trim().split(/\s+/).length;document.getElementById('ccBytes').textContent=new TextEncoder().encode(t).length;document.getElementById('ccParas').textContent=t.trim()===''?0:t.split(/\n\s*\n/).filter(p=>p.trim()).length;}

// ── age ──
function calcAge(){var b=document.getElementById('ageBirth')?.value;if(!b)return;var base=document.getElementById('ageBase')?.value;var now=base?new Date(base):new Date();var bd=new Date(b);var age=now.getFullYear()-bd.getFullYear();var m=now.getMonth()-bd.getMonth();if(m<0||(m===0&&now.getDate()<bd.getDate()))age--;var days=Math.floor((now-bd)/(86400000));var next=new Date(now.getFullYear(),bd.getMonth(),bd.getDate());if(next<=now)next.setFullYear(now.getFullYear()+1);var dNext=Math.ceil((next-now)/86400000);document.getElementById('ageYear').innerHTML=age+'<span class="unit">歳</span>';document.getElementById('ageDays').innerHTML=days.toLocaleString()+'<span class="unit">日</span>';document.getElementById('ageNext').innerHTML=dNext+'<span class="unit">日</span>';}

// ── date-diff ──
function calcDateDiff(){var f=document.getElementById('ddFrom')?.value,t=document.getElementById('ddTo')?.value;if(!f||!t)return;var a=new Date(f),b=new Date(t);var diff=Math.round((b-a)/86400000);var sign=diff<0?'-':'';var abs=Math.abs(diff);document.getElementById('ddDays').innerHTML=sign+abs.toLocaleString()+'<span class="unit">日</span>';document.getElementById('ddWeeks').innerHTML=sign+Math.floor(abs/7).toLocaleString()+'<span class="unit">週</span>';document.getElementById('ddMonths').innerHTML=sign+(abs/30.44).toFixed(1)+'<span class="unit">ヶ月</span>';}

// ── unit-conv ──
var UC_DEFS={length:{label:'長さ',units:[['mm',0.001],['cm',0.01],['m',1],['km',1000],['inch',0.0254],['ft',0.3048],['yd',0.9144],['mile',1609.344]]},weight:{label:'重さ',units:[['mg',0.000001],['g',0.001],['kg',1],['t',1000],['oz',0.028349523],['lb',0.45359237]]},temp:{label:'温度',units:[['℃',null],['℉',null],['K',null]]},area:{label:'面積',units:[['cm²',0.0001],['m²',1],['km²',1000000],['ha',10000],['a',100],['坪',3.30579],['畳',1.65289]]},speed:{label:'速さ',units:[['m/s',1],['km/h',1/3.6],['mph',0.44704],['knot',0.514444]]}};
function ucChangeCat(){var cat=document.getElementById('ucCat')?.value||'length';var def=UC_DEFS[cat];var fs=document.getElementById('ucFrom'),ts=document.getElementById('ucTo');if(!fs||!ts||!def)return;var opts=def.units.map((u,i)=>`<option value="${i}">${u[0]}</option>`).join('');fs.innerHTML=opts;ts.innerHTML=opts;ts.selectedIndex=1;calcUnitConv();}
function calcUnitConv(){var cat=document.getElementById('ucCat')?.value||'length';var def=UC_DEFS[cat];var val=parseFloat(document.getElementById('ucVal')?.value);var fi=parseInt(document.getElementById('ucFrom')?.value||0);var ti=parseInt(document.getElementById('ucTo')?.value||0);if(isNaN(val)||!def)return;var res;if(cat==='temp'){var u=def.units;if(fi===0&&ti===1)res=val*9/5+32;else if(fi===0&&ti===2)res=val+273.15;else if(fi===1&&ti===0)res=(val-32)*5/9;else if(fi===1&&ti===2)res=(val-32)*5/9+273.15;else if(fi===2&&ti===0)res=val-273.15;else if(fi===2&&ti===1)res=(val-273.15)*9/5+32;else res=val;}else{var base=val*def.units[fi][1];res=base/def.units[ti][1];}var el=document.getElementById('ucResult');if(el)el.textContent=parseFloat(res.toPrecision(7)).toLocaleString('ja-JP',{maximumFractionDigits:6});}

// ── base64 ──
var b64Mode='enc';
function b64SetMode(m){b64Mode=m;document.getElementById('b64Enc').classList.toggle('on',m==='enc');document.getElementById('b64Dec').classList.toggle('on',m==='dec');calcBase64();}
function calcBase64(){var inp=document.getElementById('b64In')?.value||'';var out='';try{if(b64Mode==='enc')out=btoa(unescape(encodeURIComponent(inp)));else out=decodeURIComponent(escape(atob(inp)));}catch(e){out='変換エラー: 入力を確認してください';}var el=document.getElementById('b64Out');if(el)el.value=out;}

// ── bmi ──
function calcBmi(){var h=parseFloat(document.getElementById('bmiH')?.value);var w=parseFloat(document.getElementById('bmiW')?.value);if(!h||!w)return;var hm=h/100;var bmi=w/(hm*hm);var std=(22*hm*hm);var j=bmi<18.5?'低体重':bmi<25?'普通体重':bmi<30?'肥満(1度)':bmi<35?'肥満(2度)':bmi<40?'肥満(3度)':'肥満(4度)';document.getElementById('bmiVal').innerHTML=bmi.toFixed(1);document.getElementById('bmiJudge').textContent=j;document.getElementById('bmiStd').innerHTML=std.toFixed(1)+'<span class="unit">kg</span>';}

// ── calorie ──
var calGender='m';
function calSetGender(g){calGender=g;document.getElementById('calMale').classList.toggle('on',g==='m');document.getElementById('calFemale').classList.toggle('on',g==='f');calcCalorie();}
function calcCalorie(){var age=parseInt(document.getElementById('calAge')?.value||30);var w=parseFloat(document.getElementById('calW')?.value||65);var act=parseFloat(document.getElementById('calAct')?.value||1.375);var h=parseFloat(document.getElementById('calH')?.value)||(calGender==='m'?170:160);var bmr=calGender==='m'?(88.362+13.397*w+4.799*h-5.677*age):(447.593+9.247*w+3.098*h-4.330*age);var tdee=bmr*act;document.getElementById('calBmr').innerHTML=Math.round(bmr).toLocaleString()+'<span class="unit">kcal</span>';document.getElementById('calTdee').innerHTML=Math.round(tdee).toLocaleString()+'<span class="unit">kcal</span>';document.getElementById('calMaint').innerHTML=Math.round(tdee).toLocaleString()+'<span class="unit">kcal</span>';}

// ── body-fat ──
var bfGender='m';
function bfSetGender(g){bfGender=g;document.getElementById('bfMale').classList.toggle('on',g==='m');document.getElementById('bfFemale').classList.toggle('on',g==='f');var hr=document.getElementById('bfHipRow');if(hr)hr.style.display=g==='f'?'':'none';calcBodyFat();}
function calcBodyFat(){var h=parseFloat(document.getElementById('bfH')?.value);var w=parseFloat(document.getElementById('bfW')?.value);var waist=parseFloat(document.getElementById('bfWaist')?.value);var neck=parseFloat(document.getElementById('bfNeck')?.value);var hip=parseFloat(document.getElementById('bfHip')?.value||90);if(!h||!w||!waist||!neck)return;var pct;if(bfGender==='m'){pct=495/(1.0324-0.19077*Math.log10(waist-neck)+0.15456*Math.log10(h))-450;}else{pct=495/(1.29579-0.35004*Math.log10(waist+hip-neck)+0.22100*Math.log10(h))-450;}pct=Math.max(3,Math.min(60,pct));var fat=w*pct/100;var lean=w-fat;document.getElementById('bfPct').innerHTML=pct.toFixed(1)+'<span class="unit">%</span>';document.getElementById('bfMass').innerHTML=fat.toFixed(1)+'<span class="unit">kg</span>';document.getElementById('bfLean').innerHTML=lean.toFixed(1)+'<span class="unit">kg</span>';}

// ── currency ──
var curRates=null,curBase='USD';
function loadCurRates(cb){
  if(curRates){cb();return;}
  fetch('https://open.er-api.com/v6/latest/USD')
    .then(r=>r.json()).then(d=>{curRates=d.rates;curRates['USD']=1;cb();})
    .catch(()=>{var el=document.getElementById('curResult');if(el)el.innerHTML='<div style="color:#ef4444;padding:12px;">レート取得失敗。ネットワークを確認してください。</div>';});
}
function calcCurrency(){
  loadCurRates(function(){
    var amt=parseFloat(document.getElementById('curAmt')?.value||1);
    var from=document.getElementById('curFrom')?.value||'USD';
    if(!curRates||isNaN(amt))return;
    var inUsd=amt/curRates[from];
    var targets=[['JPY','日本円'],['USD','米ドル'],['EUR','ユーロ'],['GBP','英ポンド'],['CNY','中国元'],['KRW','韓国ウォン'],['AUD','豪ドル'],['CAD','カナダドル'],['CHF','スイスフラン'],['SGD','SGドル'],['HKD','香港ドル'],['THB','タイバーツ']];
    var html='<div class="result-grid">'+targets.filter(t=>t[0]!==from).map(([code,name])=>{
      var val=inUsd*curRates[code];
      var disp=code==='JPY'||code==='KRW'?Math.round(val).toLocaleString():val.toFixed(4);
      return`<div class="result-item"><div class="result-label">${code} ${name}</div><div class="result-value" style="font-family:monospace">${disp}</div></div>`;
    }).join('')+'</div>';
    var el=document.getElementById('curResult');if(el)el.innerHTML=html;
  });
}

// ── color ──
function syncColor(src){
  var hex=document.getElementById('clrHex')?.value||'#3b82f6';
  if(src==='pick')hex=document.getElementById('clrPick')?.value||hex;
  if(src==='hex'){if(!/^#[0-9a-fA-F]{6}$/.test(hex))return;}
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  if(src==='hex'){var p=document.getElementById('clrPick');if(p)p.value=hex;}
  if(src==='pick'){var h=document.getElementById('clrHex');if(h)h.value=hex.toUpperCase();}
  // RGB
  document.getElementById('clrRgb').textContent=`rgb(${r}, ${g}, ${b})`;
  // HSL
  var rn=r/255,gn=g/255,bn=b/255,max=Math.max(rn,gn,bn),min=Math.min(rn,gn,bn),l=(max+min)/2,s=0,h2=0;
  if(max!==min){s=l>0.5?(max-min)/(2-max-min):(max-min)/(max+min);if(max===rn)h2=((gn-bn)/(max-min)+6)%6;else if(max===gn)h2=(bn-rn)/(max-min)+2;else h2=(rn-gn)/(max-min)+4;h2=Math.round(h2*60);}
  document.getElementById('clrHsl').textContent=`hsl(${h2}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
  // CMYK
  var k=1-max,cm=max>0?((max-rn)/max):0,cm2=max>0?((max-gn)/max):0,cy=max>0?((max-bn)/max):0;
  document.getElementById('clrCmyk').textContent=`${Math.round(cm*100)}% ${Math.round(cm2*100)}% ${Math.round(cy*100)}% ${Math.round(k*100)}%`;
  // 明度
  var lum=0.2126*rn+0.7152*gn+0.0722*bn;
  document.getElementById('clrLum').textContent=(lum*100).toFixed(1)+'% ('+(lum>0.5?'明るい':'暗い')+')';
  // プレビュー
  var prev=document.getElementById('clrPreview');if(prev)prev.style.background=hex;
}

// ── pomodoro ──
var pomTimer=null,pomRemain=0,pomIsWork=true,pomSetsCount=0,pomRunning=false;
function pomReset(){
  pomRunning=false;clearInterval(pomTimer);pomTimer=null;pomIsWork=true;
  var w=parseInt(document.getElementById('pomWork')?.value||25);
  pomRemain=w*60;
  var btn=document.getElementById('pomStartBtn');if(btn)btn.textContent='▶ スタート';
  document.getElementById('pomDisplay').textContent=pomFmt(pomRemain);
  document.getElementById('pomLabel').textContent='作業時間';
  document.getElementById('pomPhase').textContent='作業中';
}
function pomFmt(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function pomToggle(){
  if(pomRunning){
    pomRunning=false;clearInterval(pomTimer);pomTimer=null;
    document.getElementById('pomStartBtn').textContent='▶ 再開';
  } else {
    pomRunning=true;
    document.getElementById('pomStartBtn').textContent='⏸ 一時停止';
    pomTimer=setInterval(function(){
      pomRemain--;
      document.getElementById('pomDisplay').textContent=pomFmt(pomRemain);
      if(pomRemain<=0){
        if(pomIsWork){pomSetsCount++;document.getElementById('pomSets').textContent=pomSetsCount;pomIsWork=false;pomRemain=parseInt(document.getElementById('pomBreak')?.value||5)*60;document.getElementById('pomLabel').textContent='休憩時間';document.getElementById('pomPhase').textContent='休憩中';}
        else{pomIsWork=true;pomRemain=parseInt(document.getElementById('pomWork')?.value||25)*60;document.getElementById('pomLabel').textContent='作業時間';document.getElementById('pomPhase').textContent='作業中';}
        try{new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAA').play();}catch(e){}
      }
    },1000);
  }
}

// ── qr ──
var qrSize=200;
function qrSetSize(s){qrSize=s;[150,200,300].forEach(n=>{var b=document.getElementById('qr'+n);if(b)b.classList.toggle('on',n===s);});genQr();}
function genQr(){
  var txt=document.getElementById('qrText')?.value||'';
  var out=document.getElementById('qrOut');
  var dl=document.getElementById('qrDl');
  if(!out)return;
  if(!txt){out.innerHTML='<div style="color:var(--muted);font-size:.82rem;">テキストを入力するとQRコードが表示されます</div>';if(dl)dl.style.display='none';return;}
  var enc=encodeURIComponent(txt);
  var url=`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${enc}&format=png&margin=10`;
  out.innerHTML=`<img src="${url}" width="${qrSize}" height="${qrSize}" style="border-radius:8px;border:1px solid var(--border);" alt="QRコード">`;
  if(dl){dl.href=url;dl.style.display='inline-block';}
}

// ── helper ──
function copyEl(id){var el=document.getElementById(id);if(!el)return;navigator.clipboard?.writeText(el.value||el.textContent).then(()=>{var b=el.nextElementSibling;if(b){var orig=b.textContent;b.textContent='✓ コピー済み';setTimeout(()=>{b.textContent=orig;},1500);}});}

let pwLen=16;



function updatePwLen(){pwLen=parseInt(document.getElementById('pwLen')?.value||16);const el=document.getElementById('pwLenVal');if(el)el.textContent=pwLen;}



function genPw(){const u=document.getElementById('pwUpper')?.checked;const l=document.getElementById('pwLower')?.checked;const n=document.getElementById('pwNum')?.checked;const s=document.getElementById('pwSym')?.checked;let chars='';if(u)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';if(l)chars+='abcdefghijklmnopqrstuvwxyz';if(n)chars+='0123456789';if(s)chars+='!@#$%^&*()-_=+[]{}';if(!chars)chars='abcdefghijklmnopqrstuvwxyz';const arr=new Uint32Array(pwLen);crypto.getRandomValues(arr);const pw=Array.from(arr).map(v=>chars[v%chars.length]).join('');const el=document.getElementById('pwOutput');if(el)el.textContent=pw;}



function copyPw(){const pw=document.getElementById('pwOutput')?.textContent||'';navigator.clipboard?.writeText(pw).then(()=>{const el=document.getElementById('pwOutput');if(el){el.style.background='var(--blue-lt)';setTimeout(()=>el.style.background='',800);}});}



function calcKanji(){const sei=(document.getElementById('kjSei')?.value||'').replace(/\s/g,'');const mei=(document.getElementById('kjMei')?.value||'').replace(/\s/g,'');const res=document.getElementById('kjResult');if(!res)return;if(!sei||!mei){res.innerHTML='';return;}const sArr=[...sei].map(c=>({c,s:KJ_STROKES[c]}));const mArr=[...mei].map(c=>({c,s:KJ_STROKES[c]}));const unk=[...new Set([...sArr,...mArr].filter(x=>!x.s).map(x=>x.c))];const sNums=sArr.map(x=>x.s||0);const mNums=mArr.map(x=>x.s||0);const tenku=sNums.reduce((a,b)=>a+b,0);const chikaku=mNums.reduce((a,b)=>a+b,0);const jinkaku=(sNums[sNums.length-1]||0)+(mNums[0]||0);const gaikaku=tenku+chikaku-jinkaku;const sokaku=tenku+chikaku;const norm=n=>((n-1)%81)+1;const f=n=>KJ_FORTUNE[norm(n)]||{r:'?',t:''};const col=r=>r==='大吉'?'#2563EB':r==='吉'?'#0891B2':r==='半吉'?'#16A34A':'#DC2626';const chars=arr=>arr.map(x=>`<span style="display:inline-flex;flex-direction:column;align-items:center;margin:0 3px;"><span style="font-size:1.3rem;font-weight:700;">${x.c}</span><span style="font-size:.6rem;color:${x.s?'var(--muted)':'#DC2626'};">${x.s??'?'}</span></span>`).join('');const row=(lbl,sub,num)=>{const {r,t}=f(num);const c=col(r);return `<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);"><div style="min-width:64px;text-align:center;flex-shrink:0;"><div style="font-size:.6rem;color:var(--muted);margin-bottom:1px;">${sub}</div><div style="font-size:.8rem;font-weight:700;">${lbl}</div><div style="font-size:1.5rem;font-weight:900;color:var(--blue);line-height:1.1;">${num}</div><div style="font-size:.62rem;font-weight:700;color:#fff;background:${c};border-radius:3px;padding:1px 5px;margin-top:3px;display:inline-block;">${r}</div></div><div style="flex:1;font-size:.75rem;color:var(--muted);line-height:1.65;padding-top:4px;">${t}</div></div>`;};const warn=unk.length?`<div style="font-size:.7rem;color:#DC2626;padding:4px 0 8px;">⚠️ 画数データ未収録の文字: ${unk.join('・')}（結果は参考値です）</div>`:'';res.innerHTML=`<div style="background:var(--bg2);border-radius:10px;padding:10px 14px;margin-bottom:10px;"><div style="text-align:center;font-size:.72rem;color:var(--muted);margin-bottom:6px;">画数内訳</div><div style="display:flex;justify-content:center;align-items:flex-end;gap:16px;flex-wrap:wrap;">${chars(sArr)}<span style="font-size:.8rem;color:var(--border);align-self:center;">│</span>${chars(mArr)}</div></div>${warn}${row('天格','姓の総画',tenku)}${row('人格','姓末＋名頭',jinkaku)}${row('地格','名の総画',chikaku)}${row('外格','総格－人格',gaikaku)}${row('総格','姓名の総画',sokaku)}<div style="font-size:.65rem;color:var(--muted);text-align:center;margin-top:8px;line-height:1.6;">※姓名判断の一形式として参考にしてください。画数は新字体（当用漢字）基準。</div>`;}









/* ── 四柱推命 ── */

const SC_S=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

const SC_B=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

const SC_ES=['木','木','火','火','土','土','金','金','水','水'];

const SC_EB=['水','土','木','木','土','火','火','土','金','金','土','水'];

const SC_EC={木:'#16a34a',火:'#dc2626',土:'#b45309',金:'#78716c',水:'#2563eb'};

const SC_SK=[6,4,6,5,6,6,7,7,8,8,7,7];

function scRis(y){const Y=y-1900;return Math.floor(Y*.2422+4.81)-Math.floor(Y/4);}

function scSkDay(y,m){return m===2?scRis(y):SC_SK[m-1];}

function scJDN(y,m,d){if(m<=2){y--;m+=12;}const A=Math.floor(y/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524;}

function scYearIdx(y,m,d){return(((((m<2||(m===2&&d<scRis(y)))?y-1:y)-1924)%60)+600)%60;}

function scMonthBranch(y,m,d){let mo=m;if(d<scSkDay(y,m)){mo--;if(mo<1)mo=12;}return[1,2,3,4,5,6,7,8,9,10,11,0][mo-1];}

function scMonthStem(ys,mb){return([2,4,6,8,0,2,4,6,8,0][ys]+(mb-2+12)%12)%10;}

function scDayIdx(y,m,d){return((scJDN(y,m,d)-2451545+20)%60+600)%60;}

function scHourStem(ds,hb){return([0,2,4,6,8,0,2,4,6,8][ds]+hb)%10;}

function scGSIdx(s,b){for(let i=0;i<60;i++)if(i%10===s&&i%12===b)return i;return 0;}

let scGender=0;



const SC_SYOMI=['きのえ','きのと','ひのえ','ひのと','つちのえ','つちのと','かのえ','かのと','みずのえ','みずのと'];

const SC_SD=[

  {k:'直進・開拓',d:'強い意志と向上心をもつリーダー気質。困難にも正面から向き合う'},

  {k:'柔軟・調和',d:'穏やかに進める適応力の持ち主。人間関係を大切にする'},

  {k:'情熱・明朗',d:'太陽のように明るく活動的。場を盛り上げる表現力が豊か'},

  {k:'思慮・洞察',d:'細部まで気を配る繊細さと洞察力。内向きの強さをもつ'},

  {k:'安定・信頼',d:'大地のような包容力で周囲を支える。粘り強く誠実な人柄'},

  {k:'育成・調停',d:'周囲を育て調和をもたらす。面倒見がよく心が広い'},

  {k:'意志・決断',d:'白黒つけることが得意な行動派。筋を通すことを重んじる'},

  {k:'繊細・洗練',d:'美意識が高く、物事を丁寧に磨き上げる技術者気質'},

  {k:'知性・探求',d:'広い視野と豊かな知識で柔軟に動く。変化を楽しむ性質'},

  {k:'直感・奉仕',d:'直感が鋭く、陰で人を支えることに力を発揮する'},

];

const SC_BD=[

  {y:'ね',a:'鼠',k:'始動・繁栄',d:'新しいことを始める力がある。親しみやすく人が集まる'},

  {y:'うし',a:'牛',k:'忍耐・蓄積',d:'コツコツと積み上げる力がある。努力が着実に実を結ぶ'},

  {y:'とら',a:'虎',k:'勇気・前進',d:'大胆に前へ進む行動力。カリスマ的な存在感がある'},

  {y:'う',a:'兎',k:'調和・温和',d:'人当たりがよく周囲とうまくやる社交性がある'},

  {y:'たつ',a:'龍',k:'変化・成功',d:'変化の中で力を発揮する。大きな成果を出せる'},

  {y:'み',a:'蛇',k:'知恵・変革',d:'直感力と洞察力に優れる。静かに物事を深く見通す'},

  {y:'うま',a:'馬',k:'情熱・自由',d:'自由を求め情熱的に行動する。表現力とエネルギーが高い'},

  {y:'ひつじ',a:'羊',k:'誠実・芸術',d:'温かく誠実な心の持ち主。芸術的なセンスがある'},

  {y:'さる',a:'猿',k:'機敏・知略',d:'機転がきき頭の回転が速い。多芸多才な面がある'},

  {y:'とり',a:'鶏',k:'洗練・勤勉',d:'細部に気を配る几帳面さと高い審美眼をもつ'},

  {y:'いぬ',a:'犬',k:'忠実・正義',d:'義理堅く誠実。一度決めたことはやり通す'},

  {y:'い',a:'猪',k:'剛毅・純粋',d:'一途で純粋。目標に向かって真っすぐに進む'},

];

const SC_EMD={

  木:{h:'成長・創造',d:'向上心と柔軟性に富み、新しいことへの意欲が高い傾向。人や環境を育てる力がある。',lack:'計画を立てて行動に移す習慣が開運につながります。'},

  火:{h:'情熱・活動',d:'情熱的で明るく行動力に富む。自己表現が得意で周囲を明るくする。',lack:'積極的に自己表現・コミュニケーションを取ることで運気が高まります。'},

  土:{h:'安定・信頼',d:'安定感と信頼感が高く、着実な積み上げを得意とする。土台を作る力がある。',lack:'地に足のついた日常習慣・継続力が開運のカギです。'},

  金:{h:'意志・結実',d:'意志力と集中力が強く、やり遂げる力がある。目標に向かってぶれない。',lack:'決断力と判断軸を磨くことで潜在力が引き出されます。'},

  水:{h:'知性・流動',d:'知性と感受性が高く、柔軟な対応力がある。情報収集・直感に優れる。',lack:'学びと直感を磨くことで大きな可能性が開けます。'},

};



function scSetGender(g){scGender=g;['scMale','scFemale'].forEach((id,i)=>document.getElementById(id)?.classList.toggle('on',i===g));calcShichu();}

function calcShichu(){

  const dv=document.getElementById('scDate')?.value;

  const hv=parseInt(document.getElementById('scHour')?.value??'-1');

  const res=document.getElementById('scResult');

  if(!res||!dv)return;

  const[y,m,d]=dv.split('-').map(Number);

  if(!y||!m||!d){res.innerHTML='';return;}

  const yi=scYearIdx(y,m,d),ys=yi%10,yb=yi%12;

  const mb=scMonthBranch(y,m,d),ms=scMonthStem(ys,mb);

  const di=scDayIdx(y,m,d),ds=di%10,db=di%12;

  const hasH=hv>=0;

  const cols=hasH?[[ys,yb],[ms,mb],[ds,db],[scHourStem(ds,hv),hv]]:[[ys,yb],[ms,mb],[ds,db]];

  const cnames=['年柱','月柱','日柱','時柱'];

  const csubs=['先祖・社会運','兄弟・青年期','自己・配偶者','子供・晩年'];

  const cnt={木:0,火:0,土:0,金:0,水:0};

  cols.forEach(([s,b])=>{cnt[SC_ES[s]]++;cnt[SC_EB[b]]++;});

  const mx=Math.max(...Object.values(cnt))||1;

  const eList=Object.entries(cnt).sort((a,b2)=>b2[1]-a[1]);

  const domE=eList[0][0],domCount=eList[0][1];

  const lackE=eList[eList.length-1][0],lackCount=eList[eList.length-1][1];

  const isYang=ys%2===0;

  const fwd=(scGender===0&&isYang)||(scGender===1&&!isYang);

  let nm=m,ny=y;const skd=scSkDay(y,m);

  if(fwd){if(d>=skd){nm++;if(nm>12){nm=1;ny++;}}}

  else{if(d<skd){nm--;if(nm<1){nm=12;ny--;}}}

  const tJDN=scJDN(ny,nm,scSkDay(ny,nm));

  const days=Math.abs(tJDN-scJDN(y,m,d));

  const sAge=Math.floor(days/3),sMo=Math.floor((days%3)*4);

  const bMoI=scGSIdx(ms,mb);

  const daiunP=[];

  for(let i=1;i<=10;i++){const idx=((bMoI+(fwd?i:-i))%60+600)%60;daiunP.push([idx%10,idx%12]);}

  const now=new Date(),cy=now.getFullYear(),cm=now.getMonth()+1,cd2=now.getDate();

  const ryuI=scYearIdx(cy,cm,cd2);

  const nearBound=Math.abs(d-scSkDay(y,m))<=2;

  const card=([s,b],nm2,sub)=>`<div style="text-align:center;flex:1;min-width:52px;"><div style="font-size:.58rem;color:var(--muted);margin-bottom:2px;">${nm2}</div><div style="background:var(--white);border:1.5px solid var(--border);border-radius:8px;padding:6px 4px;"><div style="font-size:1.5rem;font-weight:900;color:${SC_EC[SC_ES[s]]};line-height:1.1;">${SC_S[s]}</div><div style="font-size:.5rem;color:${SC_EC[SC_ES[s]]};margin-bottom:2px;">${SC_ES[s]}</div><div style="height:1px;background:var(--border);margin:2px 0;"></div><div style="font-size:1.5rem;font-weight:900;color:${SC_EC[SC_EB[b]]};line-height:1.1;">${SC_B[b]}</div><div style="font-size:.5rem;color:${SC_EC[SC_EB[b]]};">${SC_EB[b]}</div></div><div style="font-size:.5rem;color:var(--muted);margin-top:2px;">${sub}</div></div>`;

  const gogyoBar=Object.entries(cnt).map(([e,n])=>`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:18px;font-size:.68rem;font-weight:700;color:${SC_EC[e]};">${e}</span><div style="flex:1;height:7px;background:var(--border);border-radius:4px;overflow:hidden;"><div style="width:${Math.round(n/mx*100)}%;height:100%;background:${SC_EC[e]};border-radius:4px;"></div></div><span style="width:14px;font-size:.65rem;text-align:right;color:var(--muted);">${n}</span></div>`).join('');

  const nowY=now.getFullYear();

  const daiunCards=daiunP.map(([s,b],i)=>{const age=sAge+i*10;const yr=y+age;const cur=nowY>=yr&&nowY<yr+10;return `<div style="flex:1;min-width:40px;text-align:center;padding:4px 2px;border-radius:6px;background:${cur?'var(--blue-lt)':'transparent'};border:1.5px solid ${cur?'var(--blue)':'var(--border)'};margin:1px;"><div style="font-size:.5rem;color:var(--muted);">${age}歳〜</div><div style="font-size:.5rem;color:var(--muted);">${yr}〜</div><div style="font-size:.95rem;font-weight:900;color:${SC_EC[SC_ES[s]]};">${SC_S[s]}</div><div style="font-size:.95rem;font-weight:900;color:${SC_EC[SC_EB[b]]};">${SC_B[b]}</div></div>`;}).join('');

  const curDaiunI=daiunP.findIndex((_,i)=>{const age=sAge+i*10;const yr=y+age;return nowY>=yr&&nowY<yr+10;});

  const curDaiun=curDaiunI>=0?daiunP[curDaiunI]:null;

  const curDaiunAge2=curDaiunI>=0?sAge+curDaiunI*10:null;

  const curDaiunDesc=curDaiun?`現在（${nowY}年）は <strong>${SC_S[curDaiun[0]]}${SC_B[curDaiun[1]]}</strong> の大運（${y+curDaiunAge2}〜${y+curDaiunAge2+9}年）。${SC_SD[curDaiun[0]].d}。${SC_BD[curDaiun[1]].d}。`:'大運の算出範囲外です。';

  const ryuS=ryuI%10,ryuB=ryuI%12;

  const pillarRows=cols.map(([s,b],i)=>{

    const isDay=i===2;const sd=SC_SD[s];const bd=SC_BD[b];

    return `<div style="border-bottom:${i<cols.length-1?'1px solid var(--border)':'none'};padding:7px 0 6px;"><div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">${isDay?`<span style="font-size:.52rem;background:var(--blue);color:#fff;border-radius:3px;padding:1px 4px;font-weight:700;">最重要</span>`:''}<span style="font-size:.6rem;font-weight:700;color:var(--text);">${cnames[i]}</span><span style="font-size:.58rem;color:var(--muted);">（${csubs[i]}）</span></div><div style="display:flex;align-items:center;flex-wrap:wrap;gap:3px;margin-bottom:4px;"><span style="font-size:.95rem;font-weight:900;color:${SC_EC[SC_ES[s]]};">${SC_S[s]}</span><span style="font-size:.58rem;color:var(--muted);">${SC_SYOMI[s]}</span><span style="font-size:.75rem;font-weight:700;color:${SC_EC[SC_ES[s]]};">・</span><span style="font-size:.95rem;font-weight:900;color:${SC_EC[SC_EB[b]]};">${SC_B[b]}</span><span style="font-size:.58rem;color:var(--muted);">${bd.y}（${bd.a}）</span><span style="margin-left:4px;font-size:.58rem;font-weight:700;background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:1px 5px;color:var(--text);">${sd.k} × ${bd.k}</span></div><div style="font-size:.65rem;color:var(--text);line-height:1.55;background:${isDay?'var(--blue-lt)':'#f8fafc'};border-left:2px solid ${isDay?'var(--blue)':'var(--border)'};padding:4px 8px;border-radius:0 4px 4px 0;">${sd.d}。${bd.d}。</div></div>`;

  }).join('');

  res.innerHTML=`<div style="display:flex;gap:4px;margin-bottom:10px;">${cols.map((p,i)=>card(p,cnames[i],csubs[i])).join('')}</div>${nearBound?`<div style="font-size:.63rem;color:#b45309;background:#fef3c7;border-radius:6px;padding:4px 8px;margin-bottom:8px;">⚠️ 節入り前後のため、時刻により柱が変わる場合があります</div>`:''}<div style="font-size:.6rem;color:var(--muted);background:var(--bg);border-radius:6px;padding:6px 10px;margin-bottom:8px;line-height:1.6;">四柱推命は生年月日から4つの「柱」を読む占術です。<br>年柱＝社会・祖先運、月柱＝親・青年期、<strong>日柱＝自己・配偶者（最重要）</strong>、時柱＝子・晩年運を示します。</div><div style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:8px;"><div style="font-size:.6rem;font-weight:700;color:var(--muted);margin-bottom:2px;">🔍 柱の読み解き</div>${pillarRows}</div><div style="background:var(--bg);border-radius:8px;padding:9px 11px;margin-bottom:8px;"><div style="font-size:.6rem;font-weight:700;color:var(--muted);margin-bottom:5px;">🌿 五行バランス</div>${gogyoBar}<div style="margin-top:7px;font-size:.65rem;color:var(--text);line-height:1.55;border-left:3px solid ${SC_EC[domE]};padding-left:8px;"><strong style="color:${SC_EC[domE]};">${domE}（${SC_EMD[domE].h}）</strong>が優勢（${domCount}）。${SC_EMD[domE].d}${lackCount===0?`<br>一方、<strong>${lackE}</strong>が命式にないため、${SC_EMD[lackE].lack}`:''}</div></div><div style="background:var(--bg);border-radius:8px;padding:9px 11px;margin-bottom:8px;"><div style="font-size:.6rem;font-weight:700;color:var(--muted);margin-bottom:5px;">📅 大運（${fwd?'順行':'逆行'} / ${sAge}歳${sMo>0?' '+sMo+'ヶ月':''}〜）</div><div style="font-size:.62rem;color:var(--muted);margin-bottom:5px;line-height:1.5;">大運は10年ごとに切り替わる人生の大きな流れです。青色ハイライトが現在の大運。</div><div style="display:flex;flex-wrap:wrap;gap:1px;margin-bottom:8px;">${daiunCards}</div><div style="font-size:.65rem;color:var(--text);line-height:1.55;background:#fff;border:1px solid var(--border);border-radius:6px;padding:6px 9px;">${curDaiunDesc}</div></div><div style="background:var(--bg);border-radius:8px;padding:9px 11px;"><div style="font-size:.6rem;font-weight:700;color:var(--muted);margin-bottom:4px;">🗓 流年（${cy}年 ${SC_S[ryuS]}${SC_B[ryuB]}）</div><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="font-size:1.2rem;font-weight:900;color:${SC_EC[SC_ES[ryuS]]};">${SC_S[ryuS]}</span><span style="font-size:1.2rem;font-weight:900;color:${SC_EC[SC_EB[ryuB]]};">${SC_B[ryuB]}</span><span style="font-size:.7rem;color:var(--muted);">${SC_ES[ryuS]}・${SC_EB[ryuB]}の年</span></div><div style="font-size:.62rem;color:var(--muted);margin-bottom:5px;line-height:1.5;">流年はその年の干支から読む1年ごとの運勢の傾向です。</div><div style="font-size:.65rem;color:var(--text);line-height:1.55;background:#fff;border:1px solid var(--border);border-radius:6px;padding:6px 9px;">${cy}年は <strong style="color:${SC_EC[SC_ES[ryuS]]};">${SC_S[ryuS]}${SC_B[ryuB]}（${SC_SYOMI[ryuS]}・${SC_BD[ryuB].y}）</strong> の年。${SC_SD[ryuS].k}×${SC_BD[ryuB].k}のエネルギーが働く。${SC_SD[ryuS].d}。${SC_BD[ryuB].d}。</div></div><div style="font-size:.58rem;color:var(--muted);text-align:center;margin-top:6px;">※節入り日はJST基準の概算値。専門家の鑑定と異なる場合があります。</div>`;

}

/* ── バブル開閉 ── */



let activeToolId=null;



function initTool(toolId){
  if(toolId==='tax')calcTax();



  if(toolId==='warikan')calcWarikan();



  if(toolId==='loan')calcLoan();

  if(toolId==='tedori')calcTedori();



  if(toolId==='world-clock')startClock();
  if(toolId==='bpm'){bpmInit();}
  if(toolId==='shorten'){shSetService('tinyurl');}
  if(toolId==='char-count'){calcCharCount();}
  if(toolId==='age'){document.getElementById('ageBase').value='';calcAge();}
  if(toolId==='date-diff'){var today=new Date().toLocaleDateString('sv-SE');document.getElementById('ddFrom').value=today;document.getElementById('ddTo').value=today;calcDateDiff();}
  if(toolId==='unit-conv'){ucChangeCat();}
  if(toolId==='bmi'){calcBmi();}
  if(toolId==='calorie'){calcCalorie();}
  if(toolId==='body-fat'){calcBodyFat();}
  if(toolId==='random'){rdSetMode('dice');rdSetFace(6);}
  if(toolId==='currency'){calcCurrency();}
  if(toolId==='color'){syncColor('pick');}
  if(toolId==='pomodoro'){pomReset();}
  if(toolId==='qr'){qrSetSize(200);}



  if(toolId==='password'){updatePwLen();genPw();}

  if(toolId==='shichu')calcShichu();
}

function openTool(toolId, cardEl){



  stopClock();
  bpmStopIfPlaying();



  activeToolId=toolId;



  const tool=TOOLS.find(t=>t.id===toolId);



  if(!tool)return;



  document.querySelectorAll('.list-tool-card').forEach(c=>c.classList.remove('active'));



  cardEl.classList.add('active');



  const fn=RENDERERS[toolId]||(()=>RENDERERS.default(tool));
  const bodyHTML=fn(tool);
  const isMobile=window.innerWidth<=860;

  const adsHTML=renderAds(toolId);

  if(isMobile){
    document.getElementById('sheetIcon').textContent=tool.icon;
    document.getElementById('sheetName').textContent=tool.name;
    document.getElementById('sheetDesc').textContent=tool.desc;
    document.getElementById('sheetBody').innerHTML=bodyHTML+(adsHTML?`<div class="contextual-ads" style="padding:14px 0 0;margin-top:14px;border-top:1px solid var(--border);">${adsHTML}</div>`:'');
    document.getElementById('mobileSheet').classList.add('open');
    document.getElementById('sheetOverlay').classList.add('visible');
  }else{

  document.getElementById('bubbleIcon').textContent=tool.icon;



  document.getElementById('bubbleName').textContent=tool.name;



  document.getElementById('bubbleDesc').textContent=tool.desc;



  document.getElementById('bubbleBody').innerHTML=bodyHTML;



  const adsEl=document.getElementById('contextualAds');
  if(adsHTML){ adsEl.innerHTML=adsHTML; adsEl.style.display='block'; }
  else { adsEl.innerHTML=''; adsEl.style.display='none'; }



  const panel=document.getElementById('contentPanel');



  const cardRect=cardEl.getBoundingClientRect();



  const panelRect=panel.getBoundingClientRect();



  const arrowY=Math.max(40,cardRect.top+cardRect.height/2-panelRect.top);



  const bubble=document.getElementById('toolBubble');



  bubble.style.setProperty('--arrow-y',arrowY+'px');



  document.getElementById('articlesView').style.display='none';



  bubble.classList.remove('visible');



  void bubble.offsetWidth;



  bubble.classList.add('visible');
  }



  initTool(toolId);



}



function closeTool(){



  stopClock();
  bpmStopIfPlaying();



  document.querySelectorAll('.list-tool-card').forEach(c=>c.classList.remove('active'));



  document.getElementById('toolBubble').classList.remove('visible');
  document.getElementById('mobileSheet').classList.remove('open');
  document.getElementById('sheetOverlay').classList.remove('visible');



  document.getElementById('articlesView').style.display='';



  activeToolId=null;



}







/* ── サイドバー構築・フィルター ── */



function buildSidebar(){



  const listEl=document.getElementById('homeToolList');



  const cats=[...new Set(TOOLS.map(t=>t.cat))];



  let html='';



  cats.forEach(cat=>{



    const tools=TOOLS.filter(t=>t.cat===cat);



    html+=`<div class="list-section" data-cat="${cat}"><div class="list-section-label">${SECTION_LABELS[cat]}</div>`;



    tools.forEach(t=>{



      html+=`<div class="list-tool-card" data-cat="${t.cat}" onclick="openTool('${t.id}',this)"><span class="card-icon">${t.icon}</span><div class="card-info"><div class="card-name">${t.name}</div><div class="card-desc">${t.desc}</div></div><a class="card-page-link" href="/tools/${t.id}/" onclick="event.stopPropagation()" title="${t.name}の専用ページ" aria-label="${t.name}の専用ページ">↗</a></div>`;



    });



    html+=`</div>`;



  });



  listEl.innerHTML=html;



}



function applyFilter(filter){



  document.querySelectorAll('#homeFilterBar .filter-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.filter===filter));



  document.querySelectorAll('#homeToolList .list-tool-card').forEach(card=>card.classList.toggle('hidden',filter!=='all'&&card.dataset.cat!==filter));



  document.querySelectorAll('#homeToolList .list-section').forEach(sec=>{const v=[...sec.querySelectorAll('.list-tool-card')].some(c=>!c.classList.contains('hidden'));sec.classList.toggle('section-hidden',!v);});



  const total=TOOLS.length;const shown=filter==='all'?total:[...document.querySelectorAll('#homeToolList .list-tool-card')].filter(c=>!c.classList.contains('hidden')).length;const bar=document.getElementById('toolCountBar');if(bar)bar.textContent=filter==='all'?`全${total}件のツール`:`${shown}件 / 全${total}件`;



  if(activeToolId){const t=TOOLS.find(t=>t.id===activeToolId);if(t&&filter!=='all'&&t.cat!==filter)closeTool();}



}



document.addEventListener('DOMContentLoaded',()=>{
  if(!document.getElementById('homeToolList'))return;



  buildSidebar();const bar=document.getElementById('toolCountBar');if(bar)bar.textContent=`全${TOOLS.length}件のツール`;
  // スタッツバー動的更新
  const reviewCount=document.querySelectorAll('#articlesGrid .article-card').length;
  const toolCount=Object.keys(RENDERERS).filter(k=>k!=='default').length;
  const elR=document.getElementById('statReviewCount');const elT=document.getElementById('statToolCount');
  if(elR)elR.textContent=reviewCount;if(elT)elT.textContent=toolCount;



  document.getElementById('homeFilterBar').addEventListener('click',e=>{const b=e.target.closest('.filter-btn');if(b)applyFilter(b.dataset.filter);});



});




