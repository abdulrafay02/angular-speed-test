import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { NetworkBenchmarkService } from './network-benchmark.service';
import { signal } from '@angular/core';

class MockNetworkBenchmarkService {
  state = signal({
    status: 'idle',
    progress: 0,
    currentSpeedMbps: 0,
    averageSpeedMbps: 0,
    downloadedMb: 0
  });

  isStartFired = false;
  isCancelFired = false;

  startTest() {
    this.isStartFired = true;
  }
  cancel() {
    this.isCancelFired = true;
  }
}

describe('App', () => {
  let mockBenchmarkService: MockNetworkBenchmarkService;

  beforeEach(async () => {
    mockBenchmarkService = new MockNetworkBenchmarkService();

    await TestBed.configureTestingModule({
      declarations: [App],
      providers: [
        { provide: NetworkBenchmarkService, useValue: mockBenchmarkService }
      ]
    }).compileComponents();
  });

  it('should explicitly instantiate the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should bind the internal state payload strictly to the Service Signal state', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Validate state reflects the mapped idle state structurally 
    expect(app.state.status).toBe('idle');
    expect(app.state.progress).toBe(0);
  });

  it('should trigger the hardware measurement stream when startDownload is fired', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.startDownload();

    expect(mockBenchmarkService.isStartFired).toBe(true);
  });

  it('should securely abort active pipeline streams via cancelDownload', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.cancelDownload();

    expect(mockBenchmarkService.isCancelFired).toBe(true);
  });
});
