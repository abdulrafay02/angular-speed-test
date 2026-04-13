export interface BenchmarkState {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  currentSpeedMbps: number;
  averageSpeedMbps: number;
  downloadedMb: number;
}
