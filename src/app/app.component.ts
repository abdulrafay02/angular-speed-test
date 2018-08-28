import { Component } from "@angular/core";
import { HttpClient, HttpEventType, HttpResponse } from "@angular/common/http";
import { FileDownloaderService } from "./file-downloader.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  title = "app";
  constructor(
    private http: HttpClient,
    private downloader: FileDownloaderService
  ) {}

  percentDone: number;
  startTime: any;
  endTime: any;
  currTime: any;
  prevTime: any;
  speed: number = 0;
  bytesReceied: number = 0;
  oldbytes: number = 0;
  unit: string = "Mbps";

  download() {
    this.downloader.download().subscribe(event => {
      if (event.type === HttpEventType.DownloadProgress) {
        this.percentDone = Math.round((100 * event.loaded) / event.total);
        console.log(`File is ${this.percentDone}% downloaded.`);

        this.currTime = new Date().getTime();
        if (this.percentDone === 0) {
          this.startTime = new Date().getTime();
          this.prevTime = this.startTime;
        }

        this.bytesReceied = event.loaded / 1000000;
        console.log("bytesReceied", this.bytesReceied);
        this.speed =
          (this.bytesReceied - this.oldbytes) /
          ((this.currTime - this.prevTime) / 1000);
        if (this.speed < 1) {
          this.unit = "Kbps";
          this.speed *= 1000;
        } else this.unit = "Mbps";
        console.log("speed", this.speed + this.unit);
        console.log(this.prevTime);
        console.log(this.currTime);
        console.log("time", this.currTime - this.prevTime);
        this.prevTime = this.currTime;

        this.oldbytes = this.bytesReceied;
        console.log("oldbytes", this.oldbytes);
        console.log("\n");

        if (this.percentDone === 100) {
          this.endTime = new Date().getTime();
          let duration = (this.endTime - this.startTime) / 1000;
          let mbps = event.total / duration / 1000000;
          if (mbps < 1) {
            this.speed = event.total / duration / 1000;
            this.unit = "Kbps";
          } else {
            this.speed = mbps;
            this.unit = "Mbps";
          }
        }
      } else if (event instanceof HttpResponse) {
        var res: any = event.body;
        //console.log('start download:', res);
        var url = window.URL.createObjectURL(res);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.setAttribute("style", "display: none");
        a.href = url;
        a.download = "SpeedTest_32MB.dat";
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        console.log("File is completely downloaded!");
      }
    });
  }
}
