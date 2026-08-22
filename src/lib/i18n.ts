import { useUiPrefs } from '../context/UiPrefsContext'

// A static phrase dictionary, not a live per-render translation call: the
// per-panel language pickers inside the Sugam widget already call Groq for
// content that's genuinely dynamic (simplified documents, assistant
// replies) — re-translating on every render with an LLM would add latency
// and flakiness to the one thing that has to work instantly and reliably
// live on stage, the app's own chrome. English strings are the keys, so a
// missing translation just falls back to the original text instead of
// breaking.
//
// Covers the highest-visibility chrome: the accessibility bar, the home
// screen, the three demo portals, the shared KYC form, and the Sugam
// widget's own static labels. Deliberately does not translate live data
// values (account numbers, dates, transaction descriptions) — those come
// from the mock "existing site," which a real integration wouldn't
// localize on Sugam's behalf either.
//
// Only Hindi is filled in for now; the other five languages in
// SUPPORTED_LANGUAGES fall back to English until more translations are
// added — the shape here is what extending them means: one more object key
// per phrase, no code changes.

const DICTIONARY: Record<string, Partial<Record<string, string>>> = {
  // Accessibility bar
  'Bank demo': { 'hi-IN': 'बैंक डेमो' },
  'Government demo': { 'hi-IN': 'सरकारी डेमो' },
  'Health demo': { 'hi-IN': 'स्वास्थ्य डेमो' },
  Language: { 'hi-IN': 'भाषा' },
  'Read this page aloud': { 'hi-IN': 'यह पृष्ठ पढ़कर सुनाएं' },
  'Stop reading': { 'hi-IN': 'पढ़ना बंद करें' },
  'Large text': { 'hi-IN': 'बड़ा टेक्स्ट' },
  'High contrast': { 'hi-IN': 'उच्च कंट्रास्ट' },
  'Dyslexia font': { 'hi-IN': 'डिस्लेक्सिया फ़ॉन्ट' },
  'Caregiver mode': { 'hi-IN': 'देखभालकर्ता मोड' },
  Preferences: { 'hi-IN': 'प्राथमिकताएं' },
  'Log out': { 'hi-IN': 'लॉग आउट' },
  speed: { 'hi-IN': 'गति' },

  // Home screen
  'Choose a service to open': { 'hi-IN': 'खोलने के लिए एक सेवा चुनें' },
  'Sugam adds voice navigation, document help and guided form-filling on top of each site below. The accessibility tools stay with you as you move between them.': {
    'hi-IN':
      'सुगम नीचे दी गई हर साइट के ऊपर आवाज़ नेविगेशन, दस्तावेज़ सहायता और फॉर्म भरने में मदद जोड़ता है। जब आप साइटों के बीच जाते हैं, सुविधाएं आपके साथ रहती हैं।',
  },
  'Signed in as': { 'hi-IN': 'इस रूप में साइन इन हैं' },
  Open: { 'hi-IN': 'खोलें' },
  Banking: { 'hi-IN': 'बैंकिंग' },
  'Check your balance, subsidy status and recent transactions.': {
    'hi-IN': 'अपना बैलेंस, सब्सिडी स्थिति और हाल के लेनदेन देखें।',
  },
  Government: { 'hi-IN': 'सरकार' },
  'Track your application status and required documents.': {
    'hi-IN': 'अपने आवेदन की स्थिति और आवश्यक दस्तावेज़ देखें।',
  },
  Healthcare: { 'hi-IN': 'स्वास्थ्य सेवा' },
  'View your next appointment and current prescription.': {
    'hi-IN': 'अपनी अगली अपॉइंटमेंट और मौजूदा दवा देखें।',
  },

  // Bank portal
  Account: { 'hi-IN': 'खाता' },
  'Recent transactions': { 'hi-IN': 'हाल के लेनदेन' },
  'Update KYC details': { 'hi-IN': 'केवाईसी विवरण अपडेट करें' },

  // Government portal
  Application: { 'hi-IN': 'आवेदन' },
  'Expected by': { 'hi-IN': 'अपेक्षित तिथि' },
  'Documents required': { 'hi-IN': 'आवश्यक दस्तावेज़' },
  'Update application details': { 'hi-IN': 'आवेदन विवरण अपडेट करें' },
  'Update application': { 'hi-IN': 'आवेदन अपडेट करें' },

  // Health portal
  'Next appointment': { 'hi-IN': 'अगली अपॉइंटमेंट' },
  'Current prescription': { 'hi-IN': 'मौजूदा दवा' },
  'Refill due': { 'hi-IN': 'रिफिल की तिथि' },
  'Assigned doctor': { 'hi-IN': 'नियुक्त डॉक्टर' },
  'Patient ID': { 'hi-IN': 'रोगी आईडी' },
  'Update patient details': { 'hi-IN': 'रोगी विवरण अपडेट करें' },
  'Update details': { 'hi-IN': 'विवरण अपडेट करें' },

  // Shared KYC form
  'Full name': { 'hi-IN': 'पूरा नाम' },
  'Phone number': { 'hi-IN': 'फ़ोन नंबर' },
  Address: { 'hi-IN': 'पता' },
  'Date of birth': { 'hi-IN': 'जन्म तिथि' },
  'ID number': { 'hi-IN': 'आईडी नंबर' },
  Submit: { 'hi-IN': 'जमा करें' },
  '✔ Details submitted.': { 'hi-IN': '✔ विवरण जमा हो गया।' },
  'Edit again': { 'hi-IN': 'दोबारा संपादित करें' },

  // Sugam widget chrome
  'Sugam assistant': { 'hi-IN': 'सुगम सहायक' },
  'Helping on this page': { 'hi-IN': 'इस पृष्ठ पर सहायता कर रहा है' },
  Voice: { 'hi-IN': 'आवाज़' },
  Simplify: { 'hi-IN': 'सरल करें' },
  'Fill form': { 'hi-IN': 'फॉर्म भरें' },
  Sign: { 'hi-IN': 'साइन' },
  '🎙 Ask by voice': { 'hi-IN': '🎙 आवाज़ से पूछें' },
  'Photograph a form, bill or prescription': { 'hi-IN': 'फॉर्म, बिल या दवा पर्ची की फोटो लें' },
  '🔊 Read aloud': { 'hi-IN': '🔊 पढ़कर सुनाएं' },
  'Past documents': { 'hi-IN': 'पिछले दस्तावेज़' },
  'Tap any word above to hear it explained more simply.': {
    'hi-IN': 'ऊपर किसी भी शब्द को सरल भाषा में समझने के लिए टैप करें।',
  },
  'or snap your Aadhaar, ration card, PAN or mark sheet': {
    'hi-IN': 'या अपना आधार, राशन कार्ड, पैन या मार्कशीट स्कैन करें',
  },
  '🎙 Fill by voice': { 'hi-IN': '🎙 आवाज़ से भरें' },
  'Walks through the KYC form field by field, checking each answer with you before moving on — or edit any field directly on the dashboard at any time.': {
    'hi-IN':
      'केवाईसी फॉर्म को एक-एक करके भरता है, आगे बढ़ने से पहले हर जवाब की पुष्टि करता है — या आप किसी भी फ़ील्ड को कभी भी डैशबोर्ड पर सीधे संपादित कर सकते हैं।',
  },
  'Language for the simplified text': { 'hi-IN': 'सरल किए गए पाठ की भाषा' },
  'Reading text…': { 'hi-IN': 'पाठ पढ़ा जा रहा है…' },
  'Simplifying, in': { 'hi-IN': 'सरल किया जा रहा है,' },
  'Original text extracted': { 'hi-IN': 'निकाला गया मूल पाठ' },
  '🔴 Listening — speak now…': { 'hi-IN': '🔴 सुन रहे हैं — अभी बोलें…' },
  'Thinking…': { 'hi-IN': 'सोच रहे हैं…' },
  '👂 Listening for "Hey Sugam"…': { 'hi-IN': '👂 "Hey Sugam" सुन रहे हैं…' },
  '👂 Hands-free active — tap to stop': { 'hi-IN': '👂 हैंड्स-फ्री चालू — रोकने के लिए टैप करें' },
  '🗣️ Turn on "Hey Sugam" hands-free': { 'hi-IN': '🗣️ "Hey Sugam" हैंड्स-फ्री चालू करें' },
  'Say “Hey Sugam” followed by your question — no need to touch the screen. Say “stop” to turn it off.': {
    'hi-IN': '"Hey Sugam" कहकर अपना सवाल पूछें — स्क्रीन छूने की ज़रूरत नहीं। बंद करने के लिए "stop" कहें।',
  },

  // Caregiver mode / emergency
  'Caregiver mode — helping someone else today': { 'hi-IN': 'देखभालकर्ता मोड — आज किसी और की मदद कर रहे हैं' },
  'Activity log': { 'hi-IN': 'गतिविधि लॉग' },
  'Nothing logged yet this session.': { 'hi-IN': 'इस सत्र में अभी तक कुछ भी दर्ज नहीं हुआ।' },
  Emergency: { 'hi-IN': 'आपातकाल' },
  Name: { 'hi-IN': 'नाम' },
  'Save contact': { 'hi-IN': 'संपर्क सहेजें' },
  'Call now': { 'hi-IN': 'अभी कॉल करें' },
  'Change saved contact': { 'hi-IN': 'सहेजा गया संपर्क बदलें' },
  Call: { 'hi-IN': 'कॉल करें' },
  'now?': { 'hi-IN': '?' },
  Update: { 'hi-IN': 'अपडेट करें' },
  Save: { 'hi-IN': 'सहेजें' },
  'an emergency contact': { 'hi-IN': 'आपातकालीन संपर्क' },
  'A saved contact gets you a one-tap call from anywhere in Sugam.': {
    'hi-IN': 'सहेजा गया संपर्क आपको सुगम में कहीं से भी एक टैप में कॉल करने देता है।',
  },
  'Saving…': { 'hi-IN': 'सहेजा जा रहा है…' },
}

export function translate(text: string, lang: string): string {
  if (lang === 'en-IN') return text
  return DICTIONARY[text]?.[lang] ?? text
}

/** `t('Some English label')` — returns the current site language's translation if one exists, else the English original. */
export function useT() {
  const { siteLanguage } = useUiPrefs()
  return (text: string) => translate(text, siteLanguage)
}
