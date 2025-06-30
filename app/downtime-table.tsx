'use client'

import React, { useState } from "react"
import { Downtime, DowntimesRespose, ParsedDowntime, ResourceGroup, ResourceGroupsResponse } from "./interfaces"
import { DateTime } from "luxon";

interface DowntimeTableRow {
  ResourceGroup: string
  CurrentDowntimes: ParsedDowntime[];
  FutureDowntimes: ParsedDowntime[]
  PastDowntimes: ParsedDowntime[];
}

interface DowntimeTableProps {
  downtimes: DowntimesRespose
  resourceGroups: ResourceGroupsResponse
}

function addRGToMapIfNotExists(rgMap: { [ce: string]: DowntimeTableRow }, rgName: string) {
  if (!rgMap[rgName]) {
    rgMap[rgName] = {
      ResourceGroup: rgName,
      CurrentDowntimes: [],
      FutureDowntimes: [],
      PastDowntimes: [],
    }
  }
}

function getSiteForResourceGroup(rgName: string, resourceGroups: ResourceGroupsResponse) {
  return resourceGroups.ResourceSummary.ResourceGroup.find(rg=> rg.GroupName == rgName)?.Site.Name ?? rgName
}

function parseDates(downtime: Downtime): ParsedDowntime {
  const dateFmt = "MMM dd, yyyy t z"
  return {
    ...downtime,
    StartDate: DateTime.fromFormat(downtime.StartTime, dateFmt),
    EndDate: DateTime.fromFormat(downtime.EndTime, dateFmt),
  }

}

function pivotDowntimes(downtimes: DowntimesRespose, resourceGroups: ResourceGroupsResponse): DowntimeTableRow[] {
  var rgMap: { [ce: string]: DowntimeTableRow } = {}

  downtimes.Downtimes?.CurrentDowntimes?.Downtime?.forEach(dt => {
    const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
    if (dt.Services.Service.Name == "CE") {
      addRGToMapIfNotExists(rgMap, siteName)
      rgMap[siteName].CurrentDowntimes.push(parseDates(dt))
    }
  })

  downtimes.Downtimes?.PastDowntimes?.Downtime?.forEach(dt => {
    const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
    if (dt.Services.Service.Name /*== "CE"*/) {
      addRGToMapIfNotExists(rgMap, siteName)
      rgMap[siteName].PastDowntimes.push(parseDates(dt))
    }
  })

  downtimes.Downtimes?.FutureDowntimes?.Downtime?.forEach(dt => {
    const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
    if (dt.Services.Service.Name /*== "CE"*/) {
      addRGToMapIfNotExists(rgMap, siteName)
      rgMap[siteName].FutureDowntimes.push(parseDates(dt))
    }
  })

  return Object.values(rgMap)
}

function DTHeader({children, rowspan = 1, colspan = 1}: {children: any, rowspan?: number, colspan?: number}) {
  return <th rowSpan={rowspan} colSpan={colspan} className="w-1/2 border border-gray-300 p-4 text-left font-semibold text-gray-900 dark:border-gray-600 dark:text-gray-200">{children}</th>
}

function DTCell({children}: {children: any}) {
  return <td className="border border-gray-300 p-4 text-gray-500 dark:border-gray-700 dark:text-gray-400 align-top">{children}</td>
}

function FormatDateRange(start: DateTime, end: DateTime): string {
  var startStr = start.toFormat('yyyy-MM-dd')
  var endStr = end.toFormat('yyyy-MM-dd')
  return startStr == endStr ? startStr : `${startStr} - ${endStr}`
}

function DTResourceList({downtimes}: {downtimes: ParsedDowntime[]}) {
 var [showMore, setShowMore] = useState(false)
 var maxDtCount = showMore ? 999 : 5

 return (
  <React.Fragment>
    <DTCell>
      {downtimes.slice(0, maxDtCount).map(dt=>(
        <span className="text-nowrap" key={dt.ResourceName + " " + dt.StartTime}>{dt.ResourceName}<br/></span>
      ))}
      {(downtimes.length > maxDtCount) && 
        <span className="cursor-pointer text-indigo-600 dark:text-indigo-400 text-nowrap"
          onClick={()=>setShowMore(true)}>+ {downtimes.length - maxDtCount} more</span>}

      {showMore && <span className="cursor-pointer text-indigo-600 dark:text-indigo-400"
        onClick={()=>setShowMore(false)}> show less</span>}
    </DTCell>
    <DTCell>
      {downtimes.slice(0, maxDtCount).map(dt=>(
        <span className="text-nowrap" key={dt.ResourceName + " " + dt.StartTime}>{dt.StartDate.toFormat('yyyy-MM-dd')}<br/></span>
      ))}
    </DTCell>
    <DTCell>
      {downtimes.slice(0, maxDtCount).map(dt=>(
        <span className="text-nowrap" key={dt.ResourceName + " " + dt.StartTime}>{dt.EndDate.toFormat('yyyy-MM-dd')}<br/></span>
      ))}
    </DTCell>
  </React.Fragment>
 )
}

export default function DowntimeTable({ downtimes, resourceGroups }: DowntimeTableProps) {
  var downtimeRows = pivotDowntimes(downtimes, resourceGroups)
  console.log(downtimeRows)
  return (
    <table className="table-auto w-full border-collapse border border-gray-400 bg-white text-sm dark:border-gray-500 dark:bg-gray-800">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <DTHeader rowspan={2} colspan={1}>Site</DTHeader>
          <DTHeader colspan={3}>Past Downtimes</DTHeader>
          <DTHeader colspan={3}>Current Downtimes</DTHeader>
          <DTHeader colspan={3}>Upcoming Downtimes</DTHeader>
        </tr>
        <tr>
          <DTHeader>Resource</DTHeader>
          <DTHeader>Start</DTHeader>
          <DTHeader>End</DTHeader>
          
          <DTHeader>Resource</DTHeader>
          <DTHeader>Start</DTHeader>
          <DTHeader>End</DTHeader>
          
          <DTHeader>Resource</DTHeader>
          <DTHeader>Start</DTHeader>
          <DTHeader>End</DTHeader>
        </tr>
      </thead>
      <tbody>
        {downtimeRows.map(dt=>
        <tr key={dt.ResourceGroup} className="border border-gray-400">
          <DTCell>{dt.ResourceGroup}</DTCell>
          <DTResourceList downtimes={dt.PastDowntimes}/>
          <DTResourceList downtimes={dt.CurrentDowntimes}/>
          <DTResourceList downtimes={dt.FutureDowntimes}/>
        </tr>)}
      </tbody>
    </table>
  )
}
