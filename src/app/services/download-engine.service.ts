import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DownloadEngineService {
  // Pure worker service handling raw parallel downloads.

  async saturateNetwork(
    url: string,
    concurrency: number,
    signal: AbortSignal,
    onProgress: (bytesRead: number) => void
  ): Promise<void> {

    const fetchTasks = Array.from({ length: concurrency }).map(async (_, index) => {
      let runCount = 0;
      while (!signal.aborted) {
        try {
          const bypassCacheUrl = `${url}&cb=${performance.now()}_${index}_${runCount++}`;
          const response = await fetch(bypassCacheUrl, {
            signal,
            cache: 'no-store'
          });

          if (!response.ok || !response.body) {
            throw new Error(`Network response was not ok for stream ${index}`);
          }

          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              onProgress(value.length);
            }
          }
        } catch (error: any) {
          if (error.name === 'AbortError' || signal.aborted) {
            break;
          }
          await new Promise(res => setTimeout(res, 500));
        }
      }
    });

    await Promise.all(fetchTasks);
  }
}
