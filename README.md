# Mel-Spectrum-Analyzer

Online web based Mel-spectrum, power spectrum, FFT analyzer for speech and music processing.

See the demo here: [TWcamel.github.io/tmp-audio_vs](https://TWcamel.github.io/tmp-audio_vs)

Compatibility: Works on Firefox Desktop (v76), Chrome Desktop (v83) and Chrome Android (v81).


Everything is analyzed in a JavaScript Worklet node. The processing load may be higher for high number of FFTs and big sampling windows, which can cause jitters. If it does, then increase the frame skip rate (skip a number of frames after processing every frame). It doesn't use the built-in Web API FFT of analyzer node because that doesn't have as much analysis options, and the script processing node is getting obsolete. Some Web API features are experimental, so it may not work on older browsers.


No external JS dependencies.

The music file is from [Aboyne Castle](http://abcnotation.com/tunePage?a=tunearch.org/wiki/Aboyne_Castle_(2).no-ext/0001) (CC License). It is a good example for observing notes transition.

