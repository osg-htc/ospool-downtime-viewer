'use client'

import { useState } from "react"
import { Downtime, DowntimesRespose } from "./interfaces"

interface DowntimeTableRow {
    ResourceGroup: string
    CurrentDowntimes: Downtime[];
    FutureDowntimes: Downtime[]
    PastDowntimes: Downtime[];
}

interface DowntimeTableProps {
  downtimes: DowntimesRespose
}

function addRGToMapIfNotExists(rgMap: {[ce:string]: DowntimeTableRow}, rgName: string) {
    if(!rgMap[rgName]) {
        rgMap[rgName] = {
            ResourceGroup: rgName,
            CurrentDowntimes: [],
            FutureDowntimes: [],
            PastDowntimes: [],
        }
    }
}

function pivotDowntimes(donwtimes: DowntimesRespose): DowntimeTableRow[] {
    var rows: DowntimeTableRow[] = []
    var rgMap: {[ce:string]: DowntimeTableRow} = {}

    donwtimes.Downtimes?.CurrentDowntimes?.Downtime?.forEach(dt=>{
        const rg = dt.ResourceGroup.GroupName
        if(dt.Services.some(s=>s.Name == "CE")) {
            addRGToMapIfNotExists(rgMap, rg)
            rgMap[rg].CurrentDowntimes.push(dt)
        }
    })

    donwtimes.Downtimes?.PastDowntimes?.Downtime?.forEach(dt=>{
        const rg = dt.ResourceGroup.GroupName
        if(dt.Services.some(s=>s.Name == "CE")) {
            addRGToMapIfNotExists(rgMap, rg)
            rgMap[rg].PastDowntimes.push(dt)
        }
    })

    donwtimes.Downtimes?.FutureDowntimes?.Downtime?.forEach(dt=>{
        const rg = dt.ResourceGroup.GroupName
        if(dt.Services.some(s=>s.Name == "CE")) {
            addRGToMapIfNotExists(rgMap, rg)
            rgMap[rg].FutureDowntimes.push(dt)
        }
    })

    return rows
}

export default function DowntimeTable(props: DowntimeTableProps) {
  return (
    <table className="table-auto">  
     <thead>    
      <tr>   
       <th>Site</th>   
       <th>Past Downtimes</th>   
       <th>Current Downtimes</th>    
       <th>Upcoming Downtimes</th>    
      </tr>  
     </thead>  
     <tbody>    
     <tr>   
      <td>The Sliding Mr. Bones (Next Stop, Pottersville)</td>   
      <td>Malcolm Lockyer</td>   
      <td>1961</td>    
     </tr>    
     <tr>   
      <td>Witchy Woman</td>   
      <td>The Eagles</td>   
      <td>1972</td>    
     </tr>    
     <tr>   
      <td>Shining Star</td>   
      <td>Earth, Wind, and Fire</td>   
      <td>1975</td>    
     </tr>  
     </tbody>
    </table>
    )
}
