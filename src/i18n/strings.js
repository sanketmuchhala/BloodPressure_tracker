export const strings = {
  gu: {
    // App title
    appTitle: 'ગૌરવ બ્લડ પ્રેશર લોગ્સ',

    // Navigation
    navEntry: 'એન્ટ્રી',
    navLogs: 'લોગ્સ',
    langToggle: 'ગુ',

    // Login page
    login: {
      title: 'લોગિન',
      emailPlaceholder: 'તમારું ઈમેઈલ',
      sendMagicLink: 'મેજિક લિંક મોકલો',
      checkEmail: 'તમારા ઈમેઈલ તપાસો',
      checkEmailDesc: 'અમે તમને લોગિન લિંક મોકલી છે. કૃપા કરીને તમારું ઈમેઈલ તપાસો.',
      invalidEmail: 'કૃપા કરીને માન્ય ઈમેઈલ દાખલ કરો',
      error: 'લોગિન નિષ્ફળ. ફરી પ્રયાસ કરો.',

      // NEW STRINGS FOR AUTH TABS
      signInTab: 'સાઇન ઇન',
      signUpTab: 'સાઇન અપ',
      magicLinkTab: 'મેજિક લિંક',
      emailLabel: 'ઈમેઈલ',
      passwordLabel: 'પાસવર્ડ',
      signInButton: 'સાઇન ઇન',
      signUpButton: 'સાઇન અપ',
      sendLinkButton: 'લિંક મોકલો',
      checkEmailConfirm: 'તમારા ઈમેઈલને ચકાસો',
      checkEmailConfirmDesc: 'અમે તમને ખાતા પુષ્ટિ લિંક મોકલી છે.',
      checkEmailLink: 'સાઇન ઇન લિંક માટે તમારું ઈમેઈલ તપાસો',
      signingIn: 'સાઇન ઇન કરી રહ્યું છે...',
      validationError: 'કૃપા કરીને બધી ફીલ્ડ ભરો',
      errors: {
        generic: 'કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.',
        signin: 'સાઇન ઇન નિષ્ફળ. ઈમેઈલ અને પાસવર્ડ તપાસો.',
        signup: 'સાઇન અપ નિષ્ફળ. ફરી પ્રયાસ કરો.',
        passwordShort: 'પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરોનો હોવો જોઈએ',
        authFailed: 'પ્રમાણીકરણ નિષ્ફળ. ફરી પ્રયાસ કરો.',
      }
    },

    // Entry page
    entry: {
      title: 'નવી એન્ટ્રી',
      systolic: 'ઉપરનું (Uparnu)',
      diastolic: 'નીચેનું (Neechenu)',
      pulse: 'નાડી (Pulse)',
      readingTime: 'રીડિંગ સમય',
      takePhoto: 'ફોટો લો',
      retakePhoto: 'ફોટો ફરીથી લો',
      runOCR: 'OCR ચલાવો',
      save: 'સેવ કરો',
      saving: 'સેવ કરી રહ્યું છે...',
      required: 'જરૂરી',

      // OCR status
      ocrIdle: 'ફોટો લીધા પછી OCR ચલાવો',
      ocrProcessing: 'OCR પ્રોસેસ કરી રહ્યું છે...',
      ocrComplete: 'શોધાયેલ',
      ocrFailed: 'OCR નિષ્ફળ. મેન્યુઅલી દાખલ કરો.',

      // Success/Error
      saveSuccess: 'એન્ટ્રી સફળતાપૂર્વક સેવ થઈ!',
      saveError: 'એન્ટ્રી સેવ કરવામાં નિષ્ફળ. ફરી પ્રયાસ કરો.',
      validationError: 'કૃપા કરીને બધી જરૂરી ફીલ્ડ ભરો',

      // OCR confidence
      confidenceHigh: 'ઉચ્ચ',
      confidenceMedium: 'મધ્યમ',
      confidenceLow: 'નીચું',
      confidenceNone: 'નથી',
      photo: 'ફોટો',
      optional: 'વૈકલ્પિક',
      at: 'at',
      errors: {
        noPhoto: 'ફોટો નથી',
        imageError: 'ફોટો લોડ કરવામાં ભૂલ',
      },
    },

    // Session page
    session: {
      title: 'રીડિંગ સેશન',
      startSession: 'સેશન શરૂ કરો',
      addReading: 'વધુ રીડિંગ ઉમેરો',
      removeReading: 'રીડિંગ દૂર કરો',
      reading: 'રીડિંગ',
      average: 'સરેરાશ',
      readingCount: 'રીડિંગ્સ',
      singleMode: 'સિંગલ રીડિંગ',
      sessionMode: 'સેશન મોડ',
      showReadings: 'રીડિંગ્સ બતાવો',
      hideReadings: 'રીડિંગ્સ છુપાવો',
      individualReadings: 'વ્યક્તિગત રીડિંગ્સ',
    },

    // Logs page
    logs: {
      title: 'લોગ્સ',
      bp: 'બી.પી.',
      pulse: 'નાડી',
      empty: 'લોગ્સ નથી. એન્ટ્રી ઉમેરો!',
      loadError: 'લોગ્સ લોડ કરવામાં નિષ્ફળ',
      viewPhoto: 'ફોટો જુઓ',
      closePhoto: 'બંધ કરો',
    },

    // Common
    loading: 'લોડ કરી રહ્યું છે...',
    error: 'ભૂલ',
    tryAgain: 'ફરી પ્રયાસ કરો',
    cancel: 'રદ કરો',
    ok: 'ઠીક છે',
  },

  en: {
    // App title
    appTitle: 'Gaurav Blood Pressure Logs',

    // Navigation
    navEntry: 'Entry',
    navLogs: 'Logs',
    langToggle: 'En',

    // Login page
    login: {
      title: 'Login',
      emailPlaceholder: 'Your email',
      sendMagicLink: 'Send Magic Link',
      checkEmail: 'Check your email',
      checkEmailDesc: 'We sent you a login link. Please check your email.',
      invalidEmail: 'Please enter a valid email',
      error: 'Login failed. Please try again.',

      // NEW STRINGS FOR AUTH TABS
      signInTab: 'Sign In',
      signUpTab: 'Sign Up',
      magicLinkTab: 'Magic Link',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      signInButton: 'Sign In',
      signUpButton: 'Sign Up',
      sendLinkButton: 'Send Link',
      checkEmailConfirm: 'Check your email',
      checkEmailConfirmDesc: 'We sent you an account confirmation link.',
      checkEmailLink: 'Check your email for the sign-in link',
      signingIn: 'Signing you in...',
      validationError: 'Please fill all fields',
      errors: {
        generic: 'Something went wrong. Please try again.',
        signin: 'Sign in failed. Check your email and password.',
        signup: 'Sign up failed. Please try again.',
        passwordShort: 'Password must be at least 6 characters',
        authFailed: 'Authentication failed. Please try again.',
      }
    },

    // Entry page
    entry: {
      title: 'New Entry',
      systolic: 'Systolic (Uparnu)',
      diastolic: 'Diastolic (Neechenu)',
      pulse: 'Pulse (Nadi)',
      readingTime: 'Reading Time',
      takePhoto: 'Take Photo',
      retakePhoto: 'Retake Photo',
      runOCR: 'Run OCR',
      save: 'Save',
      saving: 'Saving...',
      required: 'Required',

      // OCR status
      ocrIdle: 'Run OCR after taking photo',
      ocrProcessing: 'Processing OCR...',
      ocrComplete: 'Detected',
      ocrFailed: 'OCR failed. Enter manually.',

      // Success/Error
      saveSuccess: 'Entry saved successfully!',
      saveError: 'Failed to save entry. Please try again.',
      validationError: 'Please fill all required fields',

      // OCR confidence
      confidenceHigh: 'High',
      confidenceMedium: 'Medium',
      confidenceLow: 'Low',
      confidenceNone: 'None',
      photo: 'Photo',
      optional: 'Optional',
      at: 'at',
      errors: {
        noPhoto: 'No photo',
        imageError: 'Error loading photo',
      },
    },

    // Session page
    session: {
      title: 'Reading Session',
      startSession: 'Start Session',
      addReading: 'Add Another Reading',
      removeReading: 'Remove Reading',
      reading: 'Reading',
      average: 'Average',
      readingCount: 'readings',
      singleMode: 'Single Reading',
      sessionMode: 'Session Mode',
      showReadings: 'Show Readings',
      hideReadings: 'Hide Readings',
      individualReadings: 'Individual Readings',
    },

    // Logs page
    logs: {
      title: 'Logs',
      bp: 'B.P.',
      pulse: 'Pulse',
      empty: 'No logs yet. Add an entry!',
      loadError: 'Failed to load logs',
      viewPhoto: 'View Photo',
      closePhoto: 'Close',
    },

    // Common
    loading: 'Loading...',
    error: 'Error',
    tryAgain: 'Try Again',
    cancel: 'Cancel',
    ok: 'OK',
  },
};
