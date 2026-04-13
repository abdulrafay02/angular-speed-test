# Angular Speed Test ⚡

A high-fidelity, ultra-lightweight internet speed test tool built entirely with Angular.

**🔗 [Live Demo](https://abdulrafay02.github.io/angular-speed-test/)**

## Preview
![demo](https://github.com/user-attachments/assets/1992299a-c24b-4258-973b-16b2dea711f8)

Designed with brutalist geometry and precise visual mechanics, this app maps real-time network data streams directly to an immersive HUD without relying on bloated third-party graphical assets or heavy CSS frameworks.

## Features & Architecture

* **Parallel IO Orchestration:** Hits ultra-fast edge CDNs by orchestrating asynchronous chunked `fetch` payload streams, heavily saturating network capacity to uncover true download performance.
* **Real-Time Data Visualization:** Streams live network metrics into a custom SVG-based interface, providing immediate visual feedback with minimal rendering overhead.
* **Cinematic SVG Rendering:** Uses advanced SVG `feMerge` blur layers and viewport scaling to simulate neon/OLED-style light bleed.
* **Separation of Concerns:** Clean architecture with distinct layers for domain models, network logic (`DownloadEngineService`), and polling control (`NetworkBenchmarkService`). Promotes maintainability and testability.
* **Performance-First Design:** No heavy UI frameworks or graphical libraries, efficient change detection and rendering strategy.
* **Hyper-Optimized Footprint:** Ships a premium experience in a highly compressed bundle of approximately **~50kB**.

## Development Server

To inspect and launch the local environment:

```bash
npm install
npm run start
```
Navigate your browser to `http://localhost:4200/`. The application strictly relies on standard Angular CLI compilation algorithms and will hot-reload upon saving.

## Production Build

Outputs an optimized build to the `dist/` directory.

```bash
npm run build
```

## Usage

Click **"START"** to begin the test and monitor your network speed updating in real time.
