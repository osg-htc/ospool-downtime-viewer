'use client'

import React, { useState } from "react"
import { Downtime, DowntimesRespose, ParsedDowntime, ResourceGroup, ResourceGroupsResponse } from "./interfaces"
import { DateTime } from "luxon";
import { FaSortUp, FaSortDown, FaSort } from "react-icons/fa";

interface DowntimeTableRow {
  SiteName: string
  CurrentDowntimes: ParsedDowntime[];
  FutureDowntimes: ParsedDowntime[]
  PastDowntimes: ParsedDowntime[];
}

interface DowntimeTableSortOrder {
  SiteName?: boolean
  CurrentDowntimes?: boolean
  FutureDowntimes?: boolean
  PastDowntimes?: boolean
}
interface DowntimeTableProps {
  downtimes: DowntimesRespose
  resourceGroups: ResourceGroupsResponse
}

function addRGToMapIfNotExists(rgMap: { [ce: string]: DowntimeTableRow }, rgName: string) {
  if (!rgMap[rgName]) {
    rgMap[rgName] = {
      SiteName: rgName,
      CurrentDowntimes: [],
      FutureDowntimes: [],
      PastDowntimes: [],
    }
  }
  return rgMap[rgName]
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
  const OspoolServiceIds = [1, 157] // 1 for CE, 157 for EP

  downtimes.Downtimes?.CurrentDowntimes?.Downtime
    ?.filter(dt=> OspoolServiceIds.includes(dt.Services.Service.ID))
    .forEach(dt => {
      const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
      addRGToMapIfNotExists(rgMap, siteName).CurrentDowntimes.push(parseDates(dt))
  })

  downtimes.Downtimes?.PastDowntimes?.Downtime
    ?.filter(dt=> OspoolServiceIds.includes(dt.Services.Service.ID))
    .forEach(dt => {
      const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
      addRGToMapIfNotExists(rgMap, siteName).PastDowntimes.push(parseDates(dt))
  })

  downtimes.Downtimes?.FutureDowntimes?.Downtime
    ?.filter(dt=> OspoolServiceIds.includes(dt.Services.Service.ID))
    .forEach(dt => {
      const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
      addRGToMapIfNotExists(rgMap, siteName).FutureDowntimes.push(parseDates(dt))
  })

  return Object.values(rgMap)
}

function DTHeader({children, rowspan = 1, colspan = 1}: {children: any, rowspan?: number, colspan?: number}) {
  return <th rowSpan={rowspan} colSpan={colspan} className="w-1/2 border border-gray-300 p-4 text-left font-semibold text-gray-900 dark:border-gray-600 dark:text-gray-200">{children}</th>
}

function DTCell({children}: {children: any}) {
  return <td className="border border-gray-300 p-4 text-gray-500 dark:border-gray-700 dark:text-gray-400 align-top">{children}</td>
}

function DTResourceList({downtimes}: {downtimes: ParsedDowntime[]}) {
 const [showMore, setShowMore] = useState(false)
 const maxDtCount = showMore ? 999 : 5

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

function SortIcon({isSorted}: {isSorted?: boolean}) {
  return (
    isSorted === true ? <FaSortDown className="self-center"/> : isSorted === false ? <FaSortUp className="self-center"/> : <FaSort className="self-center"/>
  )
}

export default function DowntimeTable({ downtimes, resourceGroups }: DowntimeTableProps) {
  const downtimeRows = pivotDowntimes(downtimes, resourceGroups)

  const [sort, setSort] = useState<DowntimeTableSortOrder>({SiteName: true})
  const [filter, setFilter] = useState("")

  // Default to an alpha sort in case all other flags are unset
  var sortedRows : DowntimeTableRow[] = downtimeRows
    .filter(dt=>dt.SiteName.toLocaleLowerCase().includes(filter.toLocaleLowerCase())) 
    .toSorted((dta, dtb) => dta.SiteName.localeCompare(dtb.SiteName))
  if(sort.SiteName !== undefined) {
    sortedRows.sort((dta, dtb) => (sort.SiteName ? 1 : -1) * dta.SiteName.localeCompare(dtb.SiteName))
  } else if (sort.PastDowntimes !== undefined) {
    sortedRows.sort((dta, dtb) => (sort.PastDowntimes ? 1 : -1) * (dta.PastDowntimes.length - dtb.PastDowntimes.length))
  } else if (sort.CurrentDowntimes !== undefined) {
    sortedRows.sort((dta, dtb) => (sort.CurrentDowntimes ? 1 : -1) * (dta.CurrentDowntimes.length - dtb.CurrentDowntimes.length))
  } else if (sort.FutureDowntimes !== undefined) {
    sortedRows.sort((dta, dtb) => (sort.FutureDowntimes ? 1 : -1) * (dta.FutureDowntimes.length - dtb.FutureDowntimes.length))
  }
  
  return (
    <div className="w-full">
      <input 
        className="shadow appearance-none border rounded max-w-90 w-full py-2 px-3 my-4 border-gray-300 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:border-gray-700 dark:text-gray-400 dark:bg-gray-800" 
        type="text" 
        placeholder="Site Name" 
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />

      <table className="table-auto w-full border-collapse border border-gray-400 bg-white text-sm dark:border-gray-500 dark:bg-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <DTHeader rowspan={2} colspan={1}>
              <div className="flex content-center cursor-pointer" onClick={()=>setSort({SiteName: !sort.SiteName})}><span>Site </span><SortIcon isSorted={sort.SiteName}/></div>
            </DTHeader>
            <DTHeader colspan={3}>
              <div className="flex content-center cursor-pointer" onClick={()=>setSort({PastDowntimes: !sort.PastDowntimes})}><span>Past Downtimes </span><SortIcon isSorted={sort.PastDowntimes}/></div>
            </DTHeader>
            <DTHeader colspan={3}>
              <div className="flex content-center cursor-pointer" onClick={()=>setSort({CurrentDowntimes: !sort.CurrentDowntimes})}><span>Current Downtimes </span><SortIcon isSorted={sort.CurrentDowntimes}/></div>
            </DTHeader>
            <DTHeader colspan={3}>
              <div className="flex content-center cursor-pointer" onClick={()=>setSort({FutureDowntimes: !sort.FutureDowntimes})}><span>Upcoming Downtimes </span><SortIcon isSorted={sort.FutureDowntimes}/></div>
            </DTHeader>
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
          {sortedRows.map(dt=>
          <tr key={dt.SiteName} className="border border-gray-400">
            <DTCell>{dt.SiteName}</DTCell>
            <DTResourceList downtimes={dt.PastDowntimes}/>
            <DTResourceList downtimes={dt.CurrentDowntimes}/>
            <DTResourceList downtimes={dt.FutureDowntimes}/>
          </tr>)}
        </tbody>
      </table>
    </div>
  )
}
