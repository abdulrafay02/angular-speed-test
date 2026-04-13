import { Injectable, inject, signal } from '@angular/core';
import { BenchmarkState } from './models/benchmark.model';
import { DownloadEngineService } from './services/download-engine.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkBenchmarkService {
  private downloadEngine = inject(DownloadEngineService);

  private readonly TEST_FILE_URL = 'https://speed.cloudflare.com/__down?bytes=16777216';
  private readonly CONCURRENCY = 4;
  private readonly TOTAL_TARGET_BYTES = 16777216 * 4;

  readonly state = signal<BenchmarkState>({
    status: 'idle',
    progress: 0,
    currentSpeedMbps: 0,
    averageSpeedMbps: 0,
    downloadedMb: 0
  });

  private abortController: AbortController | null = null;
  private updateUiInterval: any;

  cancel() {
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
        progress: Math.min(100, Math.round((overallReceivedBytes / this.TOTAL_TARGET_BYTES) * 100)),
        downloadedMb: overallReceivedBytes / (1024 * 1024),
        currentSpeedMbps: chunkMbps,
        averageSpeedMbps: avgMbps
      }));

      lastReportTime = now;
      lastReportBytes = overallReceivedBytes;

      if (overallReceivedBytes >= this.TOTAL_TARGET_BYTES) {
        clearInterval(this.updateUiInterval);
      }
    }, 50);

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

      clearInterval(this.updateUiInterval);
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

    } catch (error: any) {
      clearInterval(this.updateUiInterval);
      if (error.name === 'AbortError') {
        console.log('Test aborted');
      } else {
        console.error('Speed test failed:', error);
        this.state.update(s => ({ ...s, status: 'error' }));
      }
    }
  }
}
