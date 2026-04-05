'use client';

import { useState, useRef, useEffect } from 'react';
import { images, Category, ZynioImage } from './data/images';

const categoryLabels: Record<Category, string> = {
  viszony: 'Viszony',
  dontes: 'Döntés',
  ter: 'Tér',
};

type RecordingState = 'idle' | 'recording' | 'done';
type AppState = 'selecting' | 'recording' | 'generating' | 'result';

export default function Home() {
  const [selected, setSelected] = useState<ZynioImage[]>([]);
  const [showAudio, setShowAudio] = useState(false);
  const [appState, setAppState] = useState<AppState>('selecting');

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [amplitude, setAmplitude] = useState(0);

  const [profile, setProfile] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioSectionRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const toggleImage = (img: ZynioImage) => {
    const alreadySelected = selected.find((s) => s.id === img.id);
    if (alreadySelected) {
      setSelected(selected.filter((s) => s.id !== img.id));
      return;
    }
    const countInCategory = selected.filter((s) => s.category === img.category).length;
    if (countInCategory >= 2) return;
    if (selected.length >= 6) return;
    const next = [...selected, img];
    setSelected(next);
    if (next.length === 6) {
      setTimeout(() => {
        setShowAudio(true);
        setTimeout(() => {
          audioSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }, 300);
    }
  };

  const isSelected = (img: ZynioImage) => selected.some((s) => s.id === img.id);
  const categories: Category[] = ['viszony', 'dontes', 'ter'];

  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingState]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const pollAmplitude = (analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      setAmplitude(Math.sqrt(sum / data.length));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setAmplitude(0);
      };
      mr.start();
      setRecordingState('recording');
      setSeconds(0);
      setAudioURL(null);
      setAudioBlob(null);
      pollAmplitude(analyser);
    } catch (err) {
      alert('Nem sikerült hozzáférni a mikrofonhoz. Kérlek engedélyezd a böngészőben.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecordingState('done');
  };

  const restartRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    setSeconds(0);
    setRecordingState('idle');
  };

  const generateProfile = async () => {
    if (!audioBlob) return;
    setAppState('generating');
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'hu');

      const whisperRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!whisperRes.ok) throw new Error('Transzkripció sikertelen');
      const whisperData = await whisperRes.json();
      const transcript = whisperData.text;
console.log('Transzkripció:', transcript);
console.log('Whisper válasz:', JSON.stringify(whisperData));
      const imageList = selected
        .map((img) => `- ${img.label} (kategória: ${categoryLabels[img.category]})`)
        .join('\n');

      const prompt = `Te egy személyiségprofil-elemző vagy, aki PCM, DISC, Big Five, MBTI és Enneagram keretrendszerekben gondolkodik.

A felhasználó 6 állatképet választott ki három kategóriából (Viszony, Döntés, Tér), majd hangosan elmesélte, miért választotta őket.

Választott képek:
${imageList}

A felhasználó elmondása (hangfelvételből átírva):
"${transcript}"

Kérlek, írj egy személyes, meleg hangvételű személyiségprofilt magyarul. Struktúra:

## 🌟 Személyiségprofil

### Általános jellemzés
[2-3 mondat az összképről]

### PCM típus
[Domináns PCM típus és rövid magyarázat]

### DISC profil
[Domináns DISC stílus]

### Big Five
[A legjellemzőbb vonások]

### MBTI
[Valószínű típus és magyarázat]

### Enneagram
[Valószínű típus]

### Összefoglalás
[Személyes, biztató zárás 2-3 mondatban]`;

      const claudeRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!claudeRes.ok) throw new Error('Profilgenerálás sikertelen');
      const claudeData = await claudeRes.json();
      const profileText = claudeData.content[0].text;
      setProfile(profileText);
      setAppState('result');
      setTimeout(() => {
        profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      setErrorMsg(err.message || 'Ismeretlen hiba történt.');
      setAppState('recording');
    }
  };

  const bars = Array.from({ length: 12 });

  const renderProfile = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-amber-900 mt-6 mb-3">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-amber-800 mt-4 mb-1">{line.replace('### ', '')}</h3>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-amber-900 leading-relaxed">{line}</p>;
    });
  };

  return (
    <main className="min-h-screen bg-amber-50 p-6">
      <h1 className="text-3xl font-bold text-amber-900 text-center mb-2">ZynioKey</h1>
      <p className="text-amber-700 text-center mb-6">
        Válassz 2-2-2 képet minden kategóriából ({selected.length}/6)
      </p>

      {categories.map((cat) => (
        <div key={cat} className="mb-8">
          <h2 className="text-xl font-semibold text-amber-800 mb-3">
            {categoryLabels[cat]} ({selected.filter((s) => s.category === cat).length}/2)
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {images
              .filter((img) => img.category === cat)
              .map((img) => (
                <div
                  key={img.id}
                  onClick={() => toggleImage(img)}
                  className={`relative cursor-pointer rounded-xl overflow-hidden border-4 transition-all duration-200 ${
                    isSelected(img)
                      ? 'border-amber-600 scale-95'
                      : 'border-transparent hover:border-amber-300'
                  }`}
                >
                  <div className="w-full aspect-square overflow-hidden">
                    <img src={`/images/${img.filename}`} alt={img.label} className="w-full h-full object-cover" />
                  </div>
                  {isSelected(img) && (
                    <div className="absolute top-2 right-2 bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">✓</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}

      {showAudio && (
        <div
          ref={audioSectionRef}
          className="mt-4 mb-12 mx-auto max-w-lg"
          style={{ animation: 'fadeSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <style>{`
            @keyframes fadeSlideUp {
              from { opacity: 0; transform: translateY(32px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse-ring {
              0%   { transform: scale(1);   opacity: 0.6; }
              100% { transform: scale(1.55); opacity: 0; }
            }
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            .bar {
              border-radius: 99px;
              background: #92400e;
              width: 5px;
              transition: height 0.08s ease;
            }
          `}</style>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-amber-100">
            <div className="text-center mb-6">
              <span className="text-2xl mb-2 block">🎙️</span>
              <h2 className="text-xl font-bold text-amber-900 mb-1">Hangfelvétel</h2>
              <p className="text-amber-700 text-sm leading-relaxed">
                Meséld el, miért választottad ezeket a képeket.<br />
                Nincs helyes vagy helytelen válasz.
              </p>
            </div>

            <div className="flex justify-center gap-2 mb-8 flex-wrap">
              {selected.map((img) => (
                <div key={img.id} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-amber-200">
                  <img src={`/images/${img.filename}`} alt={img.label} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <div className="text-center text-4xl font-mono text-amber-800 mb-6 tabular-nums">
              {formatTime(seconds)}
            </div>

            <div className="flex items-center justify-center gap-1.5 h-14 mb-8">
              {bars.map((_, i) => {
                const offset = Math.sin((i / bars.length) * Math.PI);
                const randomFactor = 0.5 + offset * 0.5;
                const h = recordingState === 'recording'
                  ? Math.max(6, amplitude * 200 * randomFactor + Math.random() * 8)
                  : recordingState === 'done' ? 8 + Math.sin(i * 0.8) * 6 : 6;
                return (
                  <div key={i} className="bar" style={{ height: `${h}px`, opacity: recordingState === 'idle' ? 0.3 : 0.85 }} />
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-4">
              {recordingState === 'idle' && (
                <>
                  <button
                    onClick={startRecording}
                    className="relative w-20 h-20 rounded-full bg-amber-700 text-white text-3xl flex items-center justify-center shadow-lg hover:bg-amber-600 active:scale-95 transition-transform"
                  >
                    <span className="absolute inset-0 rounded-full bg-amber-400" style={{ animation: 'pulse-ring 1.6s ease-out infinite' }} />
                    ●
                  </button>
                  <p className="text-amber-500 text-xs">Kattints a felvétel indításához</p>
                </>
              )}

              {recordingState === 'recording' && (
                <>
                  <button
                    onClick={stopRecording}
                    className="w-20 h-20 rounded-full bg-red-600 text-white text-2xl flex items-center justify-center shadow-lg hover:bg-red-500 active:scale-95 transition-transform"
                  >
                    ■
                  </button>
                  <p className="text-red-400 text-xs animate-pulse">● Felvétel folyamatban…</p>
                </>
              )}

              {recordingState === 'done' && (
                <div className="flex flex-col items-center gap-4 w-full">
                  {audioURL && <audio src={audioURL} controls className="w-full rounded-xl" />}
                  {errorMsg && (
                    <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-4 py-2">{errorMsg}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={restartRecording}
                      disabled={appState === 'generating'}
                      className="px-5 py-2.5 rounded-full border-2 border-amber-700 text-amber-700 text-sm font-medium hover:bg-amber-50 transition disabled:opacity-40"
                    >
                      ↺ Újra
                    </button>
                    <button
                      onClick={generateProfile}
                      disabled={appState === 'generating'}
                      className="px-7 py-2.5 rounded-full bg-amber-800 text-white text-sm font-medium hover:bg-amber-700 transition shadow disabled:opacity-40 flex items-center gap-2"
                    >
                      {appState === 'generating' ? (
                        <>
                          <span style={{ display: 'inline-block', animation: 'spin-slow 1s linear infinite' }}>⏳</span>
                          Generálás…
                        </>
                      ) : 'Profil generálása →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {profile && (
        <div
          ref={profileRef}
          className="mt-4 mb-16 mx-auto max-w-lg bg-white rounded-3xl shadow-xl p-8 border border-amber-100"
          style={{ animation: 'fadeSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          {renderProfile(profile)}
          <div className="mt-8 text-center">
            <button
              onClick={() => { setSelected([]); setShowAudio(false); setProfile(null); setRecordingState('idle'); setSeconds(0); setAppState('selecting'); }}
              className="px-6 py-3 rounded-full border-2 border-amber-700 text-amber-700 text-sm font-medium hover:bg-amber-50 transition"
            >
              ↺ Újra kezdés
            </button>
          </div>
        </div>
      )}
    </main>
  );
}