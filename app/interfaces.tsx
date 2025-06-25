// Interfaces for the XML-To-JSON conversion output from the Topology API
export interface Service {
    ID: number;
    Description: string;
    Name: string;
}

export interface ResourceGroup {
    GroupName: string;
    GroupID: number;
}

export interface Downtime {
  Class: string;
  Description: string;
  ResourceFQDN: string;
  StartTime: string;
  EndTime: string;
  Severity: string;
  Services: Service[];
  ResourceGroup: ResourceGroup;
}

export interface DowntimeList {
    Downtime: Downtime[];
}

export interface DowntimesRespose {
    Downtimes: {
        CurrentDowntimes: DowntimeList;
        FutureDowntimes: DowntimeList;
        PastDowntimes: DowntimeList;
    }
}
