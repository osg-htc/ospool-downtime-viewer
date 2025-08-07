'use client'

import React, { useEffect, useState } from "react"
import { Downtime, DowntimeOrDowntimeList, DowntimesRespose, ParsedDowntime, ResourceGroup, ResourceGroupsResponse } from "./interfaces"
import { DateTime } from "luxon";
import { FaSortUp, FaSortDown, FaSort } from "react-icons/fa";
import { XMLParser } from "fast-xml-parser";

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

function downtimeOrListToDowntimeList(dt: DowntimeOrDowntimeList) : Downtime[] {
  // XML response returned by topology may be a single downtime object or a list,
  // normalize to a list
  if (Array.isArray(dt.Downtime)) {
    return dt.Downtime
  } else {
    return [dt.Downtime]
  }
}

function pivotDowntimes(downtimes: DowntimesRespose, resourceGroups: ResourceGroupsResponse): DowntimeTableRow[] {
  var rgMap: { [ce: string]: DowntimeTableRow } = {}
  const OspoolServiceIds = [1, 157] // 1 for CE, 157 for EP

  downtimeOrListToDowntimeList(downtimes.Downtimes?.CurrentDowntimes)
    ?.filter(dt=> OspoolServiceIds.includes(dt.Services.Service.ID))
    .forEach(dt => {
      const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
      addRGToMapIfNotExists(rgMap, siteName).CurrentDowntimes.push(parseDates(dt))
  })

  downtimeOrListToDowntimeList(downtimes.Downtimes?.PastDowntimes)
    ?.filter(dt=> OspoolServiceIds.includes(dt.Services.Service.ID))
    .forEach(dt => {
      const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
      addRGToMapIfNotExists(rgMap, siteName).PastDowntimes.push(parseDates(dt))
  })

  downtimeOrListToDowntimeList(downtimes.Downtimes?.FutureDowntimes)
    ?.filter(dt=> OspoolServiceIds.includes(dt.Services.Service.ID))
    .forEach(dt => {
      const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
      addRGToMapIfNotExists(rgMap, siteName).FutureDowntimes.push(parseDates(dt))
  })

  return Object.values(rgMap)
}

function DTHeader({children,  className, rowspan = 1, colspan = 1}: {children: any, className?: string, rowspan?: number, colspan?: number}) {
  return <th rowSpan={rowspan} colSpan={colspan} className={`w-1/2 border border-gray-300 p-1 text-left text-xs font-semibold text-gray-900 dark:border-gray-600 dark:text-gray-200 ${className}`}>{children}</th>
}

function DTCell({className, children}: {className?: string, children: any}) {
  return <td className={`border border-gray-300 p-1 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400 align-top ${className}`}>{children}</td>
}

function DTResourceList({className, downtimes}: {className?: string, downtimes: ParsedDowntime[]}) {
 const [showMore, setShowMore] = useState(false)
 const maxDtCount = showMore ? 999 : 5

 return (
  <React.Fragment>
    <DTCell className={className}>
      {downtimes.slice(0, maxDtCount).map(dt=>(
        <span className="text-nowrap" key={dt.ResourceName + " " + dt.StartTime}>{dt.ResourceName}<br/></span>
      ))}
      {(downtimes.length > maxDtCount) && 
        <span className="cursor-pointer text-indigo-600 dark:text-indigo-400 text-nowrap"
          onClick={()=>setShowMore(true)}>+ {downtimes.length - maxDtCount} more</span>}

      {showMore && <span className="cursor-pointer text-indigo-600 dark:text-indigo-400"
        onClick={()=>setShowMore(false)}> show less</span>}
    </DTCell>
    <DTCell className={className}>
      {downtimes.slice(0, maxDtCount).map(dt=>(
        <span className="text-nowrap" key={dt.ResourceName + " " + dt.StartTime}>{dt.StartDate.toFormat('yyyy-MM-dd')}<br/></span>
      ))}
    </DTCell>
    <DTCell className={className}>
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

async function fetchDowntimeData() {
  const res = await fetch('/api/downtimes')
  const data = (await res.json()) as DowntimesRespose

  const siteRes = await fetch('/api/resource-groups')
  const siteData = (await siteRes.json()) as ResourceGroupsResponse

  return {
    downtimes: data,
    resourceGroups: siteData,
  }
}

export default function DowntimeTable({ downtimes, resourceGroups }: DowntimeTableProps) {

  const [downtimeData, setDowntimeData] = useState(downtimes)
  const [rgData, setRGData] = useState(resourceGroups)

  useEffect(() => {
    fetchDowntimeData().then(({downtimes, resourceGroups})=>{
      setDowntimeData(downtimes)
      setRGData(resourceGroups)
    })
  }, [])


  const downtimeRows = pivotDowntimes(downtimeData, rgData)

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
        className="shadow appearance-none border rounded max-w-90 w-full py-2 px-3 my-4 border-gray-300 text-gray-700 leading-tight text-sm focus:outline-none focus:shadow-outline dark:border-gray-700 dark:text-gray-400 dark:bg-gray-800" 
        type="text" 
        placeholder="Site Name" 
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />

      <table className="table-auto w-full border-collapse border border-gray-400 bg-white text-sm dark:border-gray-500 dark:bg-gray-800">
        <thead className="bg-blue-100 dark:bg-gray-700">
          <tr>
            <DTHeader className="bg-blue-100 dark:bg-gray-700" rowspan={2} colspan={1}>
              <div className="flex content-center cursor-pointer" onClick={()=>setSort({SiteName: !sort.SiteName})}><span>Site </span><SortIcon isSorted={sort.SiteName}/></div>
            </DTHeader>
            <DTHeader className="bg-teal-100 dark:bg-gray-700" colspan={3}>
              <div className="flex content-center cursor-pointer" onClick={()=>setSort({PastDowntimes: !sort.PastDowntimes})}><span>Past Downtimes </span><SortIcon isSorted={sort.PastDowntimes}/></div>
            </DTHeader>
            <DTHeader colspan={3}>
              <div className="flex content-center cursor-pointer" onClick={()=>setSort({CurrentDowntimes: !sort.CurrentDowntimes})}><span>Current Downtimes </span><SortIcon isSorted={sort.CurrentDowntimes}/></div>
            </DTHeader>
            <DTHeader className="bg-teal-100 dark:bg-gray-700" colspan={3}>
              <div className="flex content-center cursor-pointer" onClick={()=>setSort({FutureDowntimes: !sort.FutureDowntimes})}><span>Upcoming Downtimes </span><SortIcon isSorted={sort.FutureDowntimes}/></div>
            </DTHeader>
          </tr>
          <tr>
            <DTHeader className="bg-teal-100 dark:bg-gray-700">Resource</DTHeader>
            <DTHeader className="bg-teal-100 dark:bg-gray-700">Start</DTHeader>
            <DTHeader className="bg-teal-100 dark:bg-gray-700">End</DTHeader>

            <DTHeader>Resource</DTHeader>
            <DTHeader>Start</DTHeader>
            <DTHeader>End</DTHeader>

            <DTHeader className="bg-teal-100 dark:bg-gray-700">Resource</DTHeader>
            <DTHeader className="bg-teal-100 dark:bg-gray-700">Start</DTHeader>
            <DTHeader className="bg-teal-100 dark:bg-gray-700">End</DTHeader>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map(dt=>
          <tr key={dt.SiteName} className="border border-gray-400">
            <DTCell className="bg-gray-100 dark:bg-gray-800">{dt.SiteName}</DTCell>
            <DTResourceList className="bg-teal-50 dark:bg-gray-800" downtimes={dt.PastDowntimes}/>
            <DTResourceList className="bg-blue-50 dark:bg-gray-800" downtimes={dt.CurrentDowntimes}/>
            <DTResourceList className="bg-teal-50 dark:bg-gray-800" downtimes={dt.FutureDowntimes}/>
          </tr>)}
        </tbody>
      </table>
    </div>
  )
}
