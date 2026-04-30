# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2026-04-30

### Added
- **Cinematic Audio Engine**: Integrated the Web Audio API to simulate a heavy, turbocharged inline-6 engine (RB26 Skyline) that physically syncs with the benchmark progress.
- **Dynamic Gear Shifting**: Engine audio automatically shifts gears based on benchmark duration, complete with an aggressive white-noise compressor surge ("stutututu") during RPM drops.
- **Time-Based Benchmarking**: Overhauled the core network test to use a fixed duration (7.0 seconds) instead of a fixed payload size, guaranteeing perfect audio synchronization and UX consistency across all internet speeds.

### Changed
- `DownloadEngineService` now uses infinite fetch streams to guarantee 100% network saturation for the full duration of the test.

## [2.0.0] - 2026-04-13

### Added
- Dynamic edge-based network benchmarking using chunked `fetch` streams against CDN endpoints.
- SVG-based HUD visualization using native filter effects (`feMerge`, blur) for lightweight real-time rendering.
- Separation of concerns between domain models and services (`DownloadEngineService`, `NetworkBenchmarkService`).
- Improved project configuration and cleanup of environment and IDE artifacts.

### Changed
- Replaced static local file-based benchmarking with CDN-driven streaming to improve measurement consistency across environments.
- Refactored HUD layout for improved alignment and responsiveness without external UI frameworks.
- Updated project structure and build configuration to align with Angular best practices.
- Improved test coverage with service-level mocking of network pipelines.

### Removed
- Removed large static `.dat` payload used in earlier benchmarking approach.
- Removed unused font assets and legacy CSS dependencies to reduce bundle size (~50kB target).
- Removed outdated boilerplate layout tests.