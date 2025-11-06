import { OpenAIRealtimeWebRTC } from '@openai/agents/realtime';

// Debug transport that logs the POST /v1/realtime response status and body when negotiation fails.
export class DebugRealtimeWebRTC extends OpenAIRealtimeWebRTC {
  async connect(options: any) {
    const start = performance.now();
    try {
      await super.connect(options);
      const dur = (performance.now() - start).toFixed(0);
      console.log(`[Realtime][DEBUG] Connected successfully in ${dur}ms`);
    } catch (err: any) {
      const msg = String(err?.message || err);
      console.error('[Realtime][DEBUG] Connect error:', msg);
      // We can't directly intercept internal fetch; advise user to check /api/session body already surfaced.
      console.error('[Realtime][DEBUG] If this persists, capture Network POST https://api.openai.com/v1/realtime full response body.');
      throw err;
    }
  }
}
