/**
 * Universal WebGL Capability & Health Detector
 * Safely tests WebGL availability without leaking contexts.
 */

let _webglAvailable = null;

export function isWebGLAvailable() {
  if (_webglAvailable !== null) return _webglAvailable;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || 
               canvas.getContext('webgl') || 
               canvas.getContext('experimental-webgl');

    if (!gl) {
      _webglAvailable = false;
      return false;
    }

    // Free the test context immediately so we don't consume one of the browser's limited contexts (max 8-16)
    const loseContextExt = gl.getExtension('WEBGL_lose_context');
    if (loseContextExt) {
      loseContextExt.loseContext();
    }

    _webglAvailable = true;
    return true;
  } catch (e) {
    _webglAvailable = false;
    return false;
  }
}

/**
 * Check if the user has explicitly requested Safe Mode (No WebGL)
 */
export function isSafeModeActive() {
  try {
    return localStorage.getItem('atw_safe_mode') === 'true' || !isWebGLAvailable();
  } catch {
    return !isWebGLAvailable();
  }
}

export function setSafeMode(enabled) {
  try {
    localStorage.setItem('atw_safe_mode', enabled ? 'true' : 'false');
  } catch {}
}
