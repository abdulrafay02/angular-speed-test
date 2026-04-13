import { Component, inject } from '@angular/core';
import { NetworkBenchmarkService } from './network-benchmark.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  benchmarkService = inject(NetworkBenchmarkService);

  get state() {
    return this.benchmarkService.state();
  }

  startDownload() {
    this.benchmarkService.startTest();
  }

  cancelDownload() {
    this.benchmarkService.cancel();
  }
}
