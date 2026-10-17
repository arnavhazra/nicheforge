export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.02;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(
    (item) => item.lang.toLowerCase().startsWith("en") && /samantha|google us english|aria|jenny/i.test(item.name),
  );
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function silence() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
