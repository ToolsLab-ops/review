
/* ============================================================
   Chord Metronome Engine v2 — shared core (Web Audio API, no deps)
   ============================================================ */
(function (root) {
  'use strict';

  var NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  var DEGREE_MAJOR = { I:0, II:2, III:4, IV:5, V:7, VI:9, VII:11 };
  var DEGREE_MINOR = { I:0, II:2, IIIb:3, III:3, IV:5, V:7, VIb:8, VI:8, VIIb:10, VII:10 };

  var QUALITY_INTERVALS = {
    '':     [0,4,7],
    'm':    [0,3,7],
    '7':    [0,4,7,10],
    'maj7': [0,4,7,11],
    'm7':   [0,3,7,10],
    'm7b5': [0,3,6,10],
  };

  function noteNameToMidiBase(name) { return NOTE_NAMES.indexOf(name); }

  // Build a chord's absolute note list (semitones from C4=0), applying a per-chord octave shift.
  function buildChordNotes(chordDef, keyRootSemitone, isMinorKey, octaveShift) {
    var scaleMap = isMinorKey ? DEGREE_MINOR : DEGREE_MAJOR;
    var rootOffset = scaleMap[chordDef.deg];
    var intervals = QUALITY_INTERVALS[chordDef.q] || QUALITY_INTERVALS[''];
    var rootAbs = keyRootSemitone + rootOffset;
    var notes = intervals.map(function (iv) { return rootAbs + iv; });

    if (chordDef.bassDeg) {
      var bassOffset = scaleMap[chordDef.bassDeg];
      if (chordDef.bassLowered) bassOffset -= 1;
      var bassAbs = keyRootSemitone + bassOffset;
      notes = [bassAbs - 12].concat(notes.filter(function (n) {
        return ((n % 12) + 12) % 12 !== ((bassAbs % 12) + 12) % 12;
      }));
    }
    var shift = (octaveShift || 0) * 12;
    return notes.map(function (n) { return n + shift; });
  }

  // Applies a voicing operation HISTORY to a chord's note list, in the exact order the user
  // clicked: 'high' lowers whichever note is currently highest by an octave, 'up' raises
  // whichever note is currently lowest by an octave. Replaying the clicks in original order
  // (rather than tallying "N highs + M ups" and applying all highs then all ups) means
  // alternating high/up presses behave the way a user watching the notes move would expect —
  // e.g. high then up on the note that became the new lowest raises it back, matching
  // "undo what I just did" rather than silently cancelling to a different, unintended voicing.
  // ops: array of 'high' | 'up', in click order.
  function applyVoicingOps(notes, ops) {
    var result = notes.slice();
    (ops || []).forEach(function (op) {
      if (op === 'high') {
        var maxIdx = 0;
        for (var a = 1; a < result.length; a++) if (result[a] > result[maxIdx]) maxIdx = a;
        result[maxIdx] -= 12;
      } else if (op === 'up') {
        var minIdx = 0;
        for (var b = 1; b < result.length; b++) if (result[b] < result[minIdx]) minIdx = b;
        result[minIdx] += 12;
      }
    });
    return result;
  }

  function semitoneToFreq(semitoneFromC4) {
    var midi = 60 + semitoneFromC4;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Note name + octave label for staff/reference display, e.g. semitone 0 -> "C4"
  function semitoneToLabel(semitoneFromC4) {
    var midi = 60 + semitoneFromC4;
    var name = NOTE_NAMES[((midi % 12) + 12) % 12];
    var octave = Math.floor(midi / 12) - 1;
    return name + octave;
  }

  /* ---------------- Audio Engine ---------------- */
  function ChordMetronomeEngine() {
    this.ctx = null;
    this.isPlaying = false;
    this.timerId = null;
    this.beatCount = 0;
    this.chordIndex = 0;
    this.state = 'idle'; // 'idle' | 'countdown' | 'playing'
    this.countdownBeatsLeft = 0;
    this.onBeat = null;          // (beatInBar, beatsPerBar, state)
    this.onChordChange = null;   // (chordIndex, chordDef, notes)
    this.metronomeGain = 0.8;    // 0..1
    this.chordGain = 0.8;        // 0..1
  }

  ChordMetronomeEngine.prototype._ensureCtx = function () {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  };

  // sound: 'click' (electronic), 'wood' (woodblock-ish), 'beep'
  ChordMetronomeEngine.prototype.playClick = function (accent, sound) {
    var ctx = this._ensureCtx();
    var vol = this.metronomeGain;
    if (vol <= 0) return;
    var now = ctx.currentTime;

    if (sound === 'wood') {
      // Short noise burst through a bandpass filter -> woodblock-like tick
      var bufferSize = Math.floor(ctx.sampleRate * 0.05);
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
      var noise = ctx.createBufferSource();
      noise.buffer = buffer;
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = accent ? 1800 : 1200;
      filter.Q.value = 3;
      var gain = ctx.createGain();
      // A narrow bandpass filter on white noise cuts most of the signal's energy
      // (only the ~Q-wide band around `frequency` survives), so the post-filter level is
      // far quieter than the pre-filter gain value suggests — boost to compensate, or the
      // woodblock sound is effectively inaudible next to the other metronome sounds.
      var boost = 6;
      gain.gain.setValueAtTime((accent ? 0.9 : 0.6) * vol * boost, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      noise.connect(filter).connect(gain).connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.06);
    } else if (sound === 'beep') {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = accent ? 1800 : 1200;
      g.gain.setValueAtTime((accent ? 0.4 : 0.25) * vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      // 'click' — original electronic square click
      var osc2 = ctx.createOscillator();
      var g2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.value = accent ? 1500 : 1000;
      g2.gain.setValueAtTime((accent ? 0.35 : 0.2) * vol, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc2.connect(g2).connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.06);
    }
  };

  // timbre: 'piano' | 'organ' | 'strings' | 'soft'
  // pattern: 'block' (all notes together) | 'arpeggio-up' | 'arpeggio-updown' | 'rhythm' (quarter-note comping)
  ChordMetronomeEngine.prototype.playChordNotes = function (semitones, durationSec, timbre, pattern) {
    var ctx = this._ensureCtx();
    var vol = this.chordGain;
    if (vol <= 0) return;
    var now = ctx.currentTime;
    var self = this;

    if (pattern === 'arpeggio-up' || pattern === 'arpeggio-updown') {
      // Always play arpeggios in ascending pitch order (lowest to highest, matching how the
      // notes read top-to-bottom on the treble staff), regardless of the order the chord's
      // intervals were built in.
      var seq = semitones.slice().sort(function (a, b) { return a - b; });
      if (pattern === 'arpeggio-updown') seq = seq.concat(seq.slice(0, -1).reverse());
      var step = durationSec / seq.length;
      seq.forEach(function (st, i) {
        self._playVoice(semitoneToFreq(st), now + i * step, step * 0.95, timbre, vol);
      });
    } else if (pattern === 'rhythm') {
      // Simple comping: hit on beat 1 and the "and" of beat 2 (durationSec assumed = 1 chord's full hold)
      var hits = [0, durationSec * 0.5];
      hits.forEach(function (t) {
        semitones.forEach(function (st) {
          self._playVoice(semitoneToFreq(st), now + t, durationSec * 0.4, timbre, vol);
        });
      });
    } else {
      // 'block' (default): all notes together, sustained
      semitones.forEach(function (st) {
        self._playVoice(semitoneToFreq(st), now, durationSec, timbre, vol);
      });
    }
  };

  ChordMetronomeEngine.prototype._playVoice = function (freq, startTime, duration, timbre, vol) {
    var ctx = this.ctx;
    var master = ctx.createGain();
    master.connect(ctx.destination);
    vol = vol == null ? 1 : vol;
    if (!this.activeVoices) this.activeVoices = [];
    this.activeVoices.push(master);

    if (timbre === 'organ') {
      var partials = [1, 2, 3, 4];
      var gains = [0.5, 0.22, 0.12, 0.08];
      master.gain.setValueAtTime(0.0001, startTime);
      master.gain.linearRampToValueAtTime(0.5 * vol, startTime + 0.03);
      master.gain.setValueAtTime(0.5 * vol, startTime + Math.max(0.03, duration - 0.08));
      master.gain.linearRampToValueAtTime(0.0001, startTime + duration);
      partials.forEach(function (p, i) {
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * p;
        g.gain.value = gains[i];
        osc.connect(g).connect(master);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      });
    } else if (timbre === 'strings') {
      var osc1 = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth'; osc2.type = 'sawtooth';
      osc1.frequency.value = freq; osc2.frequency.value = freq * 1.005;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 1800;
      master.gain.setValueAtTime(0.0001, startTime);
      master.gain.linearRampToValueAtTime(0.26 * vol, startTime + 0.25);
      master.gain.setValueAtTime(0.26 * vol, startTime + Math.max(0.25, duration - 0.3));
      master.gain.linearRampToValueAtTime(0.0001, startTime + duration + 0.2);
      osc1.connect(filter); osc2.connect(filter); filter.connect(master);
      osc1.start(startTime); osc2.start(startTime);
      osc1.stop(startTime + duration + 0.3);
      osc2.stop(startTime + duration + 0.3);
    } else if (timbre === 'soft') {
      // Soft pad: sine-based, slow attack, gentle lowpass — non-fatiguing
      var s1 = ctx.createOscillator();
      var s2 = ctx.createOscillator();
      s1.type = 'sine'; s2.type = 'sine';
      s1.frequency.value = freq; s2.frequency.value = freq * 2;
      var g2b = ctx.createGain();
      g2b.gain.value = 0.12;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1400;
      master.gain.setValueAtTime(0.0001, startTime);
      master.gain.linearRampToValueAtTime(0.22 * vol, startTime + 0.18);
      master.gain.setValueAtTime(0.22 * vol, startTime + Math.max(0.18, duration - 0.25));
      master.gain.linearRampToValueAtTime(0.0001, startTime + duration + 0.25);
      s1.connect(lp); s2.connect(g2b); g2b.connect(lp); lp.connect(master);
      s1.start(startTime); s2.start(startTime);
      s1.stop(startTime + duration + 0.3); s2.stop(startTime + duration + 0.3);
    } else {
      // 'piano' (default): triangle + soft 2nd partial, exponential decay, lowpass to remove harshness
      var osc = ctx.createOscillator();
      var osc2b = ctx.createOscillator();
      osc.type = 'triangle'; osc2b.type = 'sine';
      osc.frequency.value = freq; osc2b.frequency.value = freq * 2.001;
      var g2c = ctx.createGain();
      g2c.gain.value = 0.12;
      var lp2 = ctx.createBiquadFilter();
      lp2.type = 'lowpass'; lp2.frequency.value = 3200;
      master.gain.setValueAtTime(0.4 * vol, startTime);
      master.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(lp2); osc2b.connect(g2c); g2c.connect(lp2); lp2.connect(master);
      osc.start(startTime); osc2b.start(startTime);
      osc.stop(startTime + duration + 0.05);
      osc2b.stop(startTime + duration + 0.05);
    }
  };

  // Immediately fades out and disconnects every currently-sounding chord voice.
  // Needed because playChordNotes() schedules oscillators ahead of time via startTime/stop() —
  // clearing the tick timer alone does not silence notes already in flight, so without this,
  // starting a new chord (e.g. after a settings change) would overlap with the previous one
  // and stack in volume.
  ChordMetronomeEngine.prototype.silenceActiveVoices = function () {
    if (!this.activeVoices || !this.ctx) { this.activeVoices = []; return; }
    var ctx = this.ctx;
    var now = ctx.currentTime;
    this.activeVoices.forEach(function (master) {
      try {
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0.0001, now + 0.03);
        setTimeout(function () { try { master.disconnect(); } catch (e) {} }, 50);
      } catch (e) {}
    });
    this.activeVoices = [];
  };

  ChordMetronomeEngine.prototype.stop = function () {
    this.isPlaying = false;
    this.state = 'idle';
    if (this.timerId) { clearTimeout(this.timerId); this.timerId = null; }
    this.beatCount = 0;
    this.chordIndex = 0;
    this.silenceActiveVoices();
  };

  /**
   * options:
   *  bpm, beatsPerBar, progressionKey/progression (custom array), keyRoot, keyMode,
   *  chordDuration ('whole'|'half'|'quarter'|'eighth'),
   *  timbre, pattern, metronomeSound ('click'|'wood'|'beep'),
   *  metronomeOn, chordsOn, octaveShifts (array parallel to chords, semitone-octave shift per chord index),
   *  countdownBars (int, number of metronome-only bars to play once at the START of this
   *    playback run, before the first chord sounds; 0 = off. Does NOT repeat on later chord
   *    changes within the same run — only on the next explicit start() call.)
   */
  ChordMetronomeEngine.prototype.start = function (options) {
    this.stop();
    this._ensureCtx();
    this.isPlaying = true;
    var beatsPerBar = options.beatsPerBar || 4;
    var bpm = options.bpm || 90;
    var beatDurSec = 60 / bpm;
    var progression = options.progression || { chords: [{ deg: 'I', q: '' }] };
    var keyRootSemitone = noteNameToMidiBase(options.keyRoot || 'C');
    var isMinorKey = options.keyMode === 'minor';
    var chordBeatMap = { whole: beatsPerBar, half: beatsPerBar / 2, quarter: 1, eighth: 0.5 };
    var defaultChordBeats = chordBeatMap[options.chordDuration] || beatsPerBar;
    // A chord definition may carry its own `beats` (e.g. a 12-bar blues where each chord holds
    // a different number of bars, or a jazz turnaround where some chords get half a bar) — this
    // takes priority over the tool's global chordDuration setting for that one chord.
    function beatsForChord(chordDef) {
      return chordDef.beats != null ? chordDef.beats : defaultChordBeats;
    }
    var octaveShifts = options.octaveShifts || [];
    var voicingOps = options.voicingOps || [];
    var countdownBars = options.countdownBars || 0;

    this.beatCount = 0;
    this.chordIndex = 0;
    // beatsIntoChord counts how many "playing" beats have elapsed for the CURRENT chord,
    // BEFORE this tick. When it's 0, this tick must sound a new chord.
    var beatsIntoChord = 0;
    var currentChordBeats = beatsForChord(progression.chords[0]);
    this.state = (countdownBars > 0 && options.chordsOn) ? 'countdown' : 'playing';
    this.countdownBeatsLeft = countdownBars * beatsPerBar;

    var self = this;

    function soundChord() {
      if (!options.chordsOn) return;
      var idx = self.chordIndex % progression.chords.length;
      var chordDef = progression.chords[idx];
      currentChordBeats = beatsForChord(chordDef);
      var shift = octaveShifts[idx] || 0;
      var notes = buildChordNotes(chordDef, keyRootSemitone, isMinorKey, shift);
      notes = applyVoicingOps(notes, voicingOps[idx]);
      var durSec = currentChordBeats * beatDurSec * 0.95;
      self.playChordNotes(notes, durSec, options.timbre, options.pattern);
      if (typeof self.onChordChange === 'function') {
        self.onChordChange(idx, chordDef, notes);
      }
    }

    function tick() {
      if (!self.isPlaying) return;
      var beatInBar = self.beatCount % beatsPerBar;
      var isAccent = beatInBar === 0;

      if (options.metronomeOn !== false) {
        self.playClick(isAccent, options.metronomeSound);
      }

      if (self.state === 'countdown') {
        self.countdownBeatsLeft--;
        if (self.countdownBeatsLeft <= 0) {
          self.state = 'playing';
          beatsIntoChord = 0;
        }
      }

      if (typeof self.onBeat === 'function') self.onBeat(beatInBar, beatsPerBar, self.state);

      if (self.state === 'playing') {
        if (beatsIntoChord === 0) soundChord();
        beatsIntoChord++;
        if (beatsIntoChord >= currentChordBeats) {
          beatsIntoChord = 0;
          self.chordIndex++;
          // Countdown only ever happens once, right after start() is called (see the initial
          // `this.state` assignment below) — NOT on every subsequent chord change within the
          // same playback run. Re-entering 'countdown' here on every chord change was the old
          // (undesired) behavior.
        }
      }

      self.beatCount++;
      self.timerId = setTimeout(tick, beatDurSec * 1000);
    }
    tick();
  };

  root.ChordMetronomeEngineV2 = ChordMetronomeEngine;
  root.buildChordNotes = buildChordNotes;
  root.applyVoicingOps = applyVoicingOps;
  root.semitoneToLabel = semitoneToLabel;
  root.NOTE_NAMES_V2 = NOTE_NAMES;
})(window);

/* ============================================================
   UI helper functions shared by ToolsLab + Cooltake embeds (v2)
   Requires: engine-v2.js loaded first (window.ChordMetronomeEngineV2, buildChordNotes, semitoneToLabel)
   ============================================================ */

// Diatonic letter/accidental spelling for a semitone-in-octave value (0-11), C=0.
// Uses "nearest natural, sharp if needed" — a simplified reference spelling, not full
// key-signature-aware notation engraving.
var CTP_LETTER_ORDER = ['C','D','E','F','G','A','B'];
var CTP_LETTER_SEMI = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
function ctpSpellSemitone(semiInOctave) {
  for (var i = 0; i < CTP_LETTER_ORDER.length; i++) {
    var l = CTP_LETTER_ORDER[i];
    if (CTP_LETTER_SEMI[l] === semiInOctave) return { letter: l, accidental: 0 };
  }
  for (var j = 0; j < CTP_LETTER_ORDER.length; j++) {
    var l2 = CTP_LETTER_ORDER[j];
    if (CTP_LETTER_SEMI[l2] === semiInOctave - 1) return { letter: l2, accidental: 1 };
  }
  return { letter: 'C', accidental: 0 };
}
// Returns a "staff position" integer: number of diatonic letter-steps above C0 (arbitrary origin),
// used purely to compute vertical placement consistently across both clefs.
function ctpDiatonicPosition(semitoneFromC4) {
  var octave = 4 + Math.floor(semitoneFromC4 / 12);
  var semiInOctave = ((semitoneFromC4 % 12) + 12) % 12;
  var spelled = ctpSpellSemitone(semiInOctave);
  var letterIndex = CTP_LETTER_ORDER.indexOf(spelled.letter);
  return { pos: octave * 7 + letterIndex, accidental: spelled.accidental, letter: spelled.letter, octave: octave };
}

// Renders one 5-line staff (treble or bass) for a set of semitone-from-C4 notes.
// refPos/refY anchor a known diatonic position to a known pixel Y so treble/bass share one coordinate system.
function ctpRenderStaffLines(semitones, clef, x0, width, top, lineGap, colorNote) {
  var lines = [0,1,2,3,4].map(function (i) { return top + i * lineGap; });
  // Anchor: treble bottom line = E4, bass bottom line = G2.
  var anchorSemitone = clef === 'bass' ? -17 : 4; // G2=-17, E4=4 (semitone-from-C4)
  var anchorPos = ctpDiatonicPosition(anchorSemitone).pos;
  var bottomLineY = top + 4 * lineGap;
  var stepPx = lineGap / 2; // each diatonic step = half a line-gap (line-to-space)
  // All notes of the chord sound on the same beat, so they share one x position (a real
  // chord symbol, not a staircase of separate beats). Notes a 2nd apart (adjacent line/space,
  // stepDiff===1) get a small left/right offset so their noteheads don't visually overlap —
  // standard notation practice for seconds within a chord.
  var centerX = x0 + width / 2;

  var withPos = semitones.map(function (s) {
    var d = ctpDiatonicPosition(s);
    var y = bottomLineY - (d.pos - anchorPos) * stepPx;
    return { s: s, d: d, y: y, pos: d.pos };
  }).sort(function (a, b) { return a.pos - b.pos; });

  var noteEls = withPos.map(function (n, i) {
    var prev = withPos[i - 1];
    var isSecondFromPrev = prev && (n.pos - prev.pos === 1);
    var x = centerX + (isSecondFromPrev ? 8 : 0);
    var ledger = '';
    if (n.y < top - 1) ledger = '<line x1="' + (x - 9) + '" y1="' + top + '" x2="' + (x + 9) + '" y2="' + top + '" stroke="#8b9bff" stroke-width="1"/>';
    if (n.y > bottomLineY + 1) ledger = '<line x1="' + (x - 9) + '" y1="' + bottomLineY + '" x2="' + (x + 9) + '" y2="' + bottomLineY + '" stroke="#8b9bff" stroke-width="1"/>';
    var accidentalEl = n.d.accidental ? '<text x="' + (x - 13 - (isSecondFromPrev ? 8 : 0)) + '" y="' + (n.y + 4) + '" font-size="11" fill="' + colorNote + '">♯</text>' : '';
    return ledger + accidentalEl + '<ellipse cx="' + x + '" cy="' + n.y + '" rx="5.5" ry="4.2" fill="' + colorNote + '"/>';
  }).join('');

  var lineEls = lines.map(function (y) {
    return '<line x1="' + (x0 - 20) + '" y1="' + y + '" x2="' + (x0 + width) + '" y2="' + y + '" stroke="#555" stroke-width="1"/>';
  }).join('');
  var clefGlyph = clef === 'bass'
    ? '<text x="' + (x0 - 34) + '" y="' + (top + 3 * lineGap + 5) + '" font-size="22" fill="' + colorNote + '">𝄢</text>'
    : '<text x="' + (x0 - 34) + '" y="' + (top + 4 * lineGap + 4) + '" font-size="26" fill="' + colorNote + '">𝄞</text>';
  return clefGlyph + lineEls + noteEls;
}

// Renders a grand staff (treble + bass) for a chord.
// `semitones` (treble): the FULL set of currently-sounding notes, including root/bass — this is
// whatever the user's "最高音↓/最低音↑" voicing operations produced, shown as-is with no note removed.
// `fixedBassSemitone`: the chord's bass/root pitch class as originally defined (unaffected by
// voicing operations), shown an octave lower on the bass clef purely as a fixed reference —
// it never moves when the treble voicing is changed.
// Good enough for "which notes will sound, roughly where" reference — not full music engraving.
// Drops a pitch by octaves until it sits within the bass clef's comfortable range
// (between two ledger lines above and below the staff), rather than a single fixed -12.
// A high bass/root (e.g. B4) would otherwise land far above the bass staff on one -12 shift;
// this keeps dropping by 12 until it's actually readable on the bass clef.
function ctpFitToBassRange(semitone) {
  var s = semitone;
  // Comfortable bass clef range: G2 (bottom line, -17) up to A3 (top line, -3), with a little
  // headroom (one ledger line) above and below. A note landing above the staff's top line
  // (e.g. C4/middle C, semitone 0) sits in the empty gap between the two clefs and visually
  // reads as overlapping the treble notes above it — so cap the top of the range at the bass
  // staff's own top line, not up near middle C.
  while (s > -3) s -= 12;
  while (s < -20) s += 12;
  return s;
}

function ctpRenderStaffSVG(semitones, fixedBassSemitone, width) {
  width = width || 260;
  var trebleNotes = semitones.slice();
  var bassNotes = fixedBassSemitone == null ? [] : [ctpFitToBassRange(fixedBassSemitone)];

  var lineGap = 9;
  var trebleTop = 8;
  var bassTop = trebleTop + 4 * lineGap + 22;
  var height = bassTop + 4 * lineGap + 10;
  var x0 = 46;

  var trebleSvg = ctpRenderStaffLines(trebleNotes, 'treble', x0, width - x0, trebleTop, lineGap, '#8b9bff');
  var bassSvg = ctpRenderStaffLines(bassNotes, 'bass', x0, width - x0, bassTop, lineGap, '#f0a878');

  return '<svg viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="' + height + '" xmlns="http://www.w3.org/2000/svg">' +
    trebleSvg + bassSvg + '</svg>';
}

function ctpQualityLabel(q) {
  return { '':'', m:'m', '7':'7', maj7:'maj7', m7:'m7', m7b5:'m7♭5' }[q] || '';
}

function ctpChordLabel(chordDef) {
  var base = chordDef.deg + ctpQualityLabel(chordDef.q);
  if (chordDef.bassDeg && chordDef.bassDeg !== chordDef.deg) {
    base += '/' + (chordDef.bassLowered ? '♭' : '') + chordDef.bassDeg;
  }
  return base;
}

// Degree (Roman numeral) -> semitone offset from the tonic, duplicated here (matching
// DEGREE_MAJOR/DEGREE_MINOR inside the engine's own IIFE) because this file's chord-name
// display logic lives in a separate <script> block from the engine and can't reach its
// module-scoped constants directly.
var CTP_DEGREE_MAJOR = { I:0, II:2, III:4, IV:5, V:7, VI:9, VII:11 };
var CTP_DEGREE_MINOR = { I:0, II:2, IIIb:3, III:3, IV:5, V:7, VIb:8, VI:8, VIIb:10, VII:10 };

// Resolves a chord definition (degree + quality, possibly a slash chord) to the concrete
// chord name that actually sounds in the given key — e.g. deg:'IV' in key D major -> "G".
function ctpActualChordName(chordDef, keyRoot, isMinor) {
  var scaleMap = isMinor ? CTP_DEGREE_MINOR : CTP_DEGREE_MAJOR;
  var keyRootSemitone = NOTE_NAMES_V2.indexOf(keyRoot);
  var rootSemitone = ((keyRootSemitone + scaleMap[chordDef.deg]) % 12 + 12) % 12;
  var rootName = NOTE_NAMES_V2[rootSemitone];
  var name = rootName + ctpQualityLabel(chordDef.q);
  if (chordDef.bassDeg && chordDef.bassDeg !== chordDef.deg) {
    var bassOffset = scaleMap[chordDef.bassDeg];
    if (chordDef.bassLowered) bassOffset -= 1;
    var bassSemitone = ((keyRootSemitone + bassOffset) % 12 + 12) % 12;
    name += '/' + NOTE_NAMES_V2[bassSemitone];
  }
  return name;
}

const CHORD_PROGRESSIONS = {
  oudou:    { name:'王道進行（Ⅳ-Ⅴ-Ⅲm-Ⅵm）', chords:[{deg:'IV',q:''},{deg:'V',q:''},{deg:'III',q:'m'},{deg:'VI',q:'m'}] },
  canon:    { name:'カノン進行（I-V-VIm-IIIm-IV-I-IV-V）', chords:[{deg:'I',q:''},{deg:'V',q:''},{deg:'VI',q:'m'},{deg:'III',q:'m'},{deg:'IV',q:''},{deg:'I',q:''},{deg:'IV',q:''},{deg:'V',q:''}] },
  komuro:   { name:'小室進行（Ⅵm-Ⅳ-Ⅰ-Ⅴ）', chords:[{deg:'VI',q:'m'},{deg:'IV',q:''},{deg:'I',q:''},{deg:'V',q:''}] },
  // 丸サ進行はジャズのII-V-Iに近いテンポ感のため、1小節1コードではなく2拍単位で聴かせる（beats: 2）。
  marusa:   { name:'丸サ進行（I-VIm-IIm-V）', chords:[{deg:'I',q:'',beats:2},{deg:'VI',q:'m',beats:2},{deg:'II',q:'m',beats:2},{deg:'V',q:'',beats:2}] },
  junkan:   { name:'循環コード（Ⅰ-Ⅵm-Ⅳ-Ⅴ）', chords:[{deg:'I',q:''},{deg:'VI',q:'m'},{deg:'IV',q:''},{deg:'V',q:''}] },
  // 実際の12小節ブルース形式（I-I-I-I-IV-IV-I-I-V-IV-I-I）を展開。1小節=4拍として beats を指定。
  blues:    { name:'ブルース進行（Ⅰ-Ⅳ-Ⅴ）', chords:[
                {deg:'I',q:'7',beats:16},{deg:'IV',q:'7',beats:8},{deg:'I',q:'7',beats:8},
                {deg:'V',q:'7',beats:4},{deg:'IV',q:'7',beats:4},{deg:'I',q:'7',beats:8},
              ] },
  setsunai: { name:'切ない系進行（VIm-IV-V-VIm）', chords:[{deg:'VI',q:'m'},{deg:'IV',q:''},{deg:'V',q:''},{deg:'VI',q:'m'}] },
  cliche:   { name:'クリシェ進行（I-I/VII-I7/♭VII-VIm）', chords:[
                { deg:'I', q:'' , bassDeg:'I' },
                { deg:'I', q:'' , bassDeg:'VII', bassLowered:true },
                { deg:'I', q:'7', bassDeg:'VII', bassLowered:true },
                { deg:'VI', q:'m', bassDeg:'VI' },
              ] },
};
window.CHORD_PROGRESSIONS = CHORD_PROGRESSIONS;


