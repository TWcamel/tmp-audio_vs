let mel_filters, spec_type = 1, AMP_LOG = !0, FREQ_LOG = !1, window_step = .025, window_width = .04, f_min = 50, f_max = 4e3, N_FFT_cut = 128, N_mels = 64, mel_bins_Hz = [], NORM_MAX = 1e5, SILENCE_MAX = 1e3, P_GAIN = 1e3, skip_rate = 3, high_f_emph = Math.round(10 / N_mels), N_FFT_max = parseInt(sampleRate / f_max * (N_FFT_cut - 1)), fft_const = -2 * Math.PI / N_FFT_max, hconst = 2 * Math.PI / 1023, window_buff_size = 1024, step_buff_size = 512, fi = 0, WindowsIn = [], curInBuff = new Array, lastWindowBuff = new Array(window_buff_size);
lastWindowBuff.fill(0); let local_maxima = new Array(20);
local_maxima.fill(SILENCE_MAX);
let running = !1;
class SpectrumProcessor extends AudioWorkletProcessor {
    constructor() {
        super(), running = !0;
        set_settings({ spec_type: 1, plot_type: 1, plot_len: 90, color_scheme: 1, f_min: 50, f_max: 4e3, N_fft_bins: 300, N_mel_bins: 128, window_width: 40, window_step: 25, amplitude_log: !1, freq_log: !0, pre_norm_gain: 1e3, pre_norm_silence_ceil: 1e3, norm_max: 1e5, local_norm_length: 20, high_f_emph: 10, skip_rate: -1 }), this.port.onmessage = (e => {
            if (e.data.spec_type) this.port.postMessage(set_settings(e.data));
            else if (WindowsIn.length > 0) {
                let e = WindowsIn[0]; if (WindowsIn.splice(0, 1), 1 == spec_type) {
                    let t = get_melbanks(hamming(e));
                    this.port.postMessage(t)
                } else if (2 == spec_type) {
                    let t = get_fft(hamming(e), 1);
                    this.port.postMessage(t)
                } else if (3 == spec_type) {
                    let t = get_fft(hamming(e), 0);
                    this.port.postMessage(t)
                }
            } else 22 == e.data ? (console.log("End process"), running = !1) : (console.log("Unrecognized Rx on worklet port"), console.log(e.data))
        })
    } process(e, t, _) { return e[0][0] && (curInBuff = curInBuff.concat(Array.from(e[0][0]))).length >= step_buff_size && (this.create_segment(curInBuff.splice(0, step_buff_size)), curInBuff = curInBuff.splice(step_buff_size)), !!running } create_segment(e) {
        let t = new Array
        t = (t = t.concat(lastWindowBuff.slice(step_buff_size, window_buff_size))).concat(e.slice(0, step_buff_size)), lastWindowBuff = t, WindowsIn.push(t), this.port.postMessage(1)
    }
} let fft_bins_Hz = [];
function set_settings(e) {
    skip_rate = e.skip_rate < 0 ? sampleRate <= 16e3 ? 0 : sampleRate <= 32e3 ? 1 : sampleRate <= 44100 ? 2 : sampleRate <= 48e3 ? 3 : sampleRate <= 96e3 ? 8 : 10 : e.skip_rate, window_width = e.window_width / 1e3, window_step = e.window_step / 1e3, window_buff_size = sampleRate * window_width, step_buff_size = sampleRate * window_step, f_min = e.f_min, f_max = e.f_max, N_FFT_cut = e.N_fft_bins, N_FFT_max = parseInt(sampleRate / f_max * (N_FFT_cut - 1)), fft_const = -2 * Math.PI / N_FFT_max, hconst = 2 * Math.PI / (window_buff_size - 1), fft_bins_Hz = [];
    for (let e = 0; e < N_FFT_cut; e += 1)fft_bins_Hz[e] = Math.round(e * f_max / N_FFT_cut);
    N_mels = e.N_mel_bins, mel_filters = construct_mel_banks(N_FFT_cut, f_max, N_mels, f_min, f_max), high_f_emph = e.high_f_emph, NORM_MAX = e.norm_max, P_GAIN = e.pre_norm_gain, SILENCE_MAX = e.pre_norm_silence_ceil, (AMP_LOG = e.amplitude_log) && (P_GAIN = P_GAIN), AMP_LOG && (SILENCE_MAX /= 20), local_maxima = new Array(e.local_norm_length), lastWindowBuff.fill(SILENCE_MAX), curInBuff = new Array, (lastWindowBuff = new Array(window_buff_size)).fill(0), fi = 0, WindowsIn = [], spec_type = e.spec_type;
    var t = step_buff_size / sampleRate, _ = window_buff_size / sampleRate;
    console.log("SR:" + String(sampleRate) + ", FFT_SR:" + String(sampleRate / (skip_rate + 1)) + ", WindowSamples:" + String(window_buff_size) + ", StepSamples:" + String(step_buff_size) + ", t_step:" + String(t) + ", t_window:" + String(_) + ", N_FFT_max:" + String(Math.round(N_FFT_max)) + ", N_FFT_cut:" + String(N_FFT_cut) + ", N_mels:" + String(N_mels) + ", f_min:" + String(f_min) + ", f_max:" + String(f_max) + ", skip_rate:" + String(skip_rate) + ", StartFrame:" + String(currentFrame));
    var n = { bins_Hz: fft_bins_Hz };
    return 1 == spec_type && (n = { bins_Hz: mel_bins_Hz }), n
} function get_melbanks(e) {
    const t = e.length;
    let _ = new Array(N_FFT_cut), n = new Array(N_mels)
    var s = SILENCE_MAX;
    for (let n = 0; n < N_FFT_cut; n += 1) { let s = 0, a = 0; for (let _ = 0; _ < t; _ += 1)if (e[_]) { const t = fft_const * n * _; s += Math.cos(t) * e[_], a += Math.sin(t) * e[_] } var r = Math.sqrt(s * s + a * a); _[n] = P_GAIN * r * r } return mel_filters.forEach(function (e, t) { var r = 0, a = 1 + high_f_emph * t; _.forEach(function (t, _) { r += t * e[_] }), r = AMP_LOG ? 20 * Math.log10(r * a) : r * a / 100, n[t] = r, r > s && (s = r) }), local_maxima.push(s), local_maxima.splice(0, 1), s = arrayMax(local_maxima), n = n.map(function (e) { return Math.round(e * NORM_MAX / s) })
} function get_fft(e, t) {
    const _ = e.length; let n = new Array(N_FFT_cut);
    var s = SILENCE_MAX;
    for (let i = 0; i < N_FFT_cut; i += 1) {
        let o = 0, f = 0; for (let t = 0; t < _; t += 1)if (e[t]) { const _ = fft_const * i * t; o += Math.cos(_) * e[t], f += Math.sin(_) * e[t] } var r = Math.sqrt(o * o + f * f);
        r *= t ? P_GAIN / N_FFT_cut * r : P_GAIN / 100
        var a = 1 + high_f_emph * i;
        AMP_LOG ? r = 20 * Math.log10(r * a) : r *= a, n[i] = r, r > s && (s = r)
    } return local_maxima.push(s), local_maxima.splice(0, 1), s = arrayMax(local_maxima), n = n.map(function (e) { return Math.round(e * NORM_MAX / s) })
} var skp = 0; function hamming(e) {
    let t = [];
    for (let _ = 0; _ < e.length; _ += 1)skp >= skip_rate ? (t[_] = (.53836 - .46164 * Math.cos(hconst * _)) * e[_], skp = 0) : skp++;
    return t
} function arrayMin(e) {
    for (var t = e.length, _ = 1 / 0; t--;)e[t] < _ && (_ = e[t]);
    return _
} function arrayMax(e) {
    for (var t = e.length, _ = -1 / 0; t--;)e[t] > _ && (_ = e[t]);
    return _
} function arrayAverage(e) {
    var t = 0, _ = e.length; for (var n in e) t += e[n]
    return t / _
} function get_mel_filters(e) {
    let t = new Array(N_mels);
    return mel_filters.forEach(function (_, n) {
        var s = 0
        e.forEach(function (e, t) { s += e * _[t] }), t[n] = s
    }), t
} function mels2Hz(e) { return 700 * (Math.exp(e / 1127) - 1) } function Hz2mels(e) { return 1127 * Math.log(1 + e / 700) } function construct_mel_banks(e, t, _, n, s) {
    let r = [], a = [], i = Hz2mels(n), o = (Hz2mels(s) - i) / (parseInt(_) + 1); mel_bins_Hz = new Array(_); for (let n = 0; n < _; n++) {
        let _ = mels2Hz(i + n * o);
        r[n] = Math.floor(_ / (t / e)), mel_bins_Hz[n] = Math.round(_)
    } for (let t = 0; t < r.length; t++) {
        a[t] = [];
        var f = t != r.length - 1 ? r[t + 1] - r[t] : r[t] - r[t - 1];
        a[t].filterRange = f;
        for (let _ = 0; _ < e; _++)_ > r[t] + f ? a[t][_] = 0 : _ > r[t] ? a[t][_] = 1 - (_ - r[t]) / f : _ == r[t] ? a[t][_] = 1 : _ >= r[t] - f ? a[t][_] = 1 - (r[t] - _) / f : a[t][_] = 0
    } return a
} registerProcessor("spectrum-processor", SpectrumProcessor);
