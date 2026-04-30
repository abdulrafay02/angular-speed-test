import { Injectable, inject, signal } from '@angular/core';
import { BenchmarkState } from './models/benchmark.model';
import { DownloadEngineService } from './services/download-engine.service';
import { AudioService } from './services/audio.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkBenchmarkService {
  private downloadEngine = inject(DownloadEngineService);
  private audioService = inject(AudioService);

  private readonly TEST_FILE_URL = 'https://speed.cloudflare.com/__down?bytes=16777216';
  private readonly CONCURRENCY = 4;
  private readonly TEST_DURATION_MS = 7000;

  readonly state = signal<BenchmarkState>({
    status: 'idle',
    progress: 0,
    currentSpeedMbps: 0,
    averageSpeedMbps: 0,
    downloadedMb: 0
  });

  private abortController: AbortController | null = null;
  private updateUiInterval: any;
  private testTimeout: any = null;

  cancel() {
    this.audioService.stopHum();
    if (this.testTimeout) {
      clearTimeout(this.testTimeout);
      this.testTimeout = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.updateUiInterval) {
      clearInterval(this.updateUiInterval);
      this.updateUiInterval = null;
    }
    this.state.update(s => ({ ...s, status: 'idle' }));
  }

  async startTest() {
    this.cancel();
    this.audioService.playBeep();
    this.audioService.startHum();
    this.abortController = new AbortController();

    this.state.set({
      status: 'running',
      progress: 0,
      currentSpeedMbps: 0,
      averageSpeedMbps: 0,
      downloadedMb: 0
    });

    let overallReceivedBytes = 0;
    const overallStartTime = performance.now();
    let lastReportTime = overallStartTime;
    let lastReportBytes = 0;

    // Separate UI interval tracking
    this.updateUiInterval = setInterval(() => {
      const now = performance.now();
      const chunkTimeSeconds = (now - lastReportTime) / 1000;
      const chunkBytes = overallReceivedBytes - lastReportBytes;
      const chunkMbps = (chunkBytes * 8) / (1024 * 1024) / (chunkTimeSeconds || 0.001);

      const totalTimeSeconds = (now - overallStartTime) / 1000;
      const avgMbps = (overallReceivedBytes * 8) / (1024 * 1024) / (totalTimeSeconds || 0.001);

      this.state.update(s => ({
        ...s,
        progress: Math.min(100, Math.round((totalTimeSeconds / (this.TEST_DURATION_MS / 1000)) * 100)),
        downloadedMb: overallReceivedBytes / (1024 * 1024),
        currentSpeedMbps: chunkMbps,
        averageSpeedMbps: avgMbps
      }));

      lastReportTime = now;
      lastReportBytes = overallReceivedBytes;

      if (totalTimeSeconds * 1000 >= this.TEST_DURATION_MS) {
        clearInterval(this.updateUiInterval);
      }
    }, 50);

    let isTimeUp = false;
    this.testTimeout = setTimeout(() => {
        isTimeUp = true;
        if (this.abortController) this.abortController.abort();
    }, this.TEST_DURATION_MS);

    try {
      // Delegate actual physical fetching completely to the Engine implementation
      await this.downloadEngine.saturateNetwork(
        this.TEST_FILE_URL,
        this.CONCURRENCY,
        this.abortController.signal,
        (bytesRead) => {
          overallReceivedBytes += bytesRead;
        }
      );

      // This code shouldn't naturally complete due to the infinite fetch loop, 
      // but if it does, handle it as success
      clearInterval(this.updateUiInterval);
      if (this.testTimeout) clearTimeout(this.testTimeout);

      if (isTimeUp) {
          // Success Path (Aborted by timeout)
          this.audioService.stopHum();
          this.audioService.playCompleteBeep();
          const totalTimeSeconds = (performance.now() - overallStartTime) / 1000;
          const finalMbps = (overallReceivedBytes * 8) / (1024 * 1024) / (totalTimeSeconds || 0.001);

          this.state.update(s => ({
            ...s,
            status: 'completed',
            progress: 100,
            currentSpeedMbps: finalMbps,
            averageSpeedMbps: finalMbps,
            downloadedMb: overallReceivedBytes / (1024 * 1024)
          }));
      } else {
          // User aborted manually
          this.audioService.stopHum();
      }
    } catch (error: any) {
      clearInterval(this.updateUiInterval);
      if (this.testTimeout) clearTimeout(this.testTimeout);

      console.error('Speed test failed:', error);
      this.audioService.stopHum();
      this.state.update(s => ({ ...s, status: 'error' }));
    }
  }
}
