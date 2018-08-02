import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FileDownloaderService {
  url: string = '';

  constructor(private http: HttpClient) { }
}
