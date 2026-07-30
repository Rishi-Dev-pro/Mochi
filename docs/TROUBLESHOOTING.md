# Troubleshooting & Known Issue Resolution 🛠️

This document provides a resolution matrix for common developer issues, runtime errors, hardware permission blockades, and performance bottlenecks encountered in **Mochi AI Companion**.

---

## 1. Problem Resolution Matrix

### 1.1 Webcam & Vision Pipeline Issues

#### Issue: Camera permission denied or prompt not appearing
- **Symptom**: MotionDetector logs `NotAllowedError: Permission denied` in browser console.
- **Cause**: Browser blocked camera access globally or site origin is HTTP instead of HTTPS/localhost.
- **Solution**:
  1. Webcams require secure contexts (`https://` or `http://localhost`).
  2. Click the lock/tune icon in the browser URL address bar.
  3. Reset **Camera** permission to **Allow**.
  4. Reload page and click **Enable Presence Detection** in Mochi settings.

#### Issue: Black canvas or zero motion detected
- **Symptom**: Webcam stream is active but `motionMagnitude` remains `0.0`.
- **Cause**: Inadequate ambient lighting or another application (Zoom, Teams) locking the camera hardware device exclusively.
- **Solution**:
  - Close background video conferencing software that holds exclusive lock on camera hardware.
  - Increase lighting on your face/desk area.

---

### 1.2 Anthropic Claude API Errors

#### Issue: `401 Unauthorized` API Key Error
- **Symptom**: Chat console displays *"Mochi couldn't connect to Claude API."*
- **Cause**: Missing or incorrect `VITE_ANTHROPIC_API_KEY` in `.env.local`.
- **Solution**:
  1. Open `.env.local` in project root.
  2. Ensure key begins with `sk-ant-api03-...`.
  3. Restart Vite dev server (`npm run dev`) since `.env` changes require server reboot.

#### Issue: `429 Rate Limit Exceeded` or `529 Overloaded`
- **Symptom**: Chat streams stop halfway or display error fallback state.
- **Cause**: Anthropic API tier limit reached or temporary server capacity spike.
- **Solution**:
  - Wait 30 seconds for automatic exponential backoff to recover.
  - Upgrade Anthropic Console billing tier from Free to Build Tier 1.

---

### 1.3 Supabase Database & Auth Failures

#### Issue: `PGRST301: JWT expired` or RLS Access Denied
- **Symptom**: Database queries fail with status `403 Forbidden` or `401 Unauthorized`.
- **Cause**: Supabase auth session token expired or RLS policy checking `auth.uid() = user_id` fails because user is unauthenticated.
- **Solution**:
  - Execute `initializeGuestSession()` to re-issue an anonymous guest token.
  - Verify RLS policies in Supabase dashboard match definitions in [`DATABASE.md`](DATABASE.md#3-row-level-security-rls-rules).

---

### 1.4 React & Three.js (R3F) Errors

#### Issue: `WebGL: CONTEXT_LOST_WEBGL` or 3D Canvas Freezes
- **Symptom**: 3D character disappears, leaving a black box or browser warning: *"Context Lost"*.
- **Cause**: GPU VRAM exhaustion or laptop switching between integrated/dedicated graphics cards.
- **Solution**:
  - Enable WebGL context restoration listener in `MochiCharacter`:
    ```javascript
    gl.domElement.addEventListener('webglcontextrestored', () => rebindTextures());
    ```
  - Reduce texture resolutions for 3D GLTF models from 4K to 2K/1K compressed WebP textures.

#### Issue: `Hydration failed` or `Window is not defined`
- **Symptom**: React console throws SSR hydration mismatch warnings.
- **Cause**: Accessing `window`, `navigator.mediaDevices`, or `localStorage` during initial component render before mount.
- **Solution**:
  - Wrap browser API calls inside `useEffect` or check `if (typeof window !== 'undefined')`.

---

## 2. Performance Optimization Tips ⚡

1. **Limit Shadow Maps**: Set `shadows={false}` on R3F `<Canvas>` for low-end mobile/laptop devices.
2. **Compress GLTF Models**: Run GLTF models through `gltf-pipeline` with Draco compression:
   ```bash
   npx gltf-pipeline -i character.gltf -o character.glb -d
   ```
3. **Throttle Motion Detection**: Keep motion detection frame-differencing rate at `5 FPS` max (running at 60 FPS is redundant and burns CPU cycles).

---

## 🔗 Related Documentation
- 📖 [Project Overview README](README.md)
- 🏗️ [Architecture Overview](ARCHITECTURE.md)
- ⚙️ [Developer Setup Guide](SETUP.md)
- 🔌 [API Specs](API.md)
