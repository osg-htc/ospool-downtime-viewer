import { DateTime } from "luxon";
// Interfaces for the XML-To-JSON conversion output from the Topology Downtimes API
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
  ResourceName: string;
  Description: string;
  ResourceFQDN: string;
  StartTime: string;
  EndTime: string;
  Severity: string;
  Services: {Service: Service};
  ResourceGroup: ResourceGroup;
}

export interface DowntimeOrDowntimeList {
    Downtime: Downtime | Downtime[];
}

export interface DowntimesRespose {
    Downtimes: {
        CurrentDowntimes: DowntimeOrDowntimeList;
        FutureDowntimes: DowntimeOrDowntimeList;
        PastDowntimes: DowntimeOrDowntimeList;
    }
}

// interface for Downtime with parsed start/end time
export interface ParsedDowntime extends Downtime {
    StartDate: DateTime
    EndDate: DateTime
}

// Interfaces for the XML-To-JSON conversion output from the Topology Resource Groups API

export interface Site {
    Name: string;
}
export interface ResourceGroup {
    GridType: string;
    GroupName: string;
    Site: Site;
}

export interface ResourceGroupsResponse {
    ResourceSummary: {
        ResourceGroup: ResourceGroup[]
    }
}
