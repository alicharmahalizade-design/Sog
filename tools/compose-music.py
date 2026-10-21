# آهنگ‌سازی چهار قطعه‌ی آرام و بی‌کلام (اثر اصلی، بدون حق نشر شخص ثالث)
import numpy as np, wave, sys, os
SR = 44100
rng = np.random.default_rng(1405)
def hz(n):  # MIDI → Hz
    return 440.0 * 2 ** ((n - 69) / 12)

def env_adsr(n, a, r):
    e = np.ones(n); A = int(a*SR); R = int(r*SR)
    e[:A] = np.linspace(0, 1, A) ** 1.5
    e[-R:] *= np.linspace(1, 0, R) ** 1.2
    return e

def pad_note(f, dur, bright=1.0):
    n = int(dur*SR); t = np.arange(n)/SR; s = np.zeros(n)
    for det in (-0.0018, 0, 0.0021):
        ph = rng.uniform(0, 2*np.pi)
        for h in range(1, 9):
            s += np.sin(2*np.pi*f*(1+det)*h*t + ph*h) / (h ** (1.6/bright))
    vib = 1 + 0.004*np.sin(2*np.pi*0.18*t)
    return s * vib * env_adsr(n, min(2.5, dur*.35), min(3.5, dur*.45))

def piano(f, dur=4.5, vel=1.0):
    n = int(dur*SR); t = np.arange(n)/SR; s = np.zeros(n)
    B = 0.0004
    for h in range(1, 10):
        fh = f*h*np.sqrt(1+B*h*h)
        if fh > 9000: break
        s += np.exp(-t*(0.9 + h*0.55)) * np.sin(2*np.pi*fh*t) / (h**1.8)
    att = np.minimum(1, t/0.006)
    return s * att * vel

def bell(f, dur=6.0, vel=1.0):
    n = int(dur*SR); t = np.arange(n)/SR; s = np.zeros(n)
    for ratio, amp, dec in ((1, 1, .55), (2.0, .5, .9), (2.76, .35, 1.3), (5.4, .2, 2.2), (8.93, .1, 3.0)):
        s += amp*np.exp(-t*dec)*np.sin(2*np.pi*f*ratio*t)
    return s * np.minimum(1, t/0.004) * vel

def place(buf, sig, at):
    i = int(at*SR)
    if i >= len(buf): return
    j = min(len(buf), i+len(sig)); buf[i:j] += sig[:j-i]

def lowpass(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1/SR)
    X *= 1/np.sqrt(1+(f/cutoff)**4)
    return np.fft.irfft(X, len(x))

def reverb(x, decay=2.2, wet=.35):
    L = int(decay*2*SR); t = np.arange(L)/SR
    out = []
    for seed in (11, 23):
        r = np.random.default_rng(seed)
        ir = r.standard_normal(L) * np.exp(-t*(6.9/decay/2*2))
        ir = lowpass(ir, 5000); ir /= np.sqrt(np.sum(ir**2))
        N = 1 << int(np.ceil(np.log2(len(x)+L)))
        y = np.fft.irfft(np.fft.rfft(x, N)*np.fft.rfft(ir, N), N)[:len(x)]
        out.append((1-wet)*x + wet*y*0.9)
    return np.stack(out, 1)

def finish(stereo, name, fade_in=3, fade_out=6):
    n = len(stereo)
    fi = int(fade_in*SR); fo = int(fade_out*SR)
    stereo[:fi] *= np.linspace(0, 1, fi)[:, None]
    stereo[-fo:] *= np.linspace(1, 0, fo)[:, None]**1.5
    stereo /= np.max(np.abs(stereo)) / 0.85
    pcm = (stereo*32767).astype('<i2')
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

def chord(root, kind):  # MIDI notes
    return [root, root+(3 if kind == 'm' else 4), root+7]

DUR = 92
out = sys.argv[1]

# ۱) آرامش — لا مینور، پد گرم + ملودی پیانوی کم‌حرف
b = np.zeros(int(DUR*SR)); prog = [(57,'m'),(53,''),(48,''),(55,'')]
for k in range(11):
    r, kd = prog[k % 4]; t0 = k*8
    for nn in chord(r, kd): place(b, pad_note(hz(nn), 10, .9)*.16, t0)
    place(b, pad_note(hz(r-12), 10, .7)*.12, t0)
mel = [76,74,72,71, 72,71,69,67, 69,72,74,76, 74,72,71,69]
for i, nn in enumerate(mel*3):
    if i % 3 == 2: continue
    place(b, piano(hz(nn), 5, .55), 4 + i*2.0)
finish(reverb(lowpass(b, 3200), 2.6, .38), f"{out}/calm.wav")

# ۲) یاد — ر مینور، آرپژهای آرام پیانو
b = np.zeros(int(DUR*SR)); prog = [(50,'m'),(46,''),(53,''),(48,'')]
for k in range(11):
    r, kd = prog[k % 4]; t0 = k*8; c = chord(r, kd)
    arp = [c[0], c[1], c[2], c[1]+12, c[2], c[1], c[0]+12, c[2]]
    for i, nn in enumerate(arp): place(b, piano(hz(nn+12), 4.5, .5 if i else .7), t0 + i*1.0)
    place(b, piano(hz(r-12), 7, .6), t0)
    for nn in c: place(b, pad_note(hz(nn), 9, .6)*.05, t0)
finish(reverb(lowpass(b, 3800), 2.8, .42), f"{out}/memory.wav")

# ۳) سکوت — بُردون می + زنگ‌های آرام پنتاتونیک
b = np.zeros(int(DUR*SR))
place(b, pad_note(hz(40), DUR, .5)*.20, 0); place(b, pad_note(hz(47), DUR, .5)*.13, 0)
place(b, pad_note(hz(52), DUR, .6)*.08, 0)
pent = [64, 67, 69, 71, 74, 76, 79]
t = 3.0
while t < DUR-8:
    place(b, bell(hz(int(rng.choice(pent))), 7, rng.uniform(.25, .45)), t)
    t += rng.choice([2.5, 3.5, 4.5, 6.0])
finish(reverb(lowpass(b, 4200), 3.4, .5), f"{out}/silence.wav")

# ۴) دلتنگی — دو مینور، پد زهی با اوج‌گیری‌های آرام و خط بم
b = np.zeros(int(DUR*SR)); prog = [(48,'m'),(44,''),(51,''),(46,'')]
for k in range(8):
    r, kd = prog[k % 4]; t0 = k*11.5
    for nn in chord(r+12, kd): place(b, pad_note(hz(nn), 14, 1.2)*.13, t0)
    place(b, pad_note(hz(r-12), 14, .8)*.16, t0)
line = [60,58,56,55, 56,58,60,63]
for i, nn in enumerate(line): place(b, pad_note(hz(nn+12), 6, 1.4)*.07, 6 + i*11.5)
finish(reverb(lowpass(b, 2600), 3.0, .45), f"{out}/longing.wav")
print("ok")
