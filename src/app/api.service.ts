import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

let httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})

export class ApiService {

  apiURL: string = 'http://megachat.info:3000';

  constructor(private httpClient: HttpClient) {}

  public createData(dataObj: any) {
    return this.httpClient.post(`${this.apiURL}/${dataObj.url}`, dataObj, httpOptions);
  }

  public updateData(dataObj: any) {
    return this.httpClient.put(`${this.apiURL}/${dataObj.url}`, dataObj, httpOptions);
  }

  public deleteData(dataObj: any) {
    return this.httpClient.delete(`${this.apiURL}/${dataObj.url}?id=${dataObj.id}`, httpOptions);
  }

  public getDataById(dataObj: any) {
    return this.httpClient.get(`${this.apiURL}/${dataObj.url}?id=${dataObj.id}`, httpOptions);
  }

  public getAllData(dataObj: any) {
    return this.httpClient.get<any>(`${this.apiURL}/` + dataObj.url, httpOptions);
  }

  public loginCheck(dataObj: any) {
    return this.httpClient.post(`${this.apiURL}/${dataObj.url}`, dataObj);
  }

  public registerUser(dataObj: any) {
    return this.httpClient.post(`${this.apiURL}/${dataObj.url}`, dataObj);
  }

  public setRequestHeader(token: any) {
    httpOptions.headers['X-Auth-Token'] = token;
  }

  public findContactByAll(dataObj: any) {
    return this.httpClient.get(`${this.apiURL}/${dataObj.url}`, httpOptions);
  }

  public processRequestData(dataObj: any) {
    return this.httpClient.put(`${this.apiURL}/${dataObj.url}`, dataObj, httpOptions);
  }

  public uploadFilesToMessage(formData: any) {
    let httpheader = {
      headers: new HttpHeaders({
        'Content-Type':  'multipart/form-data'
      })
    };
    return this.httpClient.post(`${this.apiURL}/messages/uploadfiles`, formData);
  }
}
