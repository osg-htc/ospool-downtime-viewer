'use client'

import { useState } from "react"
import { Downtime, DowntimesRespose, ResourceGroup, ResourceGroupsResponse } from "./interfaces"

interface DowntimeTableRow {
  ResourceGroup: string
  CurrentDowntimes: Downtime[];
  FutureDowntimes: Downtime[]
  PastDowntimes: Downtime[];
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

function pivotDowntimes(downtimes: DowntimesRespose, resourceGroups: ResourceGroupsResponse): DowntimeTableRow[] {
  var rgMap: { [ce: string]: DowntimeTableRow } = {}

  downtimes.Downtimes?.CurrentDowntimes?.Downtime?.forEach(dt => {
    const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
    if (dt.Services.Service.Name == "CE") {
      addRGToMapIfNotExists(rgMap, siteName)
      rgMap[siteName].CurrentDowntimes.push(dt)
    }
  })

  downtimes.Downtimes?.PastDowntimes?.Downtime?.forEach(dt => {
    const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
    if (dt.Services.Service.Name == "CE") {
      addRGToMapIfNotExists(rgMap, siteName)
      rgMap[siteName].PastDowntimes.push(dt)
    }
  })

  downtimes.Downtimes?.FutureDowntimes?.Downtime?.forEach(dt => {
    const siteName = getSiteForResourceGroup(dt.ResourceGroup.GroupName, resourceGroups)
    if (dt.Services.Service.Name == "CE") {
      addRGToMapIfNotExists(rgMap, siteName)
      rgMap[siteName].FutureDowntimes.push(dt)
    }
  })

  return Object.values(rgMap)
}

export default function DowntimeTable({ downtimes, resourceGroups }: DowntimeTableProps) {
  var downtimeRows = pivotDowntimes(downtimes, resourceGroups)
  console.log(downtimeRows)
  return (
    <table className="w-full border-collapse border border-gray-400 bg-white text-sm dark:border-gray-500 dark:bg-gray-800">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th className="w-1/2 border border-gray-300 p-4 text-left font-semibold text-gray-900 dark:border-gray-600 dark:text-gray-200">Site</th>
          <th className="w-1/2 border border-gray-300 p-4 text-left font-semibold text-gray-900 dark:border-gray-600 dark:text-gray-200">Past Downtimes</th>
          <th className="w-1/2 border border-gray-300 p-4 text-left font-semibold text-gray-900 dark:border-gray-600 dark:text-gray-200">Current Downtimes</th>
          <th className="w-1/2 border border-gray-300 p-4 text-left font-semibold text-gray-900 dark:border-gray-600 dark:text-gray-200">Upcoming Downtimes</th>
        </tr>
      </thead>
      <tbody>
        {downtimeRows.map(dt=>
        <tr key={dt.ResourceGroup} className="border border-gray-400">
          <td className="border border-gray-300 p-4 text-gray-500 dark:border-gray-700 dark:text-gray-400">{dt.ResourceGroup}</td>
          <td className="border border-gray-300 p-4 text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {dt.PastDowntimes.map(dt=>(
              <span key={dt.ResourceName + " " + dt.StartTime}>{dt.ResourceName}<br/></span>
            ))}
          </td>
          <td className="border border-gray-300 p-4 text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {dt.CurrentDowntimes.map(dt=>(
              <span key={dt.ResourceName + " " + dt.StartTime}>{dt.ResourceName}<br/></span>
            ))}
          </td>
          <td className="border border-gray-300 p-4 text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {dt.FutureDowntimes.map(dt=>(
              <span key={dt.ResourceName + " " + dt.StartTime}>{dt.ResourceName}<br/></span>
            ))}
          </td>
        </tr>)}
      </tbody>
    </table>
  )
}
