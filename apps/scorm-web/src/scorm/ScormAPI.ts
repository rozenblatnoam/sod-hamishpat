// SCORM 1.2 API wrapper
declare global {
  interface Window { API?: any; }
}

function findAPI(win: Window): any {
  let tries = 0;
  while (!win.API && win.parent && win.parent !== win && tries < 10) {
    win = win.parent;
    tries++;
  }
  return win.API ?? null;
}

const api = () => findAPI(window);

export const scorm = {
  initialized: false,

  init(): boolean {
    const a = api();
    if (!a) return false;
    const result = a.LMSInitialize('');
    this.initialized = result === 'true' || result === true;
    return this.initialized;
  },

  set(key: string, value: string) {
    const a = api();
    if (!a || !this.initialized) return;
    a.LMSSetValue(key, value);
    a.LMSCommit('');
  },

  get(key: string): string {
    const a = api();
    if (!a || !this.initialized) return '';
    return a.LMSGetValue(key) ?? '';
  },

  finish() {
    const a = api();
    if (!a || !this.initialized) return;
    a.LMSFinish('');
    this.initialized = false;
  },

  setScore(raw: number, min = 0, max = 100) {
    this.set('cmi.core.score.raw', String(raw));
    this.set('cmi.core.score.min', String(min));
    this.set('cmi.core.score.max', String(max));
  },

  setStatus(status: 'passed' | 'failed' | 'incomplete' | 'completed' | 'browsed' | 'not attempted') {
    this.set('cmi.core.lesson_status', status);
  },

  setTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    this.set('cmi.core.session_time', `${String(h).padStart(4, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  },

  setSuspendData(data: object) {
    try {
      this.set('cmi.suspend_data', JSON.stringify(data));
    } catch {}
  },

  getSuspendData(): object | null {
    try {
      const raw = this.get('cmi.suspend_data');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAvailable(): boolean {
    return !!api();
  },
};
